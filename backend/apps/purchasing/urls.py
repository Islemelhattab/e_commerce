from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, PurchaseOrderViewSet, SupplierInvoiceViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet, basename='suppliers')
router.register(r'orders', PurchaseOrderViewSet, basename='purchase-orders')
router.register(r'invoices', SupplierInvoiceViewSet, basename='supplier-invoices')

urlpatterns = [
    path('', include(router.urls)),
]
