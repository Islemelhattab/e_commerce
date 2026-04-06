"""
ShopWave Chatbot NLP Engine
Keyword-based intent detection + contextual response generation.
No external AI dependency — works offline.
"""
import re
from difflib import SequenceMatcher


# ==================== INTENT DEFINITIONS ====================
INTENTS = {
    'order_tracking': {
        'keywords': ['commande', 'suivi', 'livraison', 'où est', 'status', 'statut', 'tracking', 'expédié', 'reçu', 'colis', 'numéro de commande', 'sw-'],
        'priority': 10,
    },
    'return_policy': {
        'keywords': ['retour', 'rembours', 'échange', 'renvoyer', 'annuler', 'remboursement', 'retourner', 'satisfait', 'non satisfait'],
        'priority': 9,
    },
    'product_availability': {
        'keywords': ['disponible', 'stock', 'en stock', 'rupture', 'dispo', 'disponibilité', 'acheter', 'commander', 'existe'],
        'priority': 8,
    },
    'product_recommendation': {
        'keywords': ['recommande', 'conseil', 'meilleur', 'populaire', 'tendance', 'nouveau', 'suggestion', 'choisir', 'lequel', 'que me conseillez'],
        'priority': 7,
    },
    'delivery_info': {
        'keywords': ['délai', 'livraison', 'expédition', 'combien de temps', 'quand', 'recevoir', 'jours', 'gratuit', 'frais de port'],
        'priority': 8,
    },
    'payment_info': {
        'keywords': ['paiement', 'payer', 'carte', 'virement', 'cod', 'livraison', 'sécurisé', 'stripe', 'mobile payment', 'moyens de paiement'],
        'priority': 7,
    },
    'contact_support': {
        'keywords': ['parler', 'humain', 'conseiller', 'agent', 'help', 'aide', 'contact', 'support', 'problème', 'urgence', 'appelez'],
        'priority': 9,
    },
    'greeting': {
        'keywords': ['bonjour', 'salut', 'bonsoir', 'hello', 'hi', 'hey', 'bonne journée', 'coucou'],
        'priority': 5,
    },
    'farewell': {
        'keywords': ['au revoir', 'bye', 'merci', 'à bientôt', 'bonne journée', 'ciao', 'merci beaucoup'],
        'priority': 5,
    },
    'price_info': {
        'keywords': ['prix', 'coût', 'combien', 'tarif', 'promotion', 'solde', 'réduction', 'discount', 'offre'],
        'priority': 7,
    },
    'account_help': {
        'keywords': ['compte', 'mot de passe', 'connexion', 'inscription', 'profil', 'email', 'login', 'register', 'oublié'],
        'priority': 6,
    },
    'complaint': {
        'keywords': ['réclamation', 'plainte', 'problème', 'défectueux', 'cassé', 'abîmé', 'mauvais', 'déçu', 'arnaque', 'pas reçu'],
        'priority': 10,
    },
}

# ==================== STATIC RESPONSES ====================
STATIC_RESPONSES = {
    'greeting': [
        "Bonjour ! Ravi de vous accueillir sur ShopWave. Comment puis-je vous aider aujourd'hui ?",
        "Salut ! Je suis votre assistant ShopWave, disponible 24h/24. Que puis-je faire pour vous ?",
    ],
    'farewell': [
        "Merci d'avoir utilisé ShopWave ! N'hésitez pas à revenir si vous avez d'autres questions. Bonne journée !",
        "Au revoir ! C'était un plaisir vous aider. À très bientôt sur ShopWave !",
    ],
    'return_policy': """**Politique de retour ShopWave** 🔄

Vous bénéficiez de **30 jours** pour retourner un article à compter de la date de réception.

✅ **Conditions :**
- Article dans son état d'origine
- Emballage intact ou acceptable
- Avec le bon de commande

💰 **Remboursement :** Traité sous 5-7 jours ouvrables après réception du retour.

📦 **Comment faire un retour ?**
1. Connectez-vous à votre compte
2. Allez dans "Mes commandes"
3. Cliquez "Demander un retour"

Avez-vous besoin d'aide pour initier un retour spécifique ?""",

    'delivery_info': """**Livraison ShopWave** 🚚

📦 **Livraison standard** : 2-5 jours — 7 DT (gratuite dès 150 DT d'achat)
⚡ **Livraison express** : 24h — 15 DT
🏪 **Retrait en magasin** : Gratuit (Tunis, Sfax, Sousse)

Votre commande est préparée et expédiée sous **24h** (jours ouvrables).

Vous recevez un email avec votre numéro de suivi dès l'expédition.

Avez-vous une commande à suivre ? Donnez-moi votre numéro de commande !""",

    'payment_info': """**Moyens de paiement** 💳

🔒 Tous nos paiements sont **100% sécurisés** et chiffrés.

✅ Carte bancaire (Visa, Mastercard) via Stripe
📱 Paiement mobile (D17, Postepay)
💵 Paiement à la livraison (cash)

**Aucun frais supplémentaire** n'est appliqué selon le mode de paiement.

Avez-vous un problème avec un paiement ?""",

    'account_help': """**Aide compte ShopWave** 👤

❓ **Mot de passe oublié ?**
→ Cliquez "Mot de passe oublié" sur la page de connexion

❓ **Pas encore de compte ?**
→ Inscrivez-vous avec votre email, téléphone ou CIN

❓ **Problème de connexion ?**
→ Vérifiez votre email et assurez-vous que votre compte est actif

Je peux vous guider étape par étape. Quel est votre problème exactement ?""",

    'contact_support': None,  # Handled dynamically (escalation)
    'complaint': None,  # Handled dynamically (escalation + empathy)
    'product_availability': None,  # Handled dynamically (DB lookup)
    'order_tracking': None,  # Handled dynamically (DB lookup)
    'product_recommendation': None,  # Handled dynamically (DB lookup)
    'price_info': None,  # Handled dynamically
}

# ==================== NLP ENGINE ====================
class ChatbotNLP:
    def __init__(self):
        self._faq_cache = None
        self._faq_cache_time = None

    def normalize(self, text: str) -> str:
        """Normalize text for comparison."""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    def detect_intent(self, message: str) -> tuple[str, float]:
        """Detect user intent from message. Returns (intent, confidence)."""
        normalized = self.normalize(message)
        words = set(normalized.split())

        scores = {}
        for intent, config in INTENTS.items():
            score = 0
            keywords = config['keywords']
            priority = config.get('priority', 5)

            for keyword in keywords:
                kw_lower = keyword.lower()
                if kw_lower in normalized:
                    # Boost for exact phrase match
                    score += 2 if ' ' in kw_lower else 1

            if score > 0:
                # Normalize by number of keywords and apply priority
                confidence = min(1.0, (score / len(keywords)) * (priority / 10) * 3)
                scores[intent] = confidence

        if not scores:
            return 'unknown', 0.0

        best_intent = max(scores, key=scores.get)
        return best_intent, min(1.0, scores[best_intent])

    def extract_order_number(self, message: str) -> str | None:
        """Extract order number from message."""
        # Match patterns like SW-12345678, sw-12345678, #SW-12345678
        pattern = r'(?:sw[-\s]?)(\d{6,10})|#?([A-Z]{2}-\d{6,10})'
        match = re.search(pattern, message.upper())
        if match:
            return match.group(0).replace(' ', '-').upper()
        # Match just numbers if context is order tracking
        num_match = re.search(r'\b(\d{6,10})\b', message)
        if num_match:
            return f"SW-{num_match.group(1)}"
        return None

    def match_faq(self, message: str) -> list:
        """Find matching FAQs using keyword matching and similarity."""
        from apps.chatbot.models import FAQ
        normalized = self.normalize(message)
        faqs = FAQ.objects.filter(is_active=True).order_by('-priority')

        matches = []
        for faq in faqs:
            score = 0
            keywords = faq.get_keywords_list()

            for kw in keywords:
                if kw in normalized:
                    score += 2

            # Also check question similarity
            q_sim = SequenceMatcher(None, normalized, self.normalize(faq.question)).ratio()
            if q_sim > 0.4:
                score += q_sim * 3

            if score > 1:
                matches.append((faq, score))

        matches.sort(key=lambda x: x[1], reverse=True)
        return [faq for faq, _ in matches[:3]]

    def generate_response(self, message: str, session, user=None) -> dict:
        """
        Main response generation function.
        Returns dict with: content, message_type, metadata, intent, quick_replies
        """
        intent, confidence = self.detect_intent(message)
        order_number = self.extract_order_number(message)

        # Try to match FAQ first if confidence is low
        if confidence < 0.4 or intent == 'unknown':
            faq_matches = self.match_faq(message)
            if faq_matches:
                faq = faq_matches[0]
                faq.view_count += 1
                faq.save(update_fields=['view_count'])
                return {
                    'content': faq.answer,
                    'message_type': 'faq',
                    'intent': 'faq_match',
                    'confidence': confidence,
                    'faq_id': str(faq.id),
                    'metadata': {'faq_question': faq.question},
                    'quick_replies': self._get_quick_replies(['helpful_yes', 'helpful_no', 'more_help'])
                }

        # Handle specific intents
        if intent == 'order_tracking':
            return self._handle_order_tracking(message, order_number, user, confidence)

        elif intent == 'product_availability':
            return self._handle_product_availability(message, confidence)

        elif intent == 'product_recommendation':
            return self._handle_product_recommendation(confidence)

        elif intent in ('contact_support', 'complaint'):
            return self._handle_escalation(intent, confidence)

        elif intent in STATIC_RESPONSES and STATIC_RESPONSES[intent]:
            import random
            responses = STATIC_RESPONSES[intent]
            content = random.choice(responses) if isinstance(responses, list) else responses
            return {
                'content': content,
                'message_type': 'text',
                'intent': intent,
                'confidence': confidence,
                'metadata': {},
                'quick_replies': self._get_default_quick_replies()
            }

        else:
            # Fallback
            from apps.chatbot.models import ChatbotConfig
            config = ChatbotConfig.objects.first()
            fallback = config.fallback_message if config else "Je n'ai pas compris. Voulez-vous parler à un conseiller ?"
            return {
                'content': fallback,
                'message_type': 'text',
                'intent': 'unknown',
                'confidence': confidence,
                'metadata': {},
                'quick_replies': self._get_quick_replies(['escalate', 'faq_browse', 'start_over'])
            }

    def _handle_order_tracking(self, message, order_number, user, confidence):
        """Look up real order from DB."""
        if order_number:
            try:
                from apps.orders.models import Order
                q = {'order_number__iexact': order_number}
                if user and user.is_authenticated:
                    q['user'] = user
                order = Order.objects.get(**q)

                status_labels = {
                    'pending': '⏳ En attente de confirmation',
                    'confirmed': '✅ Confirmée',
                    'processing': '📦 En cours de préparation',
                    'shipped': '🚚 Expédiée',
                    'out_for_delivery': '🏃 En cours de livraison',
                    'delivered': '✅ Livrée',
                    'cancelled': '❌ Annulée',
                }
                status_text = status_labels.get(order.status, order.status)
                tracking_info = f"\n📍 **Numéro de suivi :** {order.tracking_number}" if order.tracking_number else ""
                delivery_info = f"\n📅 **Livraison estimée :** {order.estimated_delivery.strftime('%d/%m/%Y')}" if order.estimated_delivery else ""

                content = f"""**Commande #{order.order_number}**

📊 **Statut :** {status_text}
💰 **Total :** {order.total} DT
🗓️ **Passée le :** {order.created_at.strftime('%d/%m/%Y')}{tracking_info}{delivery_info}

Vous pouvez voir tous les détails dans votre espace client."""

                return {
                    'content': content,
                    'message_type': 'order_status',
                    'intent': 'order_tracking',
                    'confidence': confidence,
                    'metadata': {
                        'order_id': str(order.id),
                        'order_number': order.order_number,
                        'status': order.status,
                        'total': str(order.total),
                    },
                    'quick_replies': self._get_quick_replies(['view_order', 'contact_support'])
                }
            except Exception:
                pass

        # No order number found or order not found
        if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
            return {
                'content': "Pour suivre votre commande, donnez-moi votre **numéro de commande** (format : SW-XXXXXXXX) ou consultez directement votre espace client.",
                'message_type': 'text',
                'intent': 'order_tracking',
                'confidence': confidence,
                'metadata': {},
                'quick_replies': self._get_quick_replies(['view_my_orders', 'contact_support'])
            }
        else:
            return {
                'content': "Pour suivre votre commande, veuillez vous **connecter** à votre compte ou me donner votre numéro de commande (format : SW-XXXXXXXX).",
                'message_type': 'text',
                'intent': 'order_tracking',
                'confidence': confidence,
                'metadata': {},
                'quick_replies': self._get_quick_replies(['login_prompt', 'contact_support'])
            }

    def _handle_product_availability(self, message, confidence):
        """Search products based on message."""
        from apps.products.models import Product
        words = [w for w in message.lower().split() if len(w) > 3]
        products = []

        for word in words[:3]:
            found = Product.objects.filter(
                name__icontains=word, is_active=True
            ).select_related('category')[:3]
            products.extend(found)

        products = list({p.id: p for p in products}.values())[:3]

        if products:
            p = products[0]
            stock_info = "✅ En stock" if p.in_stock else "❌ Rupture de stock"
            content = f"""**{p.name}**

{stock_info}
💰 **Prix :** {p.price} DT
{"⭐ Note : " + str(round(float(p.average_rating), 1)) + "/5" if p.review_count > 0 else ""}

{p.short_description or ""}"""

            meta = {
                'products': [
                    {'id': str(p.id), 'name': p.name, 'price': str(p.price),
                     'in_stock': p.in_stock, 'slug': p.slug}
                    for p in products
                ]
            }
            return {
                'content': content,
                'message_type': 'product_card',
                'intent': 'product_availability',
                'confidence': confidence,
                'metadata': meta,
                'quick_replies': self._get_quick_replies(['add_to_cart_prompt', 'more_products'])
            }

        return {
            'content': "Je n'ai pas trouvé ce produit spécifique. Pourriez-vous me donner plus de détails ou utiliser notre barre de recherche ?",
            'message_type': 'text',
            'intent': 'product_availability',
            'confidence': confidence,
            'metadata': {},
            'quick_replies': self._get_quick_replies(['search_products', 'contact_support'])
        }

    def _handle_product_recommendation(self, confidence):
        """Recommend popular / featured products."""
        from apps.products.models import Product
        featured = Product.objects.filter(
            is_active=True, is_featured=True, stock__gt=0
        ).order_by('-sales_count')[:4]

        if not featured:
            featured = Product.objects.filter(is_active=True, stock__gt=0).order_by('-sales_count')[:4]

        if featured:
            content = "Voici nos **produits les plus populaires** en ce moment :"
            meta = {
                'products': [
                    {'id': str(p.id), 'name': p.name, 'price': str(p.price),
                     'slug': p.slug, 'rating': float(p.average_rating)}
                    for p in featured
                ]
            }
            return {
                'content': content,
                'message_type': 'product_card',
                'intent': 'product_recommendation',
                'confidence': confidence,
                'metadata': meta,
                'quick_replies': self._get_quick_replies(['view_all_products', 'new_arrivals'])
            }

        return {
            'content': "Découvrez notre catalogue complet avec des milliers de produits ! Avez-vous une catégorie particulière en tête ?",
            'message_type': 'text',
            'intent': 'product_recommendation',
            'confidence': confidence,
            'metadata': {},
            'quick_replies': self._get_quick_replies(['view_all_products'])
        }

    def _handle_escalation(self, intent, confidence):
        """Handle escalation to human support."""
        if intent == 'complaint':
            content = """Je suis vraiment désolé d'apprendre que vous rencontrez un problème. 😔

Votre satisfaction est notre priorité absolue. Je vais **immédiatement créer un ticket de support** pour qu'un conseiller humain vous aide dans les plus brefs délais.

📧 Notre équipe vous contactera par email sous **2h** pendant les heures d'ouverture (Lun-Ven 9h-18h)."""
        else:
            content = """Je comprends. Laissez-moi vous mettre en relation avec l'un de nos **conseillers humains**.

📧 **Email :** support@shopwave.tn
📞 **Heures :** Lun-Ven, 9h-18h

En cliquant sur "Escalader vers un agent", je crée un ticket prioritaire et notre équipe vous contacte rapidement."""

        return {
            'content': content,
            'message_type': 'escalation',
            'intent': intent,
            'confidence': confidence,
            'metadata': {'requires_escalation': True},
            'quick_replies': self._get_quick_replies(['confirm_escalation', 'cancel_escalation'])
        }

    def _get_quick_replies(self, keys: list) -> list:
        """Return quick reply button configs."""
        all_replies = {
            'helpful_yes': {'label': '👍 Utile', 'action': 'helpful', 'value': 'yes'},
            'helpful_no': {'label': '👎 Pas utile', 'action': 'helpful', 'value': 'no'},
            'more_help': {'label': '❓ Autre question', 'action': 'message', 'value': 'J\'ai une autre question'},
            'escalate': {'label': '👤 Parler à un conseiller', 'action': 'escalate', 'value': ''},
            'faq_browse': {'label': '📚 Voir la FAQ', 'action': 'faq', 'value': ''},
            'start_over': {'label': '🔄 Recommencer', 'action': 'restart', 'value': ''},
            'view_order': {'label': '📦 Voir ma commande', 'action': 'link', 'value': '/account/orders'},
            'view_my_orders': {'label': '📋 Mes commandes', 'action': 'link', 'value': '/account/orders'},
            'contact_support': {'label': '💬 Contacter le support', 'action': 'escalate', 'value': ''},
            'login_prompt': {'label': '🔐 Se connecter', 'action': 'link', 'value': '/login'},
            'add_to_cart_prompt': {'label': '🛒 Voir le produit', 'action': 'link', 'value': '/products'},
            'more_products': {'label': '🔍 Plus de produits', 'action': 'link', 'value': '/products'},
            'search_products': {'label': '🔍 Rechercher', 'action': 'link', 'value': '/products'},
            'view_all_products': {'label': '🛍️ Voir tout', 'action': 'link', 'value': '/products'},
            'new_arrivals': {'label': '✨ Nouveautés', 'action': 'link', 'value': '/products?is_new=true'},
            'confirm_escalation': {'label': '✅ Confirmer escalade', 'action': 'escalate', 'value': 'confirm'},
            'cancel_escalation': {'label': '❌ Non merci', 'action': 'message', 'value': 'Non merci, continuez'},
        }
        return [all_replies[k] for k in keys if k in all_replies]

    def _get_default_quick_replies(self) -> list:
        return self._get_quick_replies(['faq_browse', 'escalate', 'more_help'])


# Singleton instance
nlp = ChatbotNLP()
