from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with demo data for ShopWave'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding ShopWave demo data...\n')

        self._create_superuser()
        self._create_categories()
        self._create_brands()
        self._create_shipping_methods()
        self._create_coupons()
        self._create_products()
        self._create_demo_users()
        self._seed_chatbot()

        self.stdout.write(self.style.SUCCESS('\n✅ Demo data seeded successfully!'))

    def _create_superuser(self):
        if not User.objects.filter(email='admin@shopwave.tn').exists():
            User.objects.create_superuser(
                email='admin@shopwave.tn',
                password='admin123',
                first_name='Admin',
                last_name='ShopWave',
            )
            self.stdout.write('  ✓ Superuser: admin@shopwave.tn / admin123')

    def _create_categories(self):
        from apps.products.models import Category
        categories = [
            {'name': 'Électronique', 'slug': 'electronics', 'order': 1},
            {'name': 'Mode & Vêtements', 'slug': 'fashion', 'order': 2},
            {'name': 'Maison & Déco', 'slug': 'home', 'order': 3},
            {'name': 'Sports & Loisirs', 'slug': 'sports', 'order': 4},
            {'name': 'Beauté & Santé', 'slug': 'beauty', 'order': 5},
            {'name': 'Livres & Éducation', 'slug': 'books', 'order': 6},
            {'name': 'Jeux & Jouets', 'slug': 'toys', 'order': 7},
            {'name': 'Auto & Moto', 'slug': 'auto', 'order': 8},
        ]
        sub_categories = [
            {'name': 'Smartphones', 'slug': 'smartphones', 'parent_slug': 'electronics'},
            {'name': 'Ordinateurs', 'slug': 'computers', 'parent_slug': 'electronics'},
            {'name': 'TV & Audio', 'slug': 'tv-audio', 'parent_slug': 'electronics'},
            {'name': 'Vêtements Homme', 'slug': 'mens-clothing', 'parent_slug': 'fashion'},
            {'name': 'Vêtements Femme', 'slug': 'womens-clothing', 'parent_slug': 'fashion'},
            {'name': 'Chaussures', 'slug': 'shoes', 'parent_slug': 'fashion'},
        ]

        for cat_data in categories:
            Category.objects.get_or_create(slug=cat_data['slug'], defaults=cat_data)

        for sub_data in sub_categories:
            parent_slug = sub_data.pop('parent_slug')
            try:
                parent = Category.objects.get(slug=parent_slug)
                Category.objects.get_or_create(slug=sub_data['slug'], defaults={**sub_data, 'parent': parent})
            except Category.DoesNotExist:
                pass

        self.stdout.write(f'  ✓ {Category.objects.count()} catégories créées')

    def _create_brands(self):
        from apps.products.models import Brand
        brands = [
            {'name': 'Samsung', 'slug': 'samsung'},
            {'name': 'Apple', 'slug': 'apple'},
            {'name': 'Nike', 'slug': 'nike'},
            {'name': 'Adidas', 'slug': 'adidas'},
            {'name': 'Sony', 'slug': 'sony'},
            {'name': 'LG', 'slug': 'lg'},
            {'name': 'Xiaomi', 'slug': 'xiaomi'},
            {'name': 'Zara', 'slug': 'zara'},
            {'name': 'H&M', 'slug': 'hm'},
            {'name': 'IKEA', 'slug': 'ikea'},
        ]
        for b in brands:
            Brand.objects.get_or_create(slug=b['slug'], defaults=b)
        self.stdout.write(f'  ✓ {Brand.objects.count()} marques créées')

    def _create_shipping_methods(self):
        from apps.shipping.models import ShippingMethod
        methods = [
            {
                'name': 'Livraison standard',
                'description': 'Livraison partout en Tunisie',
                'price': Decimal('7.000'),
                'estimated_days_min': 2,
                'estimated_days_max': 5,
                'free_shipping_threshold': Decimal('150.000'),
            },
            {
                'name': 'Livraison express',
                'description': 'Livraison le lendemain',
                'price': Decimal('15.000'),
                'estimated_days_min': 1,
                'estimated_days_max': 1,
                'free_shipping_threshold': None,
            },
            {
                'name': 'Retrait en magasin',
                'description': 'Disponible à Tunis, Sfax, Sousse',
                'price': Decimal('0.000'),
                'estimated_days_min': 1,
                'estimated_days_max': 2,
            },
        ]
        for m in methods:
            ShippingMethod.objects.get_or_create(name=m['name'], defaults=m)
        self.stdout.write(f'  ✓ {ShippingMethod.objects.count()} modes de livraison créés')

    def _create_coupons(self):
        from apps.coupons.models import Coupon
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        coupons = [
            {
                'code': 'BIENVENUE10',
                'description': '10% de réduction pour les nouveaux clients',
                'discount_type': 'percentage',
                'discount_value': Decimal('10'),
                'min_order_amount': Decimal('50.000'),
                'max_discount_amount': Decimal('30.000'),
                'usage_limit': 1000,
                'valid_from': now,
                'valid_until': now + timedelta(days=365),
            },
            {
                'code': 'ETE2024',
                'description': 'Soldes d\'été - 15% OFF',
                'discount_type': 'percentage',
                'discount_value': Decimal('15'),
                'min_order_amount': Decimal('100.000'),
                'usage_limit': 500,
                'valid_from': now,
                'valid_until': now + timedelta(days=90),
            },
            {
                'code': 'LIVRAISON',
                'description': '5 DT de réduction sur votre commande',
                'discount_type': 'fixed',
                'discount_value': Decimal('5.000'),
                'min_order_amount': Decimal('30.000'),
                'valid_from': now,
                'valid_until': now + timedelta(days=180),
            },
        ]
        for c in coupons:
            Coupon.objects.get_or_create(code=c['code'], defaults=c)
        self.stdout.write(f'  ✓ {Coupon.objects.count()} coupons créés')

    def _create_products(self):
        from apps.products.models import Product, Category, Brand, ProductAttribute, Tag

        if Product.objects.count() > 5:
            self.stdout.write(f'  ↳ Produits déjà présents, skip')
            return

        electronics = Category.objects.filter(slug='electronics').first()
        fashion = Category.objects.filter(slug='fashion').first()
        home_cat = Category.objects.filter(slug='home').first()

        samsung = Brand.objects.filter(slug='samsung').first()
        apple = Brand.objects.filter(slug='apple').first()
        nike = Brand.objects.filter(slug='nike').first()
        xiaomi = Brand.objects.filter(slug='xiaomi').first()

        products_data = [
            # Electronics
            {
                'name': 'Samsung Galaxy S24 Ultra',
                'slug': 'samsung-galaxy-s24-ultra',
                'description': 'Le flagship ultime de Samsung avec S Pen intégré, caméra 200MP, processeur Snapdragon 8 Gen 3.',
                'short_description': 'Smartphone premium avec S Pen et caméra 200MP',
                'category': electronics,
                'brand': samsung,
                'price': Decimal('3299.000'),
                'compare_price': Decimal('3599.000'),
                'sku': 'SAM-S24U-001',
                'stock': 45,
                'is_featured': True,
                'is_new': True,
            },
            {
                'name': 'iPhone 15 Pro Max',
                'slug': 'iphone-15-pro-max',
                'description': 'Le meilleur iPhone jamais conçu. Titane aéronautique, puce A17 Pro, appareil photo professionnel.',
                'short_description': 'iPhone en titane avec puce A17 Pro',
                'category': electronics,
                'brand': apple,
                'price': Decimal('4299.000'),
                'compare_price': None,
                'sku': 'APL-15PM-001',
                'stock': 28,
                'is_featured': True,
                'is_new': True,
            },
            {
                'name': 'Xiaomi Redmi Note 13 Pro',
                'slug': 'xiaomi-redmi-note-13-pro',
                'description': 'Excellent rapport qualité/prix avec écran AMOLED 120Hz, caméra 200MP et charge rapide 67W.',
                'short_description': 'Caméra 200MP, AMOLED 120Hz, charge 67W',
                'category': electronics,
                'brand': xiaomi,
                'price': Decimal('599.000'),
                'compare_price': Decimal('699.000'),
                'sku': 'XIA-RN13P-001',
                'stock': 120,
                'is_featured': False,
                'is_new': True,
            },
            {
                'name': 'Samsung QLED 65" 4K Smart TV',
                'slug': 'samsung-qled-65-4k',
                'description': 'Téléviseur QLED 65 pouces avec résolution 4K, HDR10+, Tizen OS et assistant vocal intégré.',
                'short_description': 'TV QLED 4K 65" avec Smart TV Tizen',
                'category': electronics,
                'brand': samsung,
                'price': Decimal('2199.000'),
                'compare_price': Decimal('2799.000'),
                'sku': 'SAM-TV65-001',
                'stock': 15,
                'is_featured': True,
            },
            {
                'name': 'Apple MacBook Pro 14" M3',
                'slug': 'macbook-pro-14-m3',
                'description': 'MacBook Pro avec puce M3, 16 Go RAM, SSD 512 Go, écran Liquid Retina XDR 14.2 pouces.',
                'short_description': 'Laptop pro avec puce M3, 16 Go RAM',
                'category': electronics,
                'brand': apple,
                'price': Decimal('5999.000'),
                'compare_price': Decimal('6499.000'),
                'sku': 'APL-MBP14-001',
                'stock': 20,
                'is_featured': True,
                'is_new': True,
            },
            # Fashion
            {
                'name': 'Nike Air Max 270 React',
                'slug': 'nike-air-max-270-react',
                'description': 'Les Air Max 270 React offrent un amorti exceptionnel avec la technologie React plus grande unité Air.',
                'short_description': 'Sneakers running avec Air Max et React',
                'category': fashion,
                'brand': nike,
                'price': Decimal('329.000'),
                'compare_price': Decimal('389.000'),
                'sku': 'NIK-AM270-001',
                'stock': 80,
                'is_featured': True,
            },
            {
                'name': 'Adidas Ultraboost 23',
                'slug': 'adidas-ultraboost-23',
                'description': 'Chaussures de running premium avec semelle BOOST pour un confort maximal sur la durée.',
                'short_description': 'Running premium avec technologie BOOST',
                'category': fashion,
                'brand': Brand.objects.filter(slug='adidas').first(),
                'price': Decimal('289.000'),
                'compare_price': Decimal('349.000'),
                'sku': 'ADI-UB23-001',
                'stock': 65,
                'is_featured': False,
                'is_new': True,
            },
            # Home
            {
                'name': 'Canapé d\'angle moderne',
                'slug': 'canape-angle-moderne',
                'description': 'Canapé d\'angle en tissu velours doux, avec méridienne convertible et rangement intégré.',
                'short_description': 'Canapé angle velours avec méridienne',
                'category': home_cat,
                'brand': Brand.objects.filter(slug='ikea').first(),
                'price': Decimal('1299.000'),
                'compare_price': Decimal('1599.000'),
                'sku': 'IKE-CAN-001',
                'stock': 8,
                'is_featured': True,
            },
        ]

        for p_data in products_data:
            product, created = Product.objects.get_or_create(
                slug=p_data['slug'], defaults=p_data
            )
            if created:
                # Add sample attributes
                if p_data.get('category') == electronics:
                    ProductAttribute.objects.create(product=product, name='Système', value='Android 14 / iOS 17')
                    ProductAttribute.objects.create(product=product, name='Garantie', value='1 an constructeur')

        self.stdout.write(f'  ✓ {Product.objects.count()} produits créés')

    def _create_demo_users(self):
        demo_users = [
            {'email': 'client@demo.tn', 'first_name': 'Mohamed', 'last_name': 'Ben Salah', 'password': 'demo1234'},
            {'email': 'test@shopwave.tn', 'first_name': 'Fatma', 'last_name': 'Khelifi', 'password': 'test1234'},
        ]
        for u in demo_users:
            if not User.objects.filter(email=u['email']).exists():
                pw = u.pop('password')
                user = User.objects.create_user(**u, is_email_verified=True)
                user.set_password(pw)
                user.save()

        self.stdout.write(f'  ✓ Utilisateurs démo créés')
        self.stdout.write('\n  📋 Accès:')
        self.stdout.write('     Admin:  admin@shopwave.tn / admin123')
        self.stdout.write('     Client: client@demo.tn / demo1234')


    def _seed_chatbot(self):
        try:
            from apps.chatbot.seed import seed_chatbot
            seed_chatbot()
        except Exception as e:
            self.stdout.write(f'  ⚠ Chatbot seed skipped: {e}')
