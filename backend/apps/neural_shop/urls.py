from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NeuralShopViewSet

router = DefaultRouter()
router.register(r'neural', NeuralShopViewSet, basename='neural-shop')

urlpatterns = [
    path('', include(router.urls)),
]
