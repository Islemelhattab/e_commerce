from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.users.views import (
    RegisterView, ProfileView, ChangePasswordView,
    AddressViewSet, WishlistViewSet,
    verify_email, forgot_password, reset_password
)
from apps.products.views import ProductViewSet, CategoryViewSet, BrandViewSet
from apps.orders.views import (
    CartViewSet, OrderViewSet,
    CreatePaymentIntentView, ValidateCouponView
)
from apps.admin_api.views import BannerView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='products')
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'brands', BrandViewSet, basename='brands')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'addresses', AddressViewSet, basename='addresses')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('admin/', admin.site.urls),
    # API Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Auth
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify-email/', verify_email, name='verify_email'),
    path('api/auth/forgot-password/', forgot_password, name='forgot_password'),
    path('api/auth/reset-password/', reset_password, name='reset_password'),
    # User
    path('api/user/profile/', ProfileView.as_view(), name='profile'),
    path('api/user/change-password/', ChangePasswordView.as_view(), name='change_password'),
    # Payment & Coupons
    path('api/payment/create-intent/', CreatePaymentIntentView.as_view(), name='create_payment_intent'),
    path('api/coupons/validate/', ValidateCouponView.as_view(), name='validate_coupon'),
    # Admin API (staff only)
    path('api/admin/', include('apps.admin_api.urls')),
    # Public endpoints
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/shipping/', include('apps.shipping.urls')),
    path('api/banners/', BannerView.as_view(), name='public-banners'),
    path('api/chat/', include('apps.chatbot.urls')),
    path('api/purchasing/', include('apps.purchasing.urls')),
    path('api/supplier-portal/', include('apps.purchasing.supplier_urls')),
    path('api/accounting/', include('apps.accounting.urls')),
    path('api/hr/', include('apps.hr.urls')),
    # Router
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
