from rest_framework import serializers
from .models import UserProfile, StyleAnalysis, OutfitRecommendation, TrendPrediction, SizeRecommendation
from apps.products.serializers import ProductListSerializer


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['style_preferences', 'size_preferences', 'color_preferences', 'budget_range', 'shopping_frequency']


class StyleAnalysisSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = StyleAnalysis
        fields = ['product', 'style_tags', 'confidence_score', 'created_at']


class OutfitRecommendationSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)
    
    class Meta:
        model = OutfitRecommendation
        fields = ['id', 'name', 'description', 'occasion', 'season', 'products', 
                 'style_score', 'price_range', 'is_public', 'created_at']


class TrendPredictionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = TrendPrediction
        fields = ['category', 'category_name', 'trend_keywords', 'confidence_score', 
                 'predicted_growth', 'start_date', 'end_date', 'created_at']


class SizeRecommendationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = SizeRecommendation
        fields = ['product', 'product_name', 'product_image', 'recommended_size', 
                 'confidence', 'fit_type', 'reasoning', 'created_at']
    
    def get_product_image(self, obj):
        img = obj.product.images.filter(is_primary=True).first() or obj.product.images.first()
        if img and img.image:
            return self.context['request'].build_absolute_uri(img.image.url)
        return None
