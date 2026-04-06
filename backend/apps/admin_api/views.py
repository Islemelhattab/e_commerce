from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework import serializers
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
import csv
import io

User = get_user_model()


# ==================== PERMISSIONS ====================
class IsAdminOrModerator(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and (
            request.user.is_staff or
            getattr(request.user, 'role', None) in ['admin', 'moderator']
        )


# ==================== DASHBOARD STATS ====================
class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from apps.orders.models import Order
        from apps.products.models import Product

        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start

        # Revenue this month vs last month
        this_month_rev = Order.objects.filter(
            created_at__gte=this_month_start,
            status__in=['confirmed', 'processing', 'shipped', 'delivered']
        ).aggregate(total=Sum('total'))['total'] or 0

        last_month_rev = Order.objects.filter(
            created_at__gte=last_month_start,
            created_at__lt=last_month_end,
            status__in=['confirmed', 'processing', 'shipped', 'delivered']
        ).aggregate(total=Sum('total'))['total'] or 0

        rev_change = float(((this_month_rev - last_month_rev) / last_month_rev * 100) if last_month_rev else 0)

        # Orders this month
        orders_this = Order.objects.filter(created_at__gte=this_month_start).count()
        orders_last = Order.objects.filter(created_at__gte=last_month_start, created_at__lt=last_month_end).count()
        orders_change = float(((orders_this - orders_last) / orders_last * 100) if orders_last else 0)

        # New customers
        users_this = User.objects.filter(date_joined__gte=this_month_start).count()
        users_last = User.objects.filter(date_joined__gte=last_month_start, date_joined__lt=last_month_end).count()
        users_change = float(((users_this - users_last) / users_last * 100) if users_last else 0)

        # Average order value
        avg_order = Order.objects.filter(
            created_at__gte=this_month_start,
            status__in=['confirmed', 'processing', 'shipped', 'delivered']
        ).aggregate(avg=Avg('total'))['avg'] or 0

        # Revenue last 30 days (daily)
        thirty_days_ago = now - timedelta(days=30)
        daily_revenue = list(
            Order.objects.filter(
                created_at__gte=thirty_days_ago,
                status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).annotate(day=TruncDay('created_at'))
            .values('day')
            .annotate(revenue=Sum('total'), orders=Count('id'))
            .order_by('day')
        )

        # Revenue last 12 months (monthly)
        twelve_months_ago = now - timedelta(days=365)
        monthly_revenue = list(
            Order.objects.filter(
                created_at__gte=twelve_months_ago,
                status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('total'), orders=Count('id'))
            .order_by('month')
        )

        # Orders by status
        orders_by_status = list(
            Order.objects.values('status').annotate(count=Count('id')).order_by('-count')
        )

        # Top products
        from apps.orders.models import OrderItem
        top_products = list(
            OrderItem.objects.values(
                'product__name', 'product__id'
            ).annotate(
                total_sold=Sum('quantity'),
                total_revenue=Sum('total')
            ).order_by('-total_sold')[:10]
        )

        # Top categories
        from apps.products.models import Category
        top_categories = list(
            OrderItem.objects.values(
                'product__category__name'
            ).annotate(
                total_sold=Sum('quantity'),
                total_revenue=Sum('total')
            ).order_by('-total_revenue')[:6]
        )

        # Low stock products
        low_stock = list(
            Product.objects.filter(stock__lte=5, is_active=True)
            .values('id', 'name', 'stock', 'sku')
            .order_by('stock')[:10]
        )

        # Pending orders count
        pending_orders = Order.objects.filter(status='pending').count()
        pending_returns = 0
        try:
            from apps.orders.models import ReturnRequest
            pending_returns = ReturnRequest.objects.filter(status='pending').count()
        except Exception:
            pass

        return Response({
            'kpis': {
                'revenue': {'value': float(this_month_rev), 'change': round(rev_change, 1)},
                'orders': {'value': orders_this, 'change': round(orders_change, 1)},
                'new_customers': {'value': users_this, 'change': round(users_change, 1)},
                'avg_order': {'value': float(avg_order), 'change': 0},
            },
            'daily_revenue': [
                {'date': d['day'].strftime('%Y-%m-%d'), 'revenue': float(d['revenue']), 'orders': d['orders']}
                for d in daily_revenue
            ],
            'monthly_revenue': [
                {'month': d['month'].strftime('%Y-%m'), 'revenue': float(d['revenue']), 'orders': d['orders']}
                for d in monthly_revenue
            ],
            'orders_by_status': orders_by_status,
            'top_products': [
                {
                    'name': p['product__name'],
                    'id': str(p['product__id']),
                    'total_sold': p['total_sold'],
                    'total_revenue': float(p['total_revenue'])
                } for p in top_products
            ],
            'top_categories': [
                {
                    'name': p['product__category__name'] or 'Sans catégorie',
                    'total_sold': p['total_sold'],
                    'total_revenue': float(p['total_revenue'])
                } for p in top_categories
            ],
            'low_stock': low_stock,
            'alerts': {
                'pending_orders': pending_orders,
                'pending_returns': pending_returns,
                'low_stock_count': len(low_stock),
            }
        })


# ==================== USER MANAGEMENT ====================
class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField(source='get_full_name')
    order_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'cin', 'first_name', 'last_name', 'full_name',
            'avatar', 'is_active', 'is_staff', 'is_email_verified',
            'date_joined', 'last_login', 'order_count', 'total_spent'
        ]

    def get_order_count(self, obj):
        return obj.orders.count()

    def get_total_spent(self, obj):
        result = obj.orders.filter(
            status__in=['delivered', 'shipped', 'processing', 'confirmed']
        ).aggregate(total=Sum('total'))['total']
        return float(result) if result else 0


class AdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone', 'cin']
    ordering_fields = ['date_joined', 'email', 'last_login']
    ordering = ['-date_joined']

    def get_queryset(self):
        qs = User.objects.all()
        is_active = self.request.query_params.get('is_active')
        is_staff = self.request.query_params.get('is_staff')
        if is_active is not None:
            qs = qs.filter(is_active=is_active == 'true')
        if is_staff is not None:
            qs = qs.filter(is_staff=is_staff == 'true')
        return qs

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({'error': 'Impossible de désactiver votre propre compte'}, status=400)
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'is_active': user.is_active, 'message': f'Compte {"activé" if user.is_active else "désactivé"}'})

    @action(detail=True, methods=['post'])
    def toggle_staff(self, request, pk=None):
        user = self.get_object()
        user.is_staff = not user.is_staff
        user.save(update_fields=['is_staff'])
        return Response({'is_staff': user.is_staff})

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        user = self.get_object()
        from apps.orders.models import Order
        orders = Order.objects.filter(user=user).order_by('-created_at')[:20]
        return Response({
            'orders': [
                {
                    'id': str(o.id), 'order_number': o.order_number,
                    'status': o.status, 'total': float(o.total),
                    'created_at': o.created_at.isoformat()
                } for o in orders
            ]
        })


# ==================== PRODUCT MANAGEMENT ====================
class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        from apps.products.models import Product
        model = Product
        fields = '__all__'

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and img.image:
            request = self.context.get('request')
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['created_at', 'price', 'stock', 'sales_count']
    ordering = ['-created_at']
    lookup_field = 'pk'

    def get_queryset(self):
        from apps.products.models import Product
        qs = Product.objects.select_related('category', 'brand').prefetch_related('images')
        category = self.request.query_params.get('category')
        brand = self.request.query_params.get('brand')
        is_active = self.request.query_params.get('is_active')
        low_stock = self.request.query_params.get('low_stock')
        if category:
            qs = qs.filter(category__slug=category)
        if brand:
            qs = qs.filter(brand__slug=brand)
        if is_active is not None:
            qs = qs.filter(is_active=is_active == 'true')
        if low_stock == 'true':
            qs = qs.filter(stock__lte=5)
        return qs

    def get_serializer_class(self):
        return AdminProductSerializer

    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        from apps.products.models import ProductImage
        product = self.get_object()
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'Aucune image fournie'}, status=400)
        is_primary = request.data.get('is_primary', 'false') == 'true'
        if is_primary:
            ProductImage.objects.filter(product=product).update(is_primary=False)
        img = ProductImage.objects.create(
            product=product, image=image,
            alt_text=request.data.get('alt_text', product.name),
            is_primary=is_primary
        )
        return Response({'id': str(img.id), 'image': request.build_absolute_uri(img.image.url)}, status=201)

    @action(detail=True, methods=['patch'])
    def update_stock(self, request, pk=None):
        product = self.get_object()
        stock = request.data.get('stock')
        if stock is None:
            return Response({'error': 'stock requis'}, status=400)
        product.stock = int(stock)
        product.save(update_fields=['stock'])
        return Response({'stock': product.stock})

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        from apps.products.models import Product
        import csv
        from django.http import HttpResponse
        products = Product.objects.select_related('category', 'brand').all()
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="products.csv"'
        response.write('\ufeff')
        writer = csv.writer(response)
        writer.writerow(['Nom', 'SKU', 'Catégorie', 'Marque', 'Prix', 'Stock', 'Actif', 'Ventes', 'Date création'])
        for p in products:
            writer.writerow([
                p.name, p.sku, p.category.name if p.category else '',
                p.brand.name if p.brand else '', p.price, p.stock,
                'Oui' if p.is_active else 'Non', p.sales_count,
                p.created_at.strftime('%d/%m/%Y')
            ])
        return response


# ==================== ORDER MANAGEMENT ====================
class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        from apps.orders.models import Order
        model = Order
        fields = '__all__'

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else 'Anonyme'

    def get_items_count(self, obj):
        return obj.items.count()


class AdminOrderViewSet(viewsets.ModelViewSet):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['order_number', 'user__email', 'tracking_number']
    ordering_fields = ['created_at', 'total', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        from apps.orders.models import Order
        qs = Order.objects.select_related('user', 'shipping_method').prefetch_related('items')
        status = self.request.query_params.get('status')
        payment_status = self.request.query_params.get('payment_status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if status:
            qs = qs.filter(status=status)
        if payment_status:
            qs = qs.filter(payment_status=payment_status)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        from apps.orders.models import Order, OrderStatusHistory
        order = self.get_object()
        new_status = request.data.get('status')
        comment = request.data.get('comment', '')
        tracking_number = request.data.get('tracking_number', '')

        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': 'Statut invalide'}, status=400)

        order.status = new_status
        if tracking_number:
            order.tracking_number = tracking_number
        if new_status == 'delivered':
            order.delivered_at = timezone.now()
        order.save()

        OrderStatusHistory.objects.create(
            order=order, status=new_status,
            comment=comment, created_by=request.user
        )

        # Notify user
        try:
            from apps.notifications.models import Notification
            status_labels = {
                'confirmed': 'Commande confirmée', 'shipped': 'Commande expédiée',
                'delivered': 'Commande livrée', 'cancelled': 'Commande annulée'
            }
            if new_status in status_labels:
                Notification.objects.create(
                    user=order.user, type=f'order_{new_status}',
                    title=status_labels[new_status],
                    message=f'Votre commande #{order.order_number} est {order.get_status_display().lower()}.',
                    data={'order_id': str(order.id), 'order_number': order.order_number}
                )
        except Exception:
            pass

        return Response({'status': order.status, 'message': 'Statut mis à jour'})

    @action(detail=True, methods=['post'])
    def update_payment(self, request, pk=None):
        order = self.get_object()
        payment_status = request.data.get('payment_status')
        if payment_status not in ['pending', 'paid', 'failed', 'refunded']:
            return Response({'error': 'Statut de paiement invalide'}, status=400)
        order.payment_status = payment_status
        order.save(update_fields=['payment_status'])
        return Response({'payment_status': order.payment_status})

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        from django.http import HttpResponse
        orders = self.get_queryset()
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="commandes.csv"'
        response.write('\ufeff')
        writer = csv.writer(response)
        writer.writerow(['N° commande', 'Client', 'Email', 'Statut', 'Paiement', 'Total', 'Date'])
        for o in orders:
            writer.writerow([
                o.order_number, o.user.get_full_name() if o.user else '',
                o.user.email if o.user else '', o.get_status_display(),
                o.get_payment_status_display() if hasattr(o, 'get_payment_status_display') else o.payment_status,
                o.total, o.created_at.strftime('%d/%m/%Y %H:%M')
            ])
        return response

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        """Return order data as JSON for frontend PDF generation."""
        orders = self.get_queryset()[:100]
        data = [
            {
                'order_number': o.order_number,
                'user': o.user.get_full_name() if o.user else '',
                'email': o.user.email if o.user else '',
                'status': o.get_status_display(),
                'total': float(o.total),
                'date': o.created_at.strftime('%d/%m/%Y')
            } for o in orders
        ]
        return Response({'orders': data, 'generated_at': timezone.now().isoformat()})


# ==================== RETURN REQUESTS MANAGEMENT ====================
class AdminReturnRequestSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    user_email = serializers.CharField(source='order.user.email', read_only=True)
    product_name = serializers.CharField(source='order_item.product_name', read_only=True)

    class Meta:
        from apps.orders.models import ReturnRequest
        model = ReturnRequest
        fields = '__all__'


class AdminReturnRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AdminReturnRequestSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        from apps.orders.models import ReturnRequest
        qs = ReturnRequest.objects.select_related('order', 'order__user', 'order_item')
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        ret = self.get_object()
        refund_amount = request.data.get('refund_amount')
        ret.status = 'approved'
        ret.admin_notes = request.data.get('notes', '')
        if refund_amount:
            ret.refund_amount = refund_amount
            # Update order payment status
            ret.order.payment_status = 'refunded'
            ret.order.save(update_fields=['payment_status'])
        ret.save()
        return Response({'status': 'approved', 'message': 'Retour approuvé'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        ret = self.get_object()
        ret.status = 'rejected'
        ret.admin_notes = request.data.get('notes', '')
        ret.save()
        return Response({'status': 'rejected', 'message': 'Retour rejeté'})


# ==================== REVIEW MODERATION ====================
class AdminReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    report_count = serializers.SerializerMethodField()

    class Meta:
        from apps.reviews.models import Review
        model = Review
        fields = '__all__'

    def get_report_count(self, obj):
        return obj.reports.count()


class AdminReviewViewSet(viewsets.ModelViewSet):
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'user__email', 'comment']
    ordering = ['-created_at']

    def get_queryset(self):
        from apps.reviews.models import Review
        qs = Review.objects.select_related('product', 'user').prefetch_related('reports')
        is_approved = self.request.query_params.get('is_approved')
        has_reports = self.request.query_params.get('has_reports')
        rating = self.request.query_params.get('rating')
        if is_approved is not None:
            qs = qs.filter(is_approved=is_approved == 'true')
        if has_reports == 'true':
            qs = qs.filter(reports__isnull=False).distinct()
        if rating:
            qs = qs.filter(rating=rating)
        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        review = self.get_object()
        review.is_approved = True
        review.save(update_fields=['is_approved'])
        return Response({'is_approved': True})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        review = self.get_object()
        review.is_approved = False
        review.save(update_fields=['is_approved'])
        return Response({'is_approved': False})


# ==================== COUPON MANAGEMENT ====================
class AdminCouponSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()
    is_valid_now = serializers.SerializerMethodField()

    class Meta:
        from apps.coupons.models import Coupon
        model = Coupon
        fields = '__all__'

    def get_is_expired(self, obj):
        return obj.valid_until < timezone.now()

    def get_is_valid_now(self, obj):
        return obj.is_valid()


class AdminCouponViewSet(viewsets.ModelViewSet):
    serializer_class = AdminCouponSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'description']

    def get_queryset(self):
        from apps.coupons.models import Coupon
        qs = Coupon.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active == 'true')
        return qs.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        coupon = self.get_object()
        coupon.is_active = not coupon.is_active
        coupon.save(update_fields=['is_active'])
        return Response({'is_active': coupon.is_active})


# ==================== NEWSLETTER / EMAIL CAMPAIGN ====================
class NewsletterSubscriber(serializers.Serializer):
    email = serializers.EmailField()


class SendNewsletterSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField()
    recipient_type = serializers.ChoiceField(
        choices=['all', 'active', 'custom'],
        default='all'
    )
    recipient_emails = serializers.ListField(
        child=serializers.EmailField(), required=False, default=list
    )


class NewsletterView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get newsletter stats."""
        total_users = User.objects.filter(is_active=True).count()
        return Response({
            'total_subscribers': total_users,
            'active_users': User.objects.filter(is_active=True, is_email_verified=True).count(),
        })

    def post(self, request):
        """Send newsletter/email campaign."""
        serializer = SendNewsletterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data['recipient_type'] == 'all':
            emails = list(User.objects.filter(is_active=True).values_list('email', flat=True))
        elif data['recipient_type'] == 'active':
            thirty_days_ago = timezone.now() - timedelta(days=30)
            emails = list(User.objects.filter(
                is_active=True, last_login__gte=thirty_days_ago
            ).values_list('email', flat=True))
        else:
            emails = data.get('recipient_emails', [])

        # Queue email sending via Celery
        try:
            from config.celery import app
            app.send_task('config.celery.send_bulk_email', kwargs={
                'subject': data['subject'],
                'message': data['message'],
                'recipient_list': emails[:1000],
            })
        except Exception:
            # Fallback: direct send for small lists
            from django.core.mail import send_mail
            from django.conf import settings
            if len(emails) <= 10:
                for email in emails:
                    send_mail(
                        subject=data['subject'],
                        message=data['message'],
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=True,
                    )

        return Response({
            'message': f'Newsletter envoyée à {len(emails)} destinataires',
            'recipients_count': len(emails)
        })


# ==================== ANALYTICS / REPORTS ====================
class ReportsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        report_type = request.query_params.get('type', 'sales')
        period = request.query_params.get('period', '30d')

        from apps.orders.models import Order, OrderItem
        from apps.products.models import Product

        days = {'7d': 7, '30d': 30, '90d': 90, '365d': 365}.get(period, 30)
        start_date = timezone.now() - timedelta(days=days)

        if report_type == 'sales':
            data = list(
                Order.objects.filter(
                    created_at__gte=start_date,
                    status__in=['confirmed', 'processing', 'shipped', 'delivered']
                ).annotate(day=TruncDay('created_at'))
                .values('day')
                .annotate(
                    revenue=Sum('total'),
                    orders=Count('id'),
                    avg_value=Avg('total')
                ).order_by('day')
            )
            return Response([{
                'date': d['day'].strftime('%Y-%m-%d'),
                'revenue': float(d['revenue']),
                'orders': d['orders'],
                'avg_value': float(d['avg_value'])
            } for d in data])

        elif report_type == 'products':
            data = list(
                OrderItem.objects.filter(order__created_at__gte=start_date)
                .values('product__name', 'product__id', 'product__category__name')
                .annotate(
                    total_sold=Sum('quantity'),
                    total_revenue=Sum('total')
                ).order_by('-total_revenue')[:20]
            )
            return Response([{
                'name': d['product__name'],
                'category': d['product__category__name'],
                'total_sold': d['total_sold'],
                'total_revenue': float(d['total_revenue'])
            } for d in data])

        elif report_type == 'customers':
            data = list(
                User.objects.filter(date_joined__gte=start_date)
                .annotate(day=TruncDay('date_joined'))
                .values('day')
                .annotate(count=Count('id'))
                .order_by('day')
            )
            return Response([{
                'date': d['day'].strftime('%Y-%m-%d'),
                'new_customers': d['count']
            } for d in data])

        return Response({'error': 'Type de rapport invalide'}, status=400)


# ==================== BANNER MANAGEMENT ====================
class PromoBannerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=200)
    subtitle = serializers.CharField(max_length=500, required=False, allow_blank=True)
    cta_text = serializers.CharField(max_length=100, default='Voir les offres')
    cta_link = serializers.CharField(max_length=200, default='/products')
    background_color = serializers.CharField(max_length=20, default='#0A0A0F')
    text_color = serializers.CharField(max_length=20, default='#FFFFFF')
    is_active = serializers.BooleanField(default=True)
    start_date = serializers.DateTimeField(required=False, allow_null=True)
    end_date = serializers.DateTimeField(required=False, allow_null=True)


# Simple in-memory banner store (replace with DB model in production)
BANNERS = [
    {
        'id': 1, 'title': 'Soldes d\'été — Jusqu\'à 60% OFF',
        'subtitle': 'Profitez de nos meilleures offres sur une sélection premium',
        'cta_text': 'Voir les offres', 'cta_link': '/products?discount=true',
        'background_color': '#0A0A0F', 'text_color': '#FFFFFF',
        'is_active': True, 'start_date': None, 'end_date': None
    }
]

class BannerView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [IsAdminUser()]

    def get(self, request):
        active = [b for b in BANNERS if b['is_active']]
        return Response(active)

    def post(self, request):
        serializer = PromoBannerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        banner = dict(serializer.validated_data)
        banner['id'] = max((b['id'] for b in BANNERS), default=0) + 1
        BANNERS.append(banner)
        return Response(banner, status=201)

    def patch(self, request):
        banner_id = request.data.get('id')
        for b in BANNERS:
            if b['id'] == banner_id:
                b.update(request.data)
                return Response(b)
        return Response({'error': 'Bannière non trouvée'}, status=404)
