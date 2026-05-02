from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django.db import transaction
import stripe
from django.conf import settings


# ==================== CART SERIALIZERS & VIEWS ====================
class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    unit_price = serializers.ReadOnlyField()
    total = serializers.ReadOnlyField()
    stock = serializers.IntegerField(source='product.stock', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        from apps.cart.models import CartItem
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_slug', 'variant',
            'quantity', 'unit_price', 'total', 'stock', 'product_image'
        ]

    def get_product_image(self, obj):
        img = obj.product.images.filter(is_primary=True).first()
        if img and img.image:
            request = self.context.get('request')
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        from apps.cart.models import Cart
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'updated_at']


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_or_create_cart(self, user):
        from apps.cart.models import Cart
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def list(self, request):
        cart = self._get_or_create_cart(request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        from apps.cart.models import Cart, CartItem
        cart = self._get_or_create_cart(request.user)
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        quantity = int(request.data.get('quantity', 1))

        item, created = CartItem.objects.get_or_create(
            cart=cart, product_id=product_id, variant_id=variant_id,
            defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()

        return Response({'message': 'Produit ajouté au panier', 'cart_count': cart.total_items})

    @action(detail=True, methods=['patch'])
    def update_quantity(self, request, pk=None):
        from apps.cart.models import CartItem
        try:
            item = CartItem.objects.get(id=pk, cart__user=request.user)
            quantity = int(request.data.get('quantity', 1))
            if quantity <= 0:
                item.delete()
                return Response({'message': 'Produit retiré du panier'})
            item.quantity = quantity
            item.save()
            return Response({'message': 'Quantité mise à jour'})
        except CartItem.DoesNotExist:
            return Response({'error': 'Article non trouvé'}, status=404)

    @action(detail=True, methods=['delete'])
    def remove(self, request, pk=None):
        from apps.cart.models import CartItem
        try:
            CartItem.objects.get(id=pk, cart__user=request.user).delete()
            return Response({'message': 'Produit retiré du panier'})
        except CartItem.DoesNotExist:
            return Response({'error': 'Article non trouvé'}, status=404)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        from apps.cart.models import Cart
        Cart.objects.filter(user=request.user).delete()
        return Response({'message': 'Panier vidé'})


# ==================== ORDER SERIALIZERS ====================
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.orders.models import OrderItem
        model = OrderItem
        fields = ['id', 'product', 'variant', 'product_name', 'product_image',
                  'variant_name', 'sku', 'price', 'quantity', 'total']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        from apps.orders.models import Order
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display', 'payment_method',
            'payment_status', 'shipping_address', 'subtotal', 'shipping_cost',
            'discount_amount', 'total', 'tracking_number', 'estimated_delivery',
            'items', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_number', 'status', 'payment_status']


class CreateOrderSerializer(serializers.Serializer):
    address_id = serializers.UUIDField()
    shipping_method_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=['card', 'mobile', 'cod'])
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from apps.orders.models import Order
        return Order.objects.filter(user=self.request.user).prefetch_related('items')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        from apps.orders.models import Order, OrderItem, OrderStatusHistory
        from apps.cart.models import Cart
        from apps.users.models import Address
        from apps.shipping.models import ShippingMethod
        from apps.coupons.models import Coupon
        from apps.notifications.models import Notification
        from django.utils import timezone

        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Get cart
        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Votre panier est vide'}, status=400)

        # Get address
        try:
            address = Address.objects.get(id=data['address_id'], user=request.user)
        except Address.DoesNotExist:
            return Response({'error': 'Adresse non trouvée'}, status=400)

        # Get shipping method
        shipping = ShippingMethod.objects.get(id=data['shipping_method_id'])

        # Calculate prices
        subtotal = cart.subtotal
        shipping_cost = shipping.price
        if shipping.free_shipping_threshold and subtotal >= shipping.free_shipping_threshold:
            shipping_cost = 0

        discount_amount = 0
        coupon = None
        if data.get('coupon_code'):
            try:
                coupon = Coupon.objects.get(code=data['coupon_code'].upper())
                if coupon.is_valid() and subtotal >= coupon.min_order_amount:
                    if coupon.discount_type == 'percentage':
                        discount_amount = subtotal * (coupon.discount_value / 100)
                    else:
                        discount_amount = coupon.discount_value
                    if coupon.max_discount_amount:
                        discount_amount = min(discount_amount, coupon.max_discount_amount)
                    coupon.usage_count += 1
                    coupon.save()
            except Coupon.DoesNotExist:
                return Response({'error': 'Code promo invalide'}, status=400)

        total = subtotal + shipping_cost - discount_amount

        # Create order
        shipping_address = {
            'full_name': address.full_name,
            'phone': address.phone,
            'address_line1': address.address_line1,
            'address_line2': address.address_line2,
            'city': address.city,
            'state': address.state,
            'postal_code': address.postal_code,
            'country': address.country,
        }

        order = Order.objects.create(
            user=request.user,
            payment_method=data['payment_method'],
            shipping_address=shipping_address,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            discount_amount=discount_amount,
            total=total,
            coupon=coupon,
            shipping_method=shipping,
            notes=data.get('notes', ''),
        )

        # Create order items
        for cart_item in cart.items.select_related('product', 'variant').all():
            img = cart_item.product.images.filter(is_primary=True).first()
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                variant=cart_item.variant,
                product_name=cart_item.product.name,
                product_image=img.image.url if img and img.image else '',
                variant_name=cart_item.variant.name if cart_item.variant else '',
                sku=cart_item.product.sku,
                price=cart_item.unit_price,
                quantity=cart_item.quantity,
                total=cart_item.total,
            )
            # Update stock and sales count
            cart_item.product.stock -= cart_item.quantity
            cart_item.product.sales_count += cart_item.quantity
            cart_item.product.save(update_fields=['stock', 'sales_count'])

        # Clear cart
        cart.items.all().delete()

        # Create status history
        OrderStatusHistory.objects.create(order=order, status='pending', created_by=request.user)

        # Create notification
        Notification.objects.create(
            user=request.user,
            type='order_confirmed',
            title='Commande confirmée',
            message=f'Votre commande {order.order_number} a été reçue.',
            data={'order_id': str(order.id), 'order_number': order.order_number}
        )

        return Response(OrderSerializer(order).data, status=201)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        from apps.orders.models import Order, OrderStatusHistory
        from django.utils import timezone

        order = self.get_object()
        if order.status not in ['pending', 'confirmed']:
            return Response({'error': 'Cette commande ne peut pas être annulée'}, status=400)

        order.status = 'cancelled'
        order.cancelled_at = timezone.now()
        order.cancellation_reason = request.data.get('reason', '')
        order.save()

        # Restore stock
        for item in order.items.all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])

        OrderStatusHistory.objects.create(
            order=order, status='cancelled',
            comment=order.cancellation_reason, created_by=request.user
        )
        return Response({'message': 'Commande annulée'})

    @action(detail=True, methods=['post'])
    def return_request(self, request, pk=None):
        from apps.orders.models import ReturnRequest, OrderItem

        order = self.get_object()
        if order.status != 'delivered':
            return Response({'error': 'Retour possible uniquement pour les commandes livrées'}, status=400)

        item_id = request.data.get('order_item_id')
        reason = request.data.get('reason')
        description = request.data.get('description', '')

        try:
            order_item = OrderItem.objects.get(id=item_id, order=order)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Article non trouvé'}, status=404)

        ret = ReturnRequest.objects.create(
            order=order, order_item=order_item,
            reason=reason, description=description
        )
        return Response({'message': 'Demande de retour créée', 'id': str(ret.id)}, status=201)


# ==================== PAYMENT VIEWS ====================
from rest_framework.views import APIView

class CreatePaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.orders.models import Order
        order_id = request.data.get('order_id')

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Commande non trouvée'}, status=404)

        if not settings.STRIPE_SECRET_KEY:
            return Response(
                {'error': 'Paiement carte indisponible: Stripe non configuré.'},
                status=503
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(order.total * 1000),  # in millimes
                currency='tnd',
                metadata={'order_id': str(order.id), 'order_number': order.order_number},
            )
            order.stripe_payment_intent = intent.id
            order.save()
            return Response({'client_secret': intent.client_secret})
        except stripe.error.StripeError as exc:
            return Response({'error': f'Erreur Stripe: {str(exc)}'}, status=502)


class ValidateCouponView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.coupons.models import Coupon
        code = request.data.get('code', '').upper()
        cart_total = float(request.data.get('cart_total', 0))

        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
            if not coupon.is_valid():
                return Response({'error': 'Ce coupon est expiré ou épuisé'}, status=400)
            if cart_total < float(coupon.min_order_amount):
                return Response({'error': f'Montant minimum: {coupon.min_order_amount} DT'}, status=400)

            if coupon.discount_type == 'percentage':
                discount = cart_total * (float(coupon.discount_value) / 100)
            else:
                discount = float(coupon.discount_value)

            if coupon.max_discount_amount:
                discount = min(discount, float(coupon.max_discount_amount))

            return Response({
                'valid': True,
                'code': coupon.code,
                'discount_type': coupon.discount_type,
                'discount_value': str(coupon.discount_value),
                'discount_amount': round(discount, 3),
                'description': coupon.description,
            })
        except Coupon.DoesNotExist:
            return Response({'error': 'Code promo invalide'}, status=400)
