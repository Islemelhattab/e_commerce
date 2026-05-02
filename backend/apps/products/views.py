from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from .models import Product, Category, Brand, ProductImage


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_rating = django_filters.NumberFilter(field_name='average_rating', lookup_expr='gte')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    category_slug = django_filters.CharFilter(field_name='category__slug')
    brand_slug = django_filters.CharFilter(field_name='brand__slug')

    class Meta:
        model = Product
        fields = ['category', 'brand', 'is_featured', 'is_new']

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset.filter(stock=0)


class ProductSerializer:
    """Placeholder - implement with rest_framework serializers"""
    pass


# ==================== SERIALIZERS ====================
from rest_framework import serializers
from .models import Product, Category, Brand, ProductImage, ProductVariant, ProductAttribute, Tag


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent', 'children', 'product_count', 'is_active']

    def get_children(self, obj):
        return CategorySerializer(obj.children.filter(is_active=True), many=True, context=self.context).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'description']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = ['id', 'name', 'value']


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'sku', 'price', 'stock', 'image', 'attributes', 'is_active']


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'category_name', 'brand_name',
            'price', 'compare_price', 'discount_percentage', 'in_stock', 'stock',
            'average_rating', 'review_count', 'sales_count', 'is_featured', 'is_new',
            'primary_image', 'created_at'
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            return self.context['request'].build_absolute_uri(img.image.url) if img.image else None
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    is_in_wishlist = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'category', 'brand', 'price', 'compare_price', 'discount_percentage',
            'sku', 'stock', 'in_stock', 'weight', 'average_rating', 'review_count',
            'sales_count', 'is_featured', 'is_new', 'images', 'attributes', 'variants',
            'is_in_wishlist', 'created_at', 'updated_at'
        ]

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from apps.users.models import Wishlist
            return Wishlist.objects.filter(user=request.user, product=obj).exists()
        return False


# ==================== VIEWS ====================
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related(
        'category', 'brand'
    ).prefetch_related(
        'images', 
        'variants',
        'tags',
        'attributes'
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku', 'category__name', 'brand__name', 'tags__name']
    ordering_fields = ['price', 'average_rating', 'sales_count', 'created_at', 'review_count']
    ordering = ['-created_at']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured = self.get_queryset().filter(is_featured=True)[:8]
        serializer = ProductListSerializer(featured, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def new_arrivals(self, request):
        products = self.get_queryset().filter(is_new=True).order_by('-created_at')[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def best_sellers(self, request):
        products = self.get_queryset().order_by('-sales_count')[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def similar(self, request, slug=None):
        product = self.get_object()
        similar = self.get_queryset().filter(
            category=product.category
        ).exclude(id=product.id)[:6]
        serializer = ProductListSerializer(similar, many=True, context={'request': request})
        return Response(serializer.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True, parent=None).prefetch_related('children')
    serializer_class = CategorySerializer
    lookup_field = 'slug'


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    lookup_field = 'slug'
