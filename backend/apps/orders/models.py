from django.db import models
import uuid


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('processing', 'En traitement'),
        ('shipped', 'Expédiée'),
        ('out_for_delivery', 'En cours de livraison'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
        ('return_requested', 'Retour demandé'),
        ('returned', 'Retournée'),
        ('refunded', 'Remboursée'),
    ]
    PAYMENT_METHODS = [
        ('card', 'Carte bancaire'),
        ('mobile', 'Paiement mobile'),
        ('cod', 'Paiement à la livraison'),
    ]
    PAYMENT_STATUS = [
        ('pending', 'En attente'),
        ('paid', 'Payée'),
        ('failed', 'Échouée'),
        ('refunded', 'Remboursée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='orders')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    stripe_payment_intent = models.CharField(max_length=255, blank=True)

    # Address snapshot
    shipping_address = models.JSONField()
    billing_address = models.JSONField(blank=True, null=True)

    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=3)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=3)

    coupon = models.ForeignKey('coupons.Coupon', on_delete=models.SET_NULL, null=True, blank=True)
    shipping_method = models.ForeignKey('shipping.ShippingMethod', on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)

    # Tracking
    tracking_number = models.CharField(max_length=100, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            import random, string
            self.order_number = 'SW-' + ''.join(random.choices(string.digits, k=8))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey('products.ProductVariant', on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=500)
    product_image = models.CharField(max_length=500, blank=True)
    variant_name = models.CharField(max_length=200, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=3)
    quantity = models.IntegerField(default=1)
    total = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        db_table = 'order_items'


class ReturnRequest(models.Model):
    REASONS = [
        ('defective', 'Produit défectueux'),
        ('wrong_item', 'Mauvais article'),
        ('not_as_described', 'Non conforme'),
        ('changed_mind', 'Changement d\'avis'),
        ('other', 'Autre'),
    ]
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
        ('completed', 'Complétée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='return_requests')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE)
    reason = models.CharField(max_length=30, choices=REASONS)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'return_requests'


class OrderStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=30)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'order_status_history'
        ordering = ['created_at']
