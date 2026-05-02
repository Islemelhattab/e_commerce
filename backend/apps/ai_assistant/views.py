from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
import random

from .models import UserProfile, StyleAnalysis, OutfitRecommendation, TrendPrediction, SizeRecommendation
from .serializers import (
    UserProfileSerializer, StyleAnalysisSerializer, 
    OutfitRecommendationSerializer, TrendPredictionSerializer, 
    SizeRecommendationSerializer
)
from apps.products.models import Product, Category
from apps.orders.models import Order, OrderItem


class AIAssistantViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_profile(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    @action(detail=False, methods=['get'])
    def analyze_style(self, request):
        """Analyse le style de l'utilisateur basé sur son historique"""
        user = request.user
        profile = self.get_profile()
        
        # Analyser les commandes passées
        order_items = OrderItem.objects.filter(
            order__user=user, 
            order__status='delivered'
        ).select_related('product__category', 'product__brand')
        
        style_tags = []
        color_preferences = {}
        category_preferences = {}
        
        for item in order_items:
            product = item.product
            
            # Extraire les tags de style
            if product.tags.exists():
                for tag in product.tags.all():
                    style_tags.append(tag.name)
            
            # Analyser les catégories préférées
            if product.category:
                category_name = product.category.name
                category_preferences[category_name] = category_preferences.get(category_name, 0) + 1
            
            # Créer une analyse de style pour chaque produit
            analysis, created = StyleAnalysis.objects.get_or_create(
                user=user,
                product=product,
                defaults={
                    'style_tags': list(product.tags.values_list('name', flat=True)),
                    'confidence_score': 0.85
                }
            )
        
        # Mettre à jour le profil
        profile.style_preferences = {
            'tags': list(set(style_tags)),
            'categories': dict(sorted(category_preferences.items(), key=lambda x: x[1], reverse=True)[:5])
        }
        profile.shopping_frequency = order_items.count()
        profile.save()
        
        analyses = StyleAnalysis.objects.filter(user=user).order_by('-created_at')[:20]
        serializer = StyleAnalysisSerializer(analyses, many=True, context={'request': request})
        
        return Response({
            'profile': UserProfileSerializer(profile).data,
            'recent_analyses': serializer.data
        })

    @action(detail=False, methods=['post'])
    def generate_outfit(self, request):
        """Génère une tenue complète basée sur les préférences utilisateur"""
        user = request.user
        profile = self.get_profile()
        
        occasion = request.data.get('occasion', 'casual')
        season = request.data.get('season', 'all_season')
        budget_max = request.data.get('budget_max', 500)
        
        # Filtrer les produits selon les préférences
        preferred_categories = list(profile.style_preferences.get('categories', {}).keys())[:3]
        
        products = Product.objects.filter(is_active=True)
        if preferred_categories:
            products = products.filter(category__name__in=preferred_categories)
        
        # Sélectionner des produits pour créer une tenue
        outfit_products = []
        
        # Vêtement principal
        main_items = products.filter(
            Q(category__name__icontains='chemise') | 
            Q(category__name__icontains='t-shirt') | 
            Q(category__name__icontains='robe')
        ).order_by('?')[:1]
        
        # Bas
        bottom_items = products.filter(
            Q(category__name__icontains='pantalon') | 
            Q(category__name__icontains='jean') |
            Q(category__name__icontains='jupe')
        ).order_by('?')[:1]
        
        # Chaussures
        shoes = products.filter(
            category__name__icontains='chaussure'
        ).order_by('?')[:1]
        
        # Accessoires
        accessories = products.filter(
            Q(category__name__icontains='sac') | 
            Q(category__name__icontains='montre') | 
            Q(category__name__icontains='bijou')
        ).order_by('?')[:1]
        
        outfit_products = list(main_items) + list(bottom_items) + list(shoes) + list(accessories)
        
        # Calculer le score de style
        style_score = min(0.95, 0.70 + (len(outfit_products) * 0.05))
        
        # Créer la recommandation
        outfit = OutfitRecommendation.objects.create(
            user=user,
            name=f"Tenue {occasion} - {season}",
            description=f"Tenue parfaite pour {occasion} en {season}",
            occasion=occasion,
            season=season,
            style_score=style_score,
            price_range={'min': 50, 'max': budget_max}
        )
        
        outfit.products.set(outfit_products)
        
        serializer = OutfitRecommendationSerializer(outfit, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def predict_trends(self, request):
        """Prédit les tendances basées sur les ventes récentes"""
        # Analyser les ventes des 30 derniers jours
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        recent_sales = OrderItem.objects.filter(
            order__created_at__gte=thirty_days_ago,
            order__status='delivered'
        ).select_related('product__category')
        
        # Calculer la croissance par catégorie
        category_growth = {}
        for item in recent_sales:
            category = item.product.category
            if category:
                category_growth[category.name] = category_growth.get(category.name, 0) + item.quantity
        
        # Prédire les tendances
        trends = []
        for category_name, sales_count in sorted(category_growth.items(), key=lambda x: x[1], reverse=True)[:10]:
            try:
                category = Category.objects.get(name=category_name)
                
                # Calculer la confiance basée sur le volume de ventes
                confidence = min(0.95, (sales_count / 100) * 0.8 + 0.15)
                predicted_growth = (sales_count / 10) * 15  # Croissance prédite en %
                
                trend = TrendPrediction.objects.create(
                    category=category,
                    trend_keywords=[category_name.lower(), 'tendance', 'populaire'],
                    confidence_score=confidence,
                    predicted_growth=predicted_growth,
                    start_date=timezone.now().date(),
                    end_date=(timezone.now() + timedelta(days=90)).date()
                )
                trends.append(trend)
            except Category.DoesNotExist:
                continue
        
        serializer = TrendPredictionSerializer(trends, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def recommend_size(self, request):
        """Recommande la taille idéale pour un produit"""
        user = request.user
        product_id = request.data.get('product_id')
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Produit non trouvé'}, status=404)
        
        profile = self.get_profile()
        
        # Logique de recommandation de taille basée sur l'historique
        user_height = profile.size_preferences.get('height', 170)  # cm
        user_weight = profile.size_preferences.get('weight', 70)    # kg
        
        # Calculer la taille recommandée (logique simplifiée)
        if user_height < 165:
            recommended_size = 'S'
        elif user_height < 175:
            recommended_size = 'M'
        elif user_height < 185:
            recommended_size = 'L'
        else:
            recommended_size = 'XL'
        
        # Ajuster selon le poids
        if user_weight > 85 and recommended_size in ['S', 'M']:
            recommended_size = chr(ord(recommended_size) + 1)
        elif user_weight < 60 and recommended_size in ['L', 'XL']:
            recommended_size = chr(ord(recommended_size) - 1)
        
        # Déterminer le type d'ajustement
        fit_types = ['ajusté', 'regular', 'relaxé']
        fit_type = random.choice(fit_types)
        
        # Créer la recommandation
        recommendation = SizeRecommendation.objects.update_or_create(
            user=user,
            product=product,
            defaults={
                'recommended_size': recommended_size,
                'confidence': 0.78,
                'fit_type': fit_type,
                'reasoning': f"Basé sur votre taille ({user_height}cm) et poids ({user_weight}kg), "
                           f"nous recommandons la taille {recommended_size} pour un ajustement {fit_type}."
            }
        )
        
        serializer = SizeRecommendationSerializer(recommendation[0], context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def personalized_recommendations(self, request):
        """Génère des recommandations de produits personnalisées"""
        user = request.user
        profile = self.get_profile()
        
        # Obtenir les préférences de l'utilisateur
        preferred_categories = list(profile.style_preferences.get('categories', {}).keys())
        preferred_tags = profile.style_preferences.get('tags', [])
        
        # Filtrer les produits
        products = Product.objects.filter(is_active=True)
        
        if preferred_categories:
            products = products.filter(category__name__in=preferred_categories)
        
        if preferred_tags:
            products = products.filter(tags__name__in=preferred_tags)
        
        # Exclure les produits déjà achetés
        purchased_products = OrderItem.objects.filter(
            order__user=user,
            order__status='delivered'
        ).values_list('product_id', flat=True)
        
        products = products.exclude(id__in=purchased_products)
        
        # Trier par pertinence et retourner les 12 meilleurs
        recommended_products = products.distinct().order_by('-average_rating', '-sales_count')[:12]
        
        from apps.products.serializers import ProductListSerializer
        serializer = ProductListSerializer(recommended_products, many=True, context={'request': request})
        
        return Response({
            'recommendations': serializer.data,
            'based_on': {
                'categories': preferred_categories[:5],
                'tags': preferred_tags[:10],
                'purchases_excluded': len(purchased_products)
            }
        })
