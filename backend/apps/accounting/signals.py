from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


def get_account(code):
    from .models import AccountingAccount
    try:
        return AccountingAccount.objects.get(code=code)
    except AccountingAccount.DoesNotExist:
        return None


@receiver(post_save, sender='orders.Order')
def create_sale_journal_entry(sender, instance, **kwargs):
    """Génère automatiquement l'écriture comptable lors d'une vente payée."""
    from .models import JournalEntry, JournalEntryLine

    if instance.payment_status != 'paid':
        return
    # Évite la double comptabilisation
    if JournalEntry.objects.filter(order=instance, source='sale').exists():
        return

    clients  = get_account('411000')
    revenue  = get_account('707000')
    tva      = get_account('445710')

    if not all([clients, revenue, tva]):
        return  # Plan comptable non initialisé

    entry = JournalEntry.objects.create(
        date=instance.created_at.date(),
        description=f'Vente client — {instance.order_number}',
        source='sale',
        order=instance,
        status='posted',
        posted_at=timezone.now(),
    )
    JournalEntryLine.objects.create(
        entry=entry, account=clients,
        label=f'Client {instance.user}',
        debit=instance.total, credit=0
    )
    JournalEntryLine.objects.create(
        entry=entry, account=revenue,
        label='Produits vendus (HT)',
        debit=0, credit=instance.subtotal
    )
    if instance.tax_amount and instance.tax_amount > 0:
        JournalEntryLine.objects.create(
            entry=entry, account=tva,
            label='TVA collectée 19%',
            debit=0, credit=instance.tax_amount
        )
