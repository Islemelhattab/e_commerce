from rest_framework import serializers
from .models import Product, Category, Brand, ProductImage, ProductVariant, Tag


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'sku', 'price', 'compare_price', 'inventory', 'weight', 'attributes']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent']


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'description', 'logo', 'website']


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'compare_price',
            'category', 'category_name', 'brand', 'brand_name', 'primary_image',
            'discount_percentage', 'rating', 'review_count', 'stock', 'is_active',
            'created_at'
        ]
    
    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ProductImageSerializer(primary_image).data
        elif obj.images.exists():
            return ProductImageSerializer(obj.images.first()).data
        return None
    
    def get_discount_percentage(self, obj):
        if obj.compare_price and obj.compare_price > obj.price:
            return round(((obj.compare_price - obj.price) / obj.compare_price) * 100, 2)
        return 0


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    discount_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'compare_price',
            'category', 'brand', 'images', 'variants', 'tags', 'sku',
            'weight', 'dimensions', 'materials', 'care_instructions',
            'discount_percentage', 'rating', 'review_count', 'stock',
            'is_active', 'meta_title', 'meta_description', 'created_at',
            'updated_at'
        ]
    
    def get_discount_percentage(self, obj):
        if obj.compare_price and obj.compare_price > obj.price:
            return round(((obj.compare_price - obj.price) / obj.compare_price) * 100, 2)
        return 0
