from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F, Count, Avg
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import (
    DigitalArtwork, ArtCategory, DigitalArtist, Exhibition, 
    ArtCollection, Bid, ArtLike, ArtView
)
from .serializers import (
    DigitalArtworkSerializer, ArtCategorySerializer, DigitalArtistSerializer,
    ExhibitionSerializer, ArtCollectionSerializer, BidSerializer
)


class ArtCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ArtCategory.objects.filter(is_active=True)
    serializer_class = ArtCategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['order', 'name']


class DigitalArtistViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DigitalArtist.objects.all()
    serializer_class = DigitalArtistSerializer
    lookup_field = 'user__id'
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['artist_name', 'bio']
    filterset_fields = ['is_verified']
    
    @action(detail=True, methods=['get'])
    def artworks(self, request, user__id=None):
        artist = self.get_object()
        artworks = artist.artworks.filter(is_public=True).order_by('-created_at')
        serializer = DigitalArtworkSerializer(artworks, many=True, context={'request': request})
        return Response(serializer.data)


class DigitalArtworkViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DigitalArtwork.objects.filter(is_public=True).select_related(
        'artist', 'category', 'artist__user'
    ).prefetch_related('bids', 'exhibitions')
    serializer_class = DigitalArtworkSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['art_type', 'category', 'is_nft', 'is_featured', 'blockchain']
    search_fields = ['title', 'description', 'artist__artist_name']
    ordering_fields = ['price', 'created_at', 'view_count', 'like_count', 'bid_count']
    ordering = ['-created_at']
    
    def retrieve(self, request, *args, **kwargs):
        artwork = self.get_object()
        
        # Record view
        ArtView.objects.create(
            user=request.user if request.user.is_authenticated else None,
            artwork=artwork,
            ip_address=self.get_client_ip(request),
            session_id=request.session.session_key or ''
        )
        
        # Update view count
        DigitalArtwork.objects.filter(id=artwork.id).update(view_count=F('view_count') + 1)
        
        serializer = self.get_serializer(artwork)
        return Response(serializer.data)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @action(detail=True, methods=['post'])
    def like(self, request, slug=None):
        artwork = self.get_object()
        user = request.user
        
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        like, created = ArtLike.objects.get_or_create(user=user, artwork=artwork)
        
        if created:
            DigitalArtwork.objects.filter(id=artwork.id).update(like_count=F('like_count') + 1)
            return Response({'message': 'Artwork liked', 'liked': True})
        else:
            like.delete()
            DigitalArtwork.objects.filter(id=artwork.id).update(like_count=F('like_count') - 1)
            return Response({'message': 'Artwork unliked', 'liked': False})
    
    @action(detail=True, methods=['post'])
    def bid(self, request, slug=None):
        artwork = self.get_object()
        user = request.user
        
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        if not artwork.auction_enabled:
            return Response({'error': 'Bidding not enabled for this artwork'}, status=400)
        
        if artwork.is_sold:
            return Response({'error': 'Artwork already sold'}, status=400)
        
        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'Bid amount required'}, status=400)
        
        # Create bid
        bid = Bid.objects.create(
            artwork=artwork,
            bidder=user,
            amount=amount,
            currency=request.data.get('currency', 'ETH')
        )
        
        # Update bid count
        DigitalArtwork.objects.filter(id=artwork.id).update(bid_count=F('bid_count') + 1)
        
        # Update winning bid if this is the highest
        highest_bid = Bid.objects.filter(artwork=artwork, is_active=True).order_by('-amount').first()
        Bid.objects.filter(artwork=artwork, is_active=True).update(is_winning=False)
        if highest_bid:
            highest_bid.is_winning = True
            highest_bid.save()
        
        serializer = BidSerializer(bid)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured = self.get_queryset().filter(is_featured=True).order_by('-like_count', '-view_count')[:12]
        serializer = self.get_serializer(featured, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        # Trending based on recent views, likes, and bids
        seven_days_ago = timezone.now() - timezone.timedelta(days=7)
        
        trending = self.get_queryset().filter(
            Q(created_at__gte=seven_days_ago) |
            Q(bids__created_at__gte=seven_days_ago) |
            Q(artlikes__created_at__gte=seven_days_ago)
        ).annotate(
            trending_score=Count('views', filter=Q(artview__created_at__gte=seven_days_ago)) * 0.3 +
                         Count('artlikes', filter=Q(artlike__created_at__gte=seven_days_ago)) * 0.5 +
                         Count('bids', filter=Q(bid__created_at__gte=seven_days_ago)) * 0.2
        ).order_by('-trending_score')[:12]
        
        serializer = self.get_serializer(trending, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def auction(self, request):
        auction_artworks = self.get_queryset().filter(
            auction_enabled=True,
            is_sold=False,
            auction_end_time__gt=timezone.now()
        ).order_by('auction_end_time')
        
        serializer = self.get_serializer(auction_artworks, many=True, context={'request': request})
        return Response(serializer.data)


class ExhibitionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Exhibition.objects.filter(is_active=True).select_related(
        'curator', 'curator__user'
    ).prefetch_related('artworks', 'artworks__artist')
    serializer_class = ExhibitionSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['room_type', 'is_featured']
    search_fields = ['title', 'description', 'curator__artist_name']
    ordering_fields = ['start_date', 'visitor_count']
    ordering = ['-start_date']
    
    @action(detail=True, methods=['post'])
    def visit(self, request, slug=None):
        exhibition = self.get_object()
        
        # Record visit
        Exhibition.objects.filter(id=exhibition.id).update(visitor_count=F('visitor_count') + 1)
        
        return Response({
            'message': 'Visit recorded',
            'visitor_count': exhibition.visitor_count + 1
        })
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        now = timezone.now()
        current = self.get_queryset().filter(
            start_date__lte=now,
            end_date__gte=now
        ).order_by('-is_featured', '-start_date')
        
        serializer = self.get_serializer(current, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        upcoming = self.get_queryset().filter(
            start_date__gt=timezone.now()
        ).order_by('start_date')[:6]
        
        serializer = self.get_serializer(upcoming, many=True, context={'request': request})
        return Response(serializer.data)


class ArtCollectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ArtCollectionSerializer
    
    def get_queryset(self):
        return ArtCollection.objects.filter(user=self.request.user).prefetch_related('artworks')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_artwork(self, request, pk=None):
        collection = self.get_object()
        artwork_id = request.data.get('artwork_id')
        
        try:
            artwork = DigitalArtwork.objects.get(id=artwork_id, is_public=True)
            collection.artworks.add(artwork)
            return Response({'message': 'Artwork added to collection'})
        except DigitalArtwork.DoesNotExist:
            return Response({'error': 'Artwork not found'}, status=404)
    
    @action(detail=True, methods=['post'])
    def remove_artwork(self, request, pk=None):
        collection = self.get_object()
        artwork_id = request.data.get('artwork_id')
        
        try:
            artwork = DigitalArtwork.objects.get(id=artwork_id)
            collection.artworks.remove(artwork)
            return Response({'message': 'Artwork removed from collection'})
        except DigitalArtwork.DoesNotExist:
            return Response({'error': 'Artwork not found'}, status=404)
