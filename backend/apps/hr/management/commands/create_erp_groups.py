from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


ERP_GROUPS = {
    'Fournisseur': [
        ('purchasing', 'purchaseorder', 'view'),
        ('purchasing', 'supplierinvoice', 'add'),
        ('purchasing', 'supplierinvoice', 'view'),
    ],
    'Comptable': [
        ('accounting', 'journalentry', 'view'),
        ('accounting', 'journalentry', 'add'),
        ('accounting', 'journalentry', 'change'),
        ('accounting', 'accountingaccount', 'view'),
        ('accounting', 'fiscalperiod', 'view'),
        ('accounting', 'fiscalperiod', 'change'),
        ('purchasing', 'supplierinvoice', 'view'),
        ('purchasing', 'supplierinvoice', 'change'),
    ],
    'Responsable RH': [
        ('hr', 'employee', 'add'),
        ('hr', 'employee', 'view'),
        ('hr', 'employee', 'change'),
        ('hr', 'department', 'add'),
        ('hr', 'department', 'view'),
        ('hr', 'department', 'change'),
        ('hr', 'leaverequest', 'view'),
        ('hr', 'leaverequest', 'change'),
        ('hr', 'payroll', 'add'),
        ('hr', 'payroll', 'view'),
        ('hr', 'payroll', 'change'),
    ],
}


class Command(BaseCommand):
    help = 'Crée les groupes de permissions ERP (Fournisseur, Comptable, Responsable RH)'

    def handle(self, *args, **options):
        for group_name, perms in ERP_GROUPS.items():
            group, created = Group.objects.get_or_create(name=group_name)
            action = 'créé' if created else 'mis à jour'

            for app_label, model_name, codename_prefix in perms:
                try:
                    ct = ContentType.objects.get(app_label=app_label, model=model_name)
                    perm = Permission.objects.get(
                        content_type=ct,
                        codename=f'{codename_prefix}_{model_name}'
                    )
                    group.permissions.add(perm)
                except (ContentType.DoesNotExist, Permission.DoesNotExist) as e:
                    self.stdout.write(self.style.WARNING(f'  ⚠ Permission manquante: {e}'))

            self.stdout.write(self.style.SUCCESS(f'  ✓ Groupe "{group_name}" {action}'))

        self.stdout.write(self.style.SUCCESS('\nGroupes ERP configurés avec succès.'))
