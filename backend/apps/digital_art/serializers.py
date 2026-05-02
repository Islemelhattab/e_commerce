from rest_framework import serializers
from .models import (
    DigitalArtwork, ArtCategory, DigitalArtist, Exhibition, 
    ArtCollection, Bid
)


class ArtCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'order']


class DigitalArtistSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.email', read_only=True)
    artworks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DigitalArtist
        fields = ['id', 'user', 'username', 'artist_name', 'bio', 'avatar', 
                 'website', 'twitter', 'instagram', 'total_sales', 'total_artworks',
                 'artworks_count', 'is_verified', 'created_at']
        read_only_fields = ['total_sales', 'total_artworks', 'is_verified']
    
    def get_artworks_count(self, obj):
        return obj.artworks.filter(is_public=True).count()


class BidSerializer(serializers.ModelSerializer):
    bidder_username = serializers.CharField(source='bidder.email', read_only=True)
    
    class Meta:
        model = Bid
        fields = ['id', 'bidder', 'bidder_username', 'amount', 'currency', 
                 'is_active', 'is_winning', 'created_at']


class DigitalArtworkSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.artist_name', read_only=True)
    artist_avatar = serializers.ImageField(source='artist.avatar', read_only=True)
    artist_verified = serializers.BooleanField(source='artist.is_verified', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    bids = BidSerializer(many=True, read_only=True)
    highest_bid = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    auction_status = serializers.SerializerMethodField()
    
    class Meta:
        model = DigitalArtwork
        fields = ['id', 'title', 'slug', 'description', 'artist', 'artist_name', 
                 'artist_avatar', 'artist_verified', 'category', 'category_name',
                 'image', 'thumbnail', 'video_file', 'audio_file', 'art_type', 
                 'year_created', 'dimensions', 'file_size', 'is_nft', 'blockchain',
                 'token_id', 'contract_address', 'price', 'currency', 'auction_enabled',
                 'auction_start_price', 'auction_end_time', 'view_count', 'like_count',
                 'bid_count', 'is_minted', 'is_sold', 'is_featured', 'is_public',
                 'bids', 'highest_bid', 'is_liked', 'auction_status', 
                 'created_at', 'updated_at']
    
    def get_highest_bid(self, obj):
        highest_bid = obj.bids.filter(is_active=True).order_by('-amount').first()
        if highest_bid:
            return BidSerializer(highest_bid).data
        return None
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.artlikes.filter(user=request.user).exists()
        return False
    
    def get_auction_status(self, obj):
        if not obj.auction_enabled:
            return 'not_auction'
        
        from django.utils import timezone
        now = timezone.now()
        
        if obj.is_sold:
            return 'sold'
        elif obj.auction_end_time and obj.auction_end_time < now:
            return 'ended'
        elif obj.auction_end_time and obj.auction_end_time > now:
            return 'active'
        else:
            return 'scheduled'


class ExhibitionSerializer(serializers.ModelSerializer):
    curator_name = serializers.CharField(source='curator.artist_name', read_only=True)
    curator_avatar = serializers.ImageField(source='curator.avatar', read_only=True)
    artworks_count = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Exhibition
        fields = ['id', 'title', 'slug', 'description', 'curator', 'curator_name',
                 'curator_avatar', 'artworks', 'artworks_count', 'cover_image',
                 'room_type', 'background_music', 'start_date', 'end_date',
                 'visitor_count', 'is_active', 'is_featured', 'status', 'created_at']
    
    def get_artworks_count(self, obj):
        return obj.artworks.count()
    
    def get_status(self, obj):
        from django.utils import timezone
        now = timezone.now()
        
        if obj.start_date > now:
            return 'upcoming'
        elif obj.end_date < now:
            return 'ended'
        else:
            return 'active'


class ArtCollectionSerializer(serializers.ModelSerializer):
    artworks = DigitalArtworkSerializer(many=True, read_only=True)
    artworks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ArtCollection
        fields = ['id', 'user', 'name', 'description', 'artworks', 'artworks_count',
                 'is_public', 'created_at']
    
    def get_artworks_count(self, obj):
        return obj.artworks.count()
