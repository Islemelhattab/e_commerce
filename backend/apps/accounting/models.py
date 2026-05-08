import uuid
from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError


class AccountingAccount(models.Model):
    TYPES = [
        ('asset', 'Actif'),
        ('liability', 'Passif'),
        ('revenue', 'Produit'),
        ('expense', 'Charge'),
        ('equity', 'Capitaux propres'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code         = models.CharField(max_length=20, unique=True)
    name         = models.CharField(max_length=255)
    account_type = models.CharField(max_length=20, choices=TYPES)
    parent       = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='children'
    )
    is_active    = models.BooleanField(default=True)
    description  = models.TextField(blank=True)

    class Meta:
        db_table = 'accounting_accounts'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} — {self.name}"


class FiscalPeriod(models.Model):
    STATUS = [('open', 'Ouverte'), ('closed', 'Clôturée')]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date   = models.DateField()
    status     = models.CharField(max_length=10, choices=STATUS, default='open')
    closed_by  = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    closed_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'fiscal_periods'
        ordering = ['-start_date']

    def __str__(self):
        return self.name


class JournalEntry(models.Model):
    SOURCE = [
        ('sale', 'Vente'),
        ('purchase', 'Achat'),
        ('payment', 'Paiement'),
        ('payroll', 'Paie'),
        ('manual', 'Manuel'),
        ('adjustment', 'Ajustement'),
    ]
    STATUS = [
        ('draft', 'Brouillon'),
        ('posted', 'Validée'),
        ('cancelled', 'Annulée'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry_number   = models.CharField(max_length=50, unique=True, blank=True)
    date           = models.DateField()
    description    = models.CharField(max_length=500)
    source         = models.CharField(max_length=20, choices=SOURCE)
    status         = models.CharField(max_length=20, choices=STATUS, default='draft')
    fiscal_period  = models.ForeignKey(
        FiscalPeriod, on_delete=models.SET_NULL, null=True, blank=True
    )
    # Liens vers documents sources
    order          = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL, null=True, blank=True
    )
    purchase_order = models.ForeignKey(
        'purchasing.PurchaseOrder', on_delete=models.SET_NULL, null=True, blank=True
    )
    created_by     = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    posted_at      = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'journal_entries'
        ordering = ['-date', '-created_at']
        verbose_name_plural = 'Journal Entries'

    def save(self, *args, **kwargs):
        if not self.entry_number:
            from django.utils import timezone
            year = timezone.now().year
            count = JournalEntry.objects.filter(created_at__year=year).count() + 1
            self.entry_number = f'EC-{year}-{count:05d}'
        super().save(*args, **kwargs)

    def is_balanced(self):
        lines = self.lines.all()
        total_debit  = sum(l.debit  for l in lines)
        total_credit = sum(l.credit for l in lines)
        return abs(total_debit - total_credit) < Decimal('0.001')

    def post(self, user=None):
        """Valider l'écriture (irréversible)."""
        if not self.is_balanced():
            raise ValidationError("L'écriture n'est pas équilibrée (débit ≠ crédit).")
        from django.utils import timezone
        self.status = 'posted'
        self.posted_at = timezone.now()
        if user:
            self.created_by = user
        self.save()

    def __str__(self):
        return f"{self.entry_number} — {self.description}"


class JournalEntryLine(models.Model):
    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry   = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(AccountingAccount, on_delete=models.PROTECT)
    label   = models.CharField(max_length=255)
    debit   = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal('0'))
    credit  = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal('0'))

    class Meta:
        db_table = 'journal_entry_lines'

    def clean(self):
        if self.debit > 0 and self.credit > 0:
            raise ValidationError("Une ligne ne peut avoir à la fois un débit et un crédit.")
        if self.debit < 0 or self.credit < 0:
            raise ValidationError("Les montants doivent être positifs.")

    def __str__(self):
        return f"{self.account.code} D:{self.debit} C:{self.credit}"
