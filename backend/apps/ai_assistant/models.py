from django.db import models
import uuid
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_profile')
    style_preferences = models.JSONField(default=dict)
    size_preferences = models.JSONField(default=dict)
    color_preferences = models.JSONField(default=dict)
    budget_range = models.JSONField(default=dict)
    shopping_frequency = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_user_profiles'


class StyleAnalysis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='style_analyses')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    style_tags = models.JSONField(default=list)
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_style_analyses'


class OutfitRecommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='outfit_recommendations')
    name = models.CharField(max_length=200)
    description = models.TextField()
    occasion = models.CharField(max_length=100)
    season = models.CharField(max_length=20)
    products = models.ManyToManyField('products.Product', related_name='outfit_recommendations')
    style_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    price_range = models.JSONField(default=dict)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_outfit_recommendations'
        ordering = ['-created_at']


class TrendPrediction(models.Model):
    category = models.ForeignKey('products.Category', on_delete=models.CASCADE)
    trend_keywords = models.JSONField(default=list)
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2)
    predicted_growth = models.DecimalField(max_digits=5, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_trend_predictions'
        ordering = ['-confidence_score']


class SizeRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='size_recommendations')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    recommended_size = models.CharField(max_length=20)
    confidence = models.DecimalField(max_digits=3, decimal_places=2)
    fit_type = models.CharField(max_length=50)
    reasoning = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_size_recommendations'
        unique_together = ('user', 'product')
