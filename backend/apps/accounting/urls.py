from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountingAccountViewSet, FiscalPeriodViewSet, JournalEntryViewSet

router = DefaultRouter()
router.register(r'accounts', AccountingAccountViewSet, basename='accounting-accounts')
router.register(r'periods', FiscalPeriodViewSet, basename='fiscal-periods')
router.register(r'entries', JournalEntryViewSet, basename='journal-entries')

urlpatterns = [
    path('', include(router.urls)),
]
