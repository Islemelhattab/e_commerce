from django.urls import path
from apps.reviews.views import ShippingMethodListView
urlpatterns = [path('methods/', ShippingMethodListView.as_view(), name='shipping-methods')]
