from django.db import models
import uuid
from django.contrib.auth import get_user_model

User = get_user_model()


class ArtCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'art_categories'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class DigitalArtist(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='artist_profile')
    artist_name = models.CharField(max_length=100)
    bio = models.TextField()
    avatar = models.ImageField(upload_to='artists/', blank=True, null=True)
    website = models.URLField(blank=True)
    twitter = models.CharField(max_length=50, blank=True)
    instagram = models.CharField(max_length=50, blank=True)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_artworks = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'digital_artists'
    
    def __str__(self):
        return self.artist_name


class DigitalArtwork(models.Model):
    ART_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('3d', '3D Model'),
        ('audio', 'Audio'),
        ('interactive', 'Interactive'),
    ]
    
    BLOCKCHAINS = [
        ('ethereum', 'Ethereum'),
        ('polygon', 'Polygon'),
        ('solana', 'Solana'),
        ('none', 'None'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    artist = models.ForeignKey(DigitalArtist, on_delete=models.CASCADE, related_name='artworks')
    category = models.ForeignKey(ArtCategory, on_delete=models.SET_NULL, null=True, related_name='artworks')
    
    # Media files
    image = models.ImageField(upload_to='artworks/')
    thumbnail = models.ImageField(upload_to='thumbnails/')
    video_file = models.FileField(upload_to='videos/', blank=True, null=True)
    audio_file = models.FileField(upload_to='audio/', blank=True, null=True)
    
    # Art details
    art_type = models.CharField(max_length=20, choices=ART_TYPES, default='image')
    year_created = models.IntegerField()
    dimensions = models.CharField(max_length=100, blank=True)
    file_size = models.BigIntegerField(default=0)
    
    # Blockchain/NFT info
    is_nft = models.BooleanField(default=False)
    blockchain = models.CharField(max_length=20, choices=BLOCKCHAINS, default='none')
    token_id = models.CharField(max_length=100, blank=True)
    contract_address = models.CharField(max_length=100, blank=True)
    
    # Pricing
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='ETH')
    auction_enabled = models.BooleanField(default=False)
    auction_start_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    auction_end_time = models.DateTimeField(null=True, blank=True)
    
    # Stats
    view_count = models.IntegerField(default=0)
    like_count = models.IntegerField(default=0)
    bid_count = models.IntegerField(default=0)
    
    # Status
    is_minted = models.BooleanField(default=False)
    is_sold = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'digital_artworks'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Exhibition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    curator = models.ForeignKey(DigitalArtist, on_delete=models.CASCADE, related_name='curated_exhibitions')
    artworks = models.ManyToManyField(DigitalArtwork, related_name='exhibitions')
    
    # Visual settings
    cover_image = models.ImageField(upload_to='exhibitions/')
    room_type = models.CharField(max_length=50, default='modern_gallery')
    background_music = models.FileField(upload_to='exhibition_music/', blank=True, null=True)
    
    # Schedule
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Stats
    visitor_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'exhibitions'
        ordering = ['-start_date']


class ArtCollection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='art_collections')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    artworks = models.ManyToManyField(DigitalArtwork, related_name='collections')
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'art_collections'
        ordering = ['-created_at']


class Bid(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey(DigitalArtwork, on_delete=models.CASCADE, related_name='bids')
    bidder = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bids')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='ETH')
    is_active = models.BooleanField(default=True)
    is_winning = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'bids'
        ordering = ['-amount', '-created_at']


class ArtLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    artwork = models.ForeignKey(DigitalArtwork, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'art_likes'
        unique_together = ('user', 'artwork')


class ArtView(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    artwork = models.ForeignKey(DigitalArtwork, on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField()
    session_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'art_views'
