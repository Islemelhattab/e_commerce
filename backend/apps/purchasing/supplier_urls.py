from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierPortalOrdersView, SupplierPortalInvoiceView

router = DefaultRouter()
router.register(r'orders', SupplierPortalOrdersView, basename='portal-orders')
router.register(r'invoices', SupplierPortalInvoiceView, basename='portal-invoices')

urlpatterns = [
    path('', include(router.urls)),
]
