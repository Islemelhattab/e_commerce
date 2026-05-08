import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone


class Department(models.Model):
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name     = models.CharField(max_length=200)
    code     = models.CharField(max_length=20, unique=True)
    manager  = models.ForeignKey(
        'Employee', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='managed_departments'
    )
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'hr_departments'
        ordering = ['name']

    def __str__(self):
        return f"{self.code} — {self.name}"


class Employee(models.Model):
    CONTRACT = [
        ('cdi', 'CDI'),
        ('cdd', 'CDD'),
        ('interim', 'Intérim'),
        ('freelance', 'Freelance'),
    ]
    STATUS = [
        ('active', 'Actif'),
        ('suspended', 'Suspendu'),
        ('terminated', 'Terminé'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user          = models.OneToOneField(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='employee_profile'
    )
    employee_id   = models.CharField(max_length=30, unique=True, blank=True)
    first_name    = models.CharField(max_length=100)
    last_name     = models.CharField(max_length=100)
    email         = models.EmailField(unique=True)
    phone         = models.CharField(max_length=30, blank=True)
    cin           = models.CharField(max_length=20, unique=True)
    department    = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees'
    )
    job_title     = models.CharField(max_length=200)
    contract_type = models.CharField(max_length=20, choices=CONTRACT, default='cdi')
    hire_date     = models.DateField()
    end_date      = models.DateField(null=True, blank=True)
    base_salary   = models.DecimalField(max_digits=10, decimal_places=3)  # TND/mois
    cnss_number   = models.CharField(max_length=30, blank=True)
    bank_account  = models.CharField(max_length=50, blank=True)   # RIB
    status        = models.CharField(max_length=20, choices=STATUS, default='active')
    avatar        = models.ImageField(upload_to='employees/', blank=True, null=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_employees'
        ordering = ['last_name', 'first_name']

    def save(self, *args, **kwargs):
        if not self.employee_id:
            count = Employee.objects.count() + 1
            self.employee_id = f'EMP-{count:04d}'
        super().save(*args, **kwargs)

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'

    def __str__(self):
        return f"{self.employee_id} — {self.get_full_name()}"


class LeaveRequest(models.Model):
    TYPES = [
        ('annual', 'Congé annuel'),
        ('sick', 'Maladie'),
        ('maternity', 'Maternité/Paternité'),
        ('unpaid', 'Sans solde'),
        ('other', 'Autre'),
    ]
    STATUS = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Refusé'),
        ('cancelled', 'Annulé'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee    = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type  = models.CharField(max_length=20, choices=TYPES)
    start_date  = models.DateField()
    end_date    = models.DateField()
    days        = models.IntegerField(default=0)
    reason      = models.TextField(blank=True)
    status      = models.CharField(max_length=20, choices=STATUS, default='pending')
    reviewed_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hr_leave_requests'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.start_date and self.end_date:
            delta = self.end_date - self.start_date
            self.days = delta.days + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.get_full_name()} — {self.leave_type} ({self.days}j)"


class Payroll(models.Model):
    STATUS = [
        ('draft', 'Brouillon'),
        ('validated', 'Validée'),
        ('paid', 'Payée'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee      = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='payrolls')
    period_month  = models.IntegerField()   # 1-12
    period_year   = models.IntegerField()
    base_salary   = models.DecimalField(max_digits=10, decimal_places=3)
    bonus         = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0'))
    allowances    = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0'))
    gross_salary  = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0'))
    cnss_employee = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0'))
    cnss_employer = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0'))
    irpp          = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0'))
    deductions    = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0'))
    net_salary    = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0'))
    status        = models.CharField(max_length=20, choices=STATUS, default='draft')
    paid_at       = models.DateField(null=True, blank=True)
    journal_entry = models.ForeignKey(
        'accounting.JournalEntry', on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hr_payrolls'
        unique_together = ('employee', 'period_month', 'period_year')
        ordering = ['-period_year', '-period_month']

    def calculate(self):
        """Calcule les cotisations selon le barème tunisien 2026."""
        self.gross_salary  = self.base_salary + self.bonus + self.allowances
        # CNSS salarié : 9.18%
        self.cnss_employee = round(self.gross_salary * Decimal('0.0918'), 3)
        # CNSS patronal : 16.57%
        self.cnss_employer = round(self.gross_salary * Decimal('0.1657'), 3)
        # Base imposable IRPP
        taxable = self.gross_salary - self.cnss_employee
        self.irpp = self._compute_irpp_annual(taxable * 12) / 12
        self.irpp = round(self.irpp, 3)
        self.net_salary = round(
            self.gross_salary - self.cnss_employee - self.irpp - self.deductions, 3
        )
        self.save()

    def _compute_irpp_annual(self, annual_taxable):
        """Barème IRPP Tunisie 2026 (tranches annuelles)."""
        brackets = [
            (5000,   Decimal('0')),
            (15000,  Decimal('0.26')),
            (30000,  Decimal('0.28')),
            (50000,  Decimal('0.32')),
            (float('inf'), Decimal('0.35')),
        ]
        tax = Decimal('0')
        prev = Decimal('0')
        for ceiling, rate in brackets:
            if annual_taxable <= prev:
                break
            taxable_in_bracket = min(Decimal(str(ceiling)), annual_taxable) - prev
            if taxable_in_bracket > 0:
                tax += taxable_in_bracket * rate
            prev = Decimal(str(ceiling))
        return tax

    def post_to_accounting(self):
        """Génère l'écriture comptable de la paie."""
        from apps.accounting.models import JournalEntry, JournalEntryLine, AccountingAccount

        salary_acc = AccountingAccount.objects.filter(code='621000').first()
        cnss_acc   = AccountingAccount.objects.filter(code='622000').first()
        bank_acc   = AccountingAccount.objects.filter(code='512000').first()

        if not all([salary_acc, cnss_acc, bank_acc]):
            return

        entry = JournalEntry.objects.create(
            date=timezone.now().date(),
            description=f'Paie {self.employee.get_full_name()} — {self.period_month:02d}/{self.period_year}',
            source='payroll',
            status='posted',
            posted_at=timezone.now(),
        )
        JournalEntryLine.objects.create(
            entry=entry, account=salary_acc,
            label='Salaire brut', debit=self.gross_salary, credit=0
        )
        JournalEntryLine.objects.create(
            entry=entry, account=cnss_acc,
            label='CNSS patronal', debit=self.cnss_employer, credit=0
        )
        JournalEntryLine.objects.create(
            entry=entry, account=bank_acc,
            label='Net versé', debit=0, credit=self.net_salary
        )
        self.journal_entry = entry
        self.save()

    def __str__(self):
        return f"{self.employee.get_full_name()} — {self.period_month:02d}/{self.period_year}"
