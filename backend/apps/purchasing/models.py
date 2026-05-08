import uuid
from django.db import models
from django.utils import timezone


class Supplier(models.Model):
    STATUS = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('blacklisted', 'Blacklisté'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name           = models.CharField(max_length=255)
    code           = models.CharField(max_length=50, unique=True)
    email          = models.EmailField(unique=True)
    phone          = models.CharField(max_length=30, blank=True)
    address        = models.TextField(blank=True)
    tax_id         = models.CharField(max_length=50, blank=True)
    payment_terms  = models.IntegerField(default=30)  # jours
    currency       = models.CharField(max_length=10, default='TND')
    status         = models.CharField(max_length=20, choices=STATUS, default='active')
    contact_person = models.CharField(max_length=200, blank=True)
    rating         = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    notes          = models.TextField(blank=True)
    user           = models.OneToOneField(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='supplier_profile'
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers'
        ordering = ['name']

    def __str__(self):
        return f"{self.code} — {self.name}"


class PurchaseOrder(models.Model):
    STATUS = [
        ('draft', 'Brouillon'),
        ('sent', 'Envoyé'),
        ('confirmed', 'Confirmé'),
        ('partial', 'Réception partielle'),
        ('received', 'Reçu'),
        ('cancelled', 'Annulé'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    po_number     = models.CharField(max_length=50, unique=True, blank=True)
    supplier      = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    status        = models.CharField(max_length=20, choices=STATUS, default='draft')
    expected_date = models.DateField(null=True, blank=True)
    received_date = models.DateField(null=True, blank=True)
    subtotal      = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    tax_amount    = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    total         = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    currency      = models.CharField(max_length=10, default='TND')
    notes         = models.TextField(blank=True)
    created_by    = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='purchase_orders_created'
    )
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.po_number:
            year = timezone.now().year
            count = PurchaseOrder.objects.filter(created_at__year=year).count() + 1
            self.po_number = f'BC-{year}-{count:04d}'
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        lines = self.lines.all()
        self.subtotal = sum(l.subtotal for l in lines)
        self.tax_amount = sum(l.subtotal * l.tax_rate / 100 for l in lines)
        self.total = self.subtotal + self.tax_amount
        self.save()

    def __str__(self):
        return self.po_number


class PurchaseOrderLine(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase_order   = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='lines')
    product          = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity_ordered = models.DecimalField(max_digits=10, decimal_places=3)
    quantity_received= models.DecimalField(max_digits=10, decimal_places=3, default=0)
    unit_price       = models.DecimalField(max_digits=10, decimal_places=3)
    tax_rate         = models.DecimalField(max_digits=5, decimal_places=2, default=19)  # TVA %
    subtotal         = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        db_table = 'purchase_order_lines'

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity_ordered * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.purchase_order.po_number} — {self.product.name}"


class SupplierInvoice(models.Model):
    STATUS = [
        ('pending', 'En attente'),
        ('validated', 'Validée'),
        ('paid', 'Payée'),
        ('disputed', 'Contestée'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=100)
    supplier       = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='invoices')
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='invoices'
    )
    status         = models.CharField(max_length=20, choices=STATUS, default='pending')
    amount_ht      = models.DecimalField(max_digits=12, decimal_places=3)
    amount_tva     = models.DecimalField(max_digits=12, decimal_places=3)
    amount_ttc     = models.DecimalField(max_digits=12, decimal_places=3)
    due_date       = models.DateField()
    paid_at        = models.DateField(null=True, blank=True)
    document       = models.FileField(upload_to='supplier_invoices/', blank=True, null=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supplier_invoices'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} — {self.supplier.name}"
