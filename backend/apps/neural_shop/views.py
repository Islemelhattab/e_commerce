from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Q, F
from django.utils import timezone
from datetime import timedelta
import random
import json

from .models import (
    EmotionalProfile, HologramProduct, MindDetectionSession, 
    EmotionalReaction, MutantProduct, ThoughtCommand, NeuralRecommendation
)
from .serializers import (
    EmotionalProfileSerializer, HologramProductSerializer, 
    MindDetectionSessionSerializer, EmotionalReactionSerializer,
    MutantProductSerializer, ThoughtCommandSerializer, 
    NeuralRecommendationSerializer
)
from apps.products.models import Product


class NeuralShopViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def start_mind_session(self, request):
        """Démarre une session de détection neurale"""
        user = request.user
        
        # Créer ou récupérer le profil émotionnel
        profile, created = EmotionalProfile.objects.get_or_create(user=user)
        
        # Initialiser une session de détection mentale
        session = MindDetectionSession.objects.create(
            user=user,
            detected_emotions={
                'happiness': random.uniform(0.3, 0.9),
                'excitement': random.uniform(0.4, 0.8),
                'curiosity': random.uniform(0.5, 0.9),
                'focus': random.uniform(0.6, 0.9)
            },
            thought_patterns=[
                'exploration', 'curiosity', 'desire', 'comparison'
            ],
            focus_points=[
                {'x': random.uniform(0, 100), 'y': random.uniform(0, 100), 'intensity': random.uniform(0.5, 1.0)}
                for _ in range(3)
            ],
            neural_activity={
                'alpha_waves': random.uniform(8, 12),
                'beta_waves': random.uniform(12, 30),
                'theta_waves': random.uniform(4, 8),
                'gamma_waves': random.uniform(30, 100)
            },
            conversion_probability=random.uniform(0.3, 0.8),
            session_duration=timedelta(minutes=random.randint(5, 30))
        )
        
        return Response({
            'session_id': session.session_id,
            'emotional_state': session.detected_emotions,
            'neural_activity': session.neural_activity,
            'message': '🧠 Session neurale démarrée - Connectez votre esprit au shopping!'
        })

    @action(detail=False, methods=['post'])
    def analyze_emotions(self, request):
        """Analyse les émotions via webcam et expressions faciales"""
        user = request.user
        session_id = request.data.get('session_id')
        
        try:
            session = MindDetectionSession.objects.get(session_id=session_id, user=user)
        except MindDetectionSession.DoesNotExist:
            return Response({'error': 'Session non trouvée'}, status=404)
        
        # Simuler la détection d'émotions
        emotions = ['happiness', 'excitement', 'desire', 'curiosity', 'confusion']
        detected_emotion = random.choice(emotions)
        intensity = random.uniform(0.6, 0.95)
        
        # Créer une réaction émotionnelle
        reaction = EmotionalReaction.objects.create(
            session=session,
            product_id=request.data.get('product_id', random.choice(Product.objects.values_list('id', flat=True))),
            emotion_type=detected_emotion,
            intensity=intensity,
            facial_expression={
                'smile': intensity > 0.7,
                'eyebrows_raised': detected_emotion == 'excitement',
                'eyes_widened': detected_emotion == 'desire',
                'mouth_open': detected_emotion == 'surprise'
            },
            eye_tracking_data={
                'gaze_x': random.uniform(0, 100),
                'gaze_y': random.uniform(0, 100),
                'pupil_dilation': intensity,
                'blink_rate': random.uniform(10, 30)
            },
            micro_expression=random.choice(['micro_smile', 'eyebrow_flicker', 'lip_corner_pull', 'nostril_flare']),
            reaction_time=timedelta(milliseconds=random.randint(200, 2000))
        )
        
        # Mettre à jour la session
        session.detected_emotions[detected_emotion] = intensity
        session.conversion_probability = min(0.95, session.conversion_probability + (intensity * 0.1))
        session.save()
        
        return Response({
            'detected_emotion': detected_emotion,
            'intensity': intensity,
            'facial_analysis': reaction.facial_expression,
            'eye_tracking': reaction.eye_tracking_data,
            'micro_expression': reaction.micro_expression,
            'conversion_probability': session.conversion_probability,
            'message': f'🎭 Émotion détectée: {detected_emotion} ({intensity:.2f})'
        })

    @action(detail=False, methods=['get'])
    def hologram_products(self, request):
        """Retourne les produits avec effets holographiques"""
        products = Product.objects.filter(is_active=True)[:12]
        
        hologram_data = []
        for product in products:
            holo, created = HologramProduct.objects.get_or_create(
                product=product,
                defaults={
                    'glow_intensity': random.uniform(0.6, 1.0),
                    'rotation_speed': random.uniform(0.5, 2.0),
                    'color_spectrum': [
                        f'hsl({random.randint(0, 360)}, 70%, 50%)' for _ in range(5)
                    ],
                    'emotional_reactivity': random.uniform(0.7, 0.95),
                    'floating_animation': {
                        'float_height': random.uniform(10, 50),
                        'float_speed': random.uniform(1, 3),
                        'rotation_x': random.uniform(-45, 45),
                        'rotation_y': random.uniform(-45, 45)
                    }
                }
            )
            
            hologram_data.append({
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'price': str(product.price),
                    'image': product.images.first().image.url if product.images.exists() else None
                },
                'hologram': {
                    'glow_intensity': holo.glow_intensity,
                    'rotation_speed': holo.rotation_speed,
                    'color_spectrum': holo.color_spectrum,
                    'floating_animation': holo.floating_animation,
                    'emotional_reactivity': holo.emotional_reactivity
                }
            })
        
        return Response({
            'hologram_products': hologram_data,
            'message': '✨ Produits holographiques chargés - Préparez-vous à une expérience immersive!'
        })

    @action(detail=False, methods=['post'])
    def mutate_product(self, request):
        """Fait muter un produit selon les émotions de l'utilisateur"""
        user = request.user
        product_id = request.data.get('product_id')
        emotion = request.data.get('emotion', 'happiness')
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Produit non trouvé'}, status=404)
        
        # Créer une version mutante du produit
        mutant = MutantProduct.objects.create(
            base_product=product,
            emotion_trigger=emotion,
            mutated_name=f"{product.name} - Mode {emotion.title()}",
            mutated_description=f"Version mutante du produit activée par votre {emotion}!",
            color_variation={
                'primary': f'hsl({random.randint(0, 360)}, 70%, 50%)',
                'secondary': f'hsl({random.randint(0, 360)}, 70%, 30%)',
                'glow': f'hsl({random.randint(0, 360)}, 100%, 70%)'
            },
            price_multiplier=random.uniform(0.8, 1.3),
            special_effects=[
                'particle_glow', 'color_shift', 'size_pulse', 'ethereal_float'
            ],
            transformation_animation={
                'duration': random.uniform(2, 5),
                'easing': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'transform': 'scale(1.1) rotate(5deg)',
                'glow_increase': True
            }
        )
        
        return Response({
            'mutant_product': {
                'id': mutant.id,
                'name': mutant.mutated_name,
                'description': mutant.mutated_description,
                'color_variation': mutant.color_variation,
                'price_multiplier': mutant.price_multiplier,
                'special_effects': mutant.special_effects,
                'transformation_animation': mutant.transformation_animation
            },
            'message': f'🧬 Produit muté en mode {emotion} - La magie opère!'
        })

    @action(detail=False, methods=['post'])
    def detect_thought_command(self, request):
        """Détecte les "commandes mentales" de l'utilisateur"""
        user = request.user
        session_id = request.data.get('session_id')
        
        # Simuler la détection de pensée
        thoughts = [
            "Je veux acheter ce produit",
            "Ajouter à ma wishlist",
            "Comparer avec d'autres articles",
            "Explorer plus de produits similaires",
            "Ce produit est trop cher",
            "J'adore la couleur!"
        ]
        
        detected_thought = random.choice(thoughts)
        confidence = random.uniform(0.7, 0.95)
        
        command_type = 'buy' if 'acheter' in detected_thought.lower() else \
                      'wishlist' if 'wishlist' in detected_thought.lower() else \
                      'compare' if 'comparer' in detected_thought.lower() else \
                      'explore' if 'explorer' in detected_thought.lower() else 'other'
        
        command = ThoughtCommand.objects.create(
            user=user,
            command_type=command_type,
            detected_thought=detected_thought,
            confidence_score=confidence,
            executed_action=confidence > 0.8,
            action_result={
                'executed': confidence > 0.8,
                'message': f'Commande {"exécutée" if confidence > 0.8 else "en attente de confirmation"}'
            },
            processing_time=timedelta(milliseconds=random.randint(100, 500))
        )
        
        return Response({
            'detected_thought': detected_thought,
            'command_type': command_type,
            'confidence': confidence,
            'executed': command.executed_action,
            'message': f'🧠 Pensée détectée: "{detected_thought}" (Confiance: {confidence:.2f})'
        })

    @action(detail=False, methods=['get'])
    def neural_recommendations(self, request):
        """Génère des recommandations basées sur l'activité neurale"""
        user = request.user
        
        # Obtenir le profil émotionnel
        try:
            profile = user.emotional_profile
        except EmotionalProfile.DoesNotExist:
            profile = EmotionalProfile.objects.create(user=user)
        
        # Simuler les recommandations neurales
        products = Product.objects.filter(is_active=True).order_by('?')[:8]
        
        recommendations = []
        for product in products:
            neural_confidence = random.uniform(0.7, 0.95)
            emotional_match = random.uniform(0.6, 0.9)
            thought_alignment = random.uniform(0.5, 0.85)
            hologram_appeal = random.uniform(0.8, 0.95)
            mutant_potential = random.uniform(0.4, 0.8)
            
            rec = NeuralRecommendation.objects.create(
                user=user,
                product=product,
                neural_confidence=neural_confidence,
                emotional_match=emotional_match,
                thought_alignment=thought_alignment,
                hologram_appeal=hologram_appeal,
                mutant_potential=mutant_potential,
                recommendation_reason=f"Basé sur vos patterns neuronaux et votre niveau de {profile.happiness_level:.2f} de bonheur",
                brainwave_pattern={
                    'alpha': random.uniform(8, 12),
                    'beta': random.uniform(12, 30),
                    'theta': random.uniform(4, 8),
                    'gamma': random.uniform(30, 100)
                }
            )
            
            recommendations.append({
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'price': str(product.price)
                },
                'neural_scores': {
                    'confidence': neural_confidence,
                    'emotional_match': emotional_match,
                    'thought_alignment': thought_alignment,
                    'hologram_appeal': hologram_appeal,
                    'mutant_potential': mutant_potential
                },
                'reason': rec.recommendation_reason,
                'brainwave_pattern': rec.brainwave_pattern
            })
        
        return Response({
            'recommendations': recommendations,
            'user_profile': {
                'happiness': profile.happiness_level,
                'excitement': profile.excitement_level,
                'confidence': profile.confidence_level,
                'curiosity': profile.curiosity_level
            },
            'message': '🔮 Recommandations neurales générées - Votre esprit a parlé!'
        })

    @action(detail=False, methods=['post'])
    def emotional_checkout(self, request):
        """Processus de checkout basé sur les émotions"""
        user = request.user
        session_id = request.data.get('session_id')
        
        try:
            session = MindDetectionSession.objects.get(session_id=session_id, user=user)
        except MindDetectionSession.DoesNotExist:
            return Response({'error': 'Session non trouvée'}, status=404)
        
        # Calculer le score émotionnel final
        emotional_score = sum(session.detected_emotions.values()) / len(session.detected_emotions)
        
        # Créer une expérience de checkout unique
        checkout_experience = {
            'emotional_state': session.detected_emotions,
            'emotional_score': emotional_score,
            'neural_activity': session.neural_activity,
            'conversion_confidence': session.conversion_probability,
            'checkout_theme': self._get_checkout_theme(emotional_score),
            'special_effects': self._get_checkout_effects(emotional_score),
            'message': f'💫 Checkout émotionnel prêt - Votre esprit est {emotional_score:.2f} aligné avec cet achat!'
        }
        
        return Response(checkout_experience)
    
    def _get_checkout_theme(self, score):
        if score > 0.8:
            return 'cosmic_ecstasy'
        elif score > 0.6:
            return 'harmonic_bliss'
        elif score > 0.4:
            return 'gentle_calm'
        else:
            return 'mysterious_dream'
    
    def _get_checkout_effects(self, score):
        effects = []
        if score > 0.7:
            effects.extend(['particle_explosion', 'color_aurora', 'ethereal_glow'])
        if score > 0.5:
            effects.extend(['gentle_float', 'soft_pulse'])
        effects.append('neural_resonance')
        return effects
