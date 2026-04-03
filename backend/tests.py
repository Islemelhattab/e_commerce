from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


# ==================== USER TESTS ====================
class UserAuthTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'

    def test_register_success(self):
        data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_register_password_mismatch(self):
        data = {
            'email': 'test2@example.com',
            'first_name': 'Test', 'last_name': 'User',
            'password': 'testpass123',
            'password_confirm': 'different123',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        User.objects.create_user(email='dup@example.com', first_name='A', last_name='B', password='pass')
        data = {
            'email': 'dup@example.com',
            'first_name': 'Test', 'last_name': 'User',
            'password': 'testpass123', 'password_confirm': 'testpass123',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        User.objects.create_user(email='login@example.com', first_name='L', last_name='U', password='pass1234')
        response = self.client.post(self.login_url, {'email': 'login@example.com', 'password': 'pass1234'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        User.objects.create_user(email='fail@example.com', first_name='F', last_name='U', password='pass1234')
        response = self.client.post(self.login_url, {'email': 'fail@example.com', 'password': 'wrongpass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_requires_auth(self):
        response = self.client.get('/api/user/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authenticated(self):
        user = User.objects.create_user(email='profile@example.com', first_name='P', last_name='U', password='pass1234')
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/user/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'profile@example.com')


# ==================== PRODUCT TESTS ====================
class ProductTests(APITestCase):
    def setUp(self):
        from apps.products.models import Category, Brand, Product
        self.client = APIClient()
        self.category = Category.objects.create(name='Test Cat', slug='test-cat')
        self.brand = Brand.objects.create(name='Test Brand', slug='test-brand')
        self.product = Product.objects.create(
            name='Test Product', slug='test-product',
            description='A test product', price=Decimal('99.000'),
            category=self.category, brand=self.brand, stock=10, sku='TEST-001'
        )

    def test_list_products(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_product_detail(self):
        response = self.client.get(f'/api/products/test-product/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Product')

    def test_product_filter_by_price(self):
        response = self.client.get('/api/products/?min_price=50&max_price=150')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for product in response.data['results']:
            self.assertGreaterEqual(float(product['price']), 50)
            self.assertLessEqual(float(product['price']), 150)

    def test_product_search(self):
        response = self.client.get('/api/products/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

    def test_inactive_product_not_listed(self):
        from apps.products.models import Product
        Product.objects.create(
            name='Inactive Product', slug='inactive-product',
            description='Inactive', price=Decimal('50.000'),
            stock=5, sku='INACT-001', is_active=False
        )
        response = self.client.get('/api/products/?search=Inactive')
        self.assertEqual(len(response.data['results']), 0)


# ==================== CART TESTS ====================
class CartTests(APITestCase):
    def setUp(self):
        from apps.products.models import Category, Product
        self.user = User.objects.create_user(
            email='cart@example.com', first_name='C', last_name='U', password='pass1234'
        )
        self.client.force_authenticate(user=self.user)
        cat = Category.objects.create(name='Cart Cat', slug='cart-cat')
        self.product = Product.objects.create(
            name='Cart Product', slug='cart-product',
            description='For cart', price=Decimal('50.000'),
            stock=20, sku='CART-001', category=cat
        )

    def test_get_empty_cart(self):
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_add_to_cart(self):
        response = self.client.post('/api/cart/add/', {
            'product_id': str(self.product.id),
            'quantity': 2
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('cart_count', response.data)
        self.assertEqual(response.data['cart_count'], 2)

    def test_add_to_cart_increases_quantity(self):
        self.client.post('/api/cart/add/', {'product_id': str(self.product.id), 'quantity': 1})
        self.client.post('/api/cart/add/', {'product_id': str(self.product.id), 'quantity': 2})
        response = self.client.get('/api/cart/')
        self.assertEqual(response.data['total_items'], 3)

    def test_cart_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ==================== COUPON TESTS ====================
class CouponTests(APITestCase):
    def setUp(self):
        from apps.coupons.models import Coupon
        self.user = User.objects.create_user(
            email='coupon@example.com', first_name='C', last_name='U', password='pass'
        )
        self.client.force_authenticate(user=self.user)
        now = timezone.now()
        self.coupon = Coupon.objects.create(
            code='TEST20',
            discount_type='percentage',
            discount_value=Decimal('20'),
            min_order_amount=Decimal('50.000'),
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=30),
            is_active=True,
        )

    def test_valid_coupon(self):
        response = self.client.post('/api/coupons/validate/', {
            'code': 'TEST20',
            'cart_total': 100
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(float(response.data['discount_amount']), 20.0)

    def test_invalid_coupon(self):
        response = self.client.post('/api/coupons/validate/', {
            'code': 'INVALID',
            'cart_total': 100
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_coupon_minimum_not_met(self):
        response = self.client.post('/api/coupons/validate/', {
            'code': 'TEST20',
            'cart_total': 30  # Below minimum of 50
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_coupon(self):
        from apps.coupons.models import Coupon
        expired = Coupon.objects.create(
            code='EXPIRED',
            discount_type='fixed',
            discount_value=Decimal('10'),
            valid_from=timezone.now() - timedelta(days=30),
            valid_until=timezone.now() - timedelta(days=1),
            is_active=True,
        )
        response = self.client.post('/api/coupons/validate/', {
            'code': 'EXPIRED', 'cart_total': 100
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ==================== ORDER TESTS ====================
class OrderTests(APITestCase):
    def setUp(self):
        from apps.products.models import Category, Product
        from apps.shipping.models import ShippingMethod
        from apps.users.models import Address

        self.user = User.objects.create_user(
            email='order@example.com', first_name='O', last_name='U', password='pass'
        )
        self.client.force_authenticate(user=self.user)

        cat = Category.objects.create(name='Ord Cat', slug='ord-cat')
        self.product = Product.objects.create(
            name='Order Product', slug='order-product',
            description='For ordering', price=Decimal('100.000'),
            stock=50, sku='ORD-001', category=cat
        )
        self.shipping = ShippingMethod.objects.create(
            name='Standard', price=Decimal('7.000'),
            estimated_days_min=2, estimated_days_max=5
        )
        self.address = Address.objects.create(
            user=self.user, full_name='Test User',
            phone='+21612345678', address_line1='123 Test St',
            city='Tunis', state='Tunis', postal_code='1000'
        )

        # Add product to cart first
        self.client.post('/api/cart/add/', {
            'product_id': str(self.product.id), 'quantity': 2
        })

    def test_create_order(self):
        response = self.client.post('/api/orders/', {
            'address_id': str(self.address.id),
            'shipping_method_id': str(self.shipping.id),
            'payment_method': 'cod',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('order_number', response.data)
        self.assertEqual(response.data['payment_method'], 'cod')

    def test_list_orders(self):
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_order_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ==================== REVIEW TESTS ====================
class ReviewTests(APITestCase):
    def setUp(self):
        from apps.products.models import Category, Product
        self.user = User.objects.create_user(
            email='review@example.com', first_name='R', last_name='U', password='pass'
        )
        self.client.force_authenticate(user=self.user)
        cat = Category.objects.create(name='Rev Cat', slug='rev-cat')
        self.product = Product.objects.create(
            name='Review Product', slug='review-product',
            description='Test', price=Decimal('50.000'), stock=10, sku='REV-001', category=cat
        )

    def test_create_review(self):
        response = self.client.post('/api/reviews/', {
            'product': str(self.product.id),
            'rating': 5,
            'title': 'Excellent produit',
            'comment': 'Je recommande vivement ce produit !'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)

    def test_list_product_reviews(self):
        response = self.client.get(f'/api/reviews/?product={self.product.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_review_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/reviews/', {
            'product': str(self.product.id), 'rating': 4, 'comment': 'Test'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
