from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardStatsView, AdminUserViewSet, AdminProductViewSet,
    AdminOrderViewSet, AdminReturnRequestViewSet, AdminReviewViewSet,
    AdminCouponViewSet, NewsletterView, ReportsView, BannerView
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'products', AdminProductViewSet, basename='admin-products')
router.register(r'orders', AdminOrderViewSet, basename='admin-orders')
router.register(r'returns', AdminReturnRequestViewSet, basename='admin-returns')
router.register(r'reviews', AdminReviewViewSet, basename='admin-reviews')
router.register(r'coupons', AdminCouponViewSet, basename='admin-coupons')

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='admin-dashboard'),
    path('newsletter/', NewsletterView.as_view(), name='admin-newsletter'),
    path('reports/', ReportsView.as_view(), name='admin-reports'),
    path('banners/', BannerView.as_view(), name='admin-banners'),
    path('', include(router.urls)),
]
