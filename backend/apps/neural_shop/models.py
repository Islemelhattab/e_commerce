from django.db import models
import uuid
from django.contrib.auth import get_user_model

User = get_user_model()


class EmotionalProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='emotional_profile')
    happiness_level = models.DecimalField(max_digits=3, decimal_places=2, default=0.50)
    excitement_level = models.DecimalField(max_digits=3, decimal_places=2, default=0.50)
    confidence_level = models.DecimalField(max_digits=3, decimal_places=2, default=0.50)
    curiosity_level = models.DecimalField(max_digits=3, decimal_places=2, default=0.50)
    neural_signature = models.JSONField(default=dict)
    last_emotional_scan = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'neural_emotional_profiles'


class HologramProduct(models.Model):
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE, related_name='hologram')
    hologram_url = models.URLField(blank=True, null=True)
    floating_animation = models.JSONField(default=dict)
    glow_intensity = models.DecimalField(max_digits=3, decimal_places=2, default=0.80)
    rotation_speed = models.DecimalField(max_digits=3, decimal_places=2, default=1.00)
    color_spectrum = models.JSONField(default=list)
    emotional_reactivity = models.DecimalField(max_digits=3, decimal_places=2, default=0.90)
    
    class Meta:
        db_table = 'neural_hologram_products'


class MindDetectionSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mind_sessions')
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    detected_emotions = models.JSONField(default=dict)
    thought_patterns = models.JSONField(default=list)
    focus_points = models.JSONField(default=list)
    neural_activity = models.JSONField(default=dict)
    products_viewed = models.ManyToManyField('products.Product', related_name='mind_sessions')
    conversion_probability = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    session_duration = models.DurationField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'neural_mind_sessions'
        ordering = ['-created_at']


class EmotionalReaction(models.Model):
    session = models.ForeignKey(MindDetectionSession, on_delete=models.CASCADE, related_name='reactions')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    emotion_type = models.CharField(max_length=50)  # happiness, excitement, confusion, desire
    intensity = models.DecimalField(max_digits=3, decimal_places=2)
    facial_expression = models.JSONField(default=dict)
    eye_tracking_data = models.JSONField(default=dict)
    micro_expression = models.CharField(max_length=100, blank=True)
    reaction_time = models.DurationField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'neural_emotional_reactions'


class MutantProduct(models.Model):
    base_product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='mutant_variants')
    emotion_trigger = models.CharField(max_length=50)  # happiness, excitement, sadness, anger
    mutated_name = models.CharField(max_length=500)
    mutated_description = models.TextField()
    color_variation = models.JSONField(default=dict)
    price_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.00)
    special_effects = models.JSONField(default=list)
    transformation_animation = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'neural_mutant_products'


class ThoughtCommand(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='thought_commands')
    command_type = models.CharField(max_length=50)  # buy, wishlist, compare, explore
    detected_thought = models.TextField()
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2)
    executed_action = models.BooleanField(default=False)
    action_result = models.JSONField(default=dict)
    processing_time = models.DurationField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'neural_thought_commands'


class NeuralRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='neural_recommendations')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    neural_confidence = models.DecimalField(max_digits=3, decimal_places=2)
    emotional_match = models.DecimalField(max_digits=3, decimal_places=2)
    thought_alignment = models.DecimalField(max_digits=3, decimal_places=2)
    hologram_appeal = models.DecimalField(max_digits=3, decimal_places=2)
    mutant_potential = models.DecimalField(max_digits=3, decimal_places=2)
    recommendation_reason = models.TextField()
    brainwave_pattern = models.JSONField(default=dict)
    is_accepted = models.BooleanField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'neural_recommendations'
        ordering = ['-neural_confidence']
