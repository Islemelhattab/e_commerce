from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArtCategoryViewSet, DigitalArtistViewSet, DigitalArtworkViewSet,
    ExhibitionViewSet, ArtCollectionViewSet
)

router = DefaultRouter()
router.register(r'categories', ArtCategoryViewSet, basename='art-categories')
router.register(r'artists', DigitalArtistViewSet, basename='digital-artists')
router.register(r'artworks', DigitalArtworkViewSet, basename='digital-artworks')
router.register(r'exhibitions', ExhibitionViewSet, basename='exhibitions')
router.register(r'collections', ArtCollectionViewSet, basename='art-collections')

urlpatterns = [
    path('', include(router.urls)),
]
