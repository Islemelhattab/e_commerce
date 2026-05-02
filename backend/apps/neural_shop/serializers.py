from rest_framework import serializers
from .models import (
    EmotionalProfile, HologramProduct, MindDetectionSession, 
    EmotionalReaction, MutantProduct, ThoughtCommand, NeuralRecommendation
)


class EmotionalProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmotionalProfile
        fields = ['happiness_level', 'excitement_level', 'confidence_level', 
                 'curiosity_level', 'neural_signature', 'last_emotional_scan']


class HologramProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.CharField(source='product.price', read_only=True)
    
    class Meta:
        model = HologramProduct
        fields = ['product', 'product_name', 'product_price', 'hologram_url', 
                 'floating_animation', 'glow_intensity', 'rotation_speed', 
                 'color_spectrum', 'emotional_reactivity']


class MindDetectionSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MindDetectionSession
        fields = ['session_id', 'detected_emotions', 'thought_patterns', 
                 'focus_points', 'neural_activity', 'conversion_probability', 
                 'session_duration', 'created_at']


class EmotionalReactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = EmotionalReaction
        fields = ['product', 'product_name', 'emotion_type', 'intensity', 
                 'facial_expression', 'eye_tracking_data', 'micro_expression', 
                 'reaction_time', 'created_at']


class MutantProductSerializer(serializers.ModelSerializer):
    base_product_name = serializers.CharField(source='base_product.name', read_only=True)
    
    class Meta:
        model = MutantProduct
        fields = ['base_product', 'base_product_name', 'emotion_trigger', 
                 'mutated_name', 'mutated_description', 'color_variation', 
                 'price_multiplier', 'special_effects', 'transformation_animation', 
                 'is_active']


class ThoughtCommandSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThoughtCommand
        fields = ['command_type', 'detected_thought', 'confidence_score', 
                 'executed_action', 'action_result', 'processing_time', 'created_at']


class NeuralRecommendationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.CharField(source='product.price', read_only=True)
    
    class Meta:
        model = NeuralRecommendation
        fields = ['product', 'product_name', 'product_price', 'neural_confidence', 
                 'emotional_match', 'thought_alignment', 'hologram_appeal', 
                 'mutant_potential', 'recommendation_reason', 'brainwave_pattern', 
                 'is_accepted', 'created_at']
