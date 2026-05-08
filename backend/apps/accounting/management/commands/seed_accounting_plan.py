from django.core.management.base import BaseCommand


ACCOUNTS = [
    # Capitaux propres
    ('101000', 'Capital social',              'equity'),
    ('106000', 'Réserves',                    'equity'),
    ('120000', 'Résultat de l\'exercice',     'equity'),
    # Emprunts & dettes
    ('164000', 'Emprunts bancaires',          'liability'),
    # Immobilisations
    ('211000', 'Terrains',                    'asset'),
    ('215000', 'Matériel informatique',       'asset'),
    ('218000', 'Autres immobilisations',      'asset'),
    # Stocks
    ('310000', 'Stocks de marchandises',      'asset'),
    # Clients & fournisseurs
    ('401000', 'Fournisseurs',                'liability'),
    ('411000', 'Clients',                     'asset'),
    # TVA
    ('445620', 'TVA déductible',              'asset'),
    ('445710', 'TVA collectée',               'liability'),
    # Banque & caisse
    ('512000', 'Banque',                      'asset'),
    ('531000', 'Caisse',                      'asset'),
    # Charges
    ('601000', 'Achats de marchandises',      'expense'),
    ('604000', 'Achats de prestations',       'expense'),
    ('621000', 'Salaires et traitements',     'expense'),
    ('622000', 'Charges sociales (CNSS)',     'expense'),
    ('626000', 'Frais de transport',          'expense'),
    ('627000', 'Services bancaires',          'expense'),
    ('641000', 'Impôts et taxes',             'expense'),
    # Produits
    ('707000', 'Ventes de marchandises',      'revenue'),
    ('708000', 'Produits des activités ann.', 'revenue'),
    ('764000', 'Produits financiers',         'revenue'),
]


class Command(BaseCommand):
    help = 'Initialise le plan comptable tunisien minimal pour ShopWave ERP'

    def handle(self, *args, **options):
        from apps.accounting.models import AccountingAccount

        created = 0
        for code, name, atype in ACCOUNTS:
            _, was_created = AccountingAccount.objects.get_or_create(
                code=code,
                defaults={'name': name, 'account_type': atype}
            )
            if was_created:
                created += 1
                self.stdout.write(f'  ✓ {code} — {name}')

        self.stdout.write(self.style.SUCCESS(
            f'\nPlan comptable initialisé : {created} comptes créés '
            f'({len(ACCOUNTS) - created} déjà existants).'
        ))
