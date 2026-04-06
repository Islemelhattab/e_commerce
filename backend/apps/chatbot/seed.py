"""Add to seed_data.py command or run standalone."""

def seed_chatbot():
    from apps.chatbot.models import ChatbotConfig, FAQCategory, FAQ, QuickReply

    # Config
    config, _ = ChatbotConfig.objects.get_or_create(
        pk=list(ChatbotConfig.objects.values_list('id', flat=True)[:1] or [''])[0] or __import__('uuid').uuid4()
    )
    if not ChatbotConfig.objects.exists():
        ChatbotConfig.objects.create(
            name='Assistant ShopWave',
            welcome_message="Bonjour ! 👋 Je suis votre assistant ShopWave, disponible 24h/24. Comment puis-je vous aider aujourd'hui ?",
            fallback_message="Je n'ai pas bien compris votre demande. Voulez-vous que je vous mette en relation avec un conseiller ou consulter notre FAQ ?",
            escalation_message="Je crée un ticket de support pour vous. Notre équipe vous contactera par email sous 2h (Lun-Ven 9h-18h). Merci de votre patience !",
            human_support_email='support@shopwave.tn',
            human_support_hours='Lun-Ven, 9h-18h',
            avatar_color='#E63946',
        )
        print('  ✓ Chatbot config created')

    # FAQ Categories
    cats = {}
    for name, icon in [
        ('Commandes & Livraison', 'truck'),
        ('Retours & Remboursements', 'refresh'),
        ('Compte & Connexion', 'user'),
        ('Paiement', 'credit-card'),
        ('Produits', 'tag'),
    ]:
        cat, _ = FAQCategory.objects.get_or_create(name=name, defaults={'icon': icon})
        cats[name] = cat

    # FAQs
    faqs_data = [
        {
            'category': 'Commandes & Livraison',
            'question': 'Comment suivre ma commande ?',
            'answer': """Pour suivre votre commande :

1. **Connectez-vous** à votre compte ShopWave
2. Allez dans **"Mes commandes"**
3. Cliquez sur votre commande pour voir le statut

Vous pouvez aussi donner votre **numéro de commande** (format SW-XXXXXXXX) directement dans ce chat !

📧 Un email de suivi avec votre numéro de tracking vous est envoyé dès l'expédition.""",
            'keywords': 'commande, suivi, tracking, livraison, statut, où est, colis, expédié',
            'priority': 10,
        },
        {
            'category': 'Commandes & Livraison',
            'question': 'Quels sont les délais de livraison ?',
            'answer': """**Délais de livraison ShopWave :**

🚚 **Standard** : 2-5 jours ouvrables — 7 DT (gratuite dès 150 DT)
⚡ **Express** : Livraison en 24h — 15 DT
🏪 **Retrait en magasin** : Disponible à Tunis, Sfax, Sousse — Gratuit

Les commandes passées avant **14h** sont expédiées le jour même (jours ouvrables).

Vous recevez un **email de confirmation** avec numéro de suivi dès l'expédition.""",
            'keywords': 'délai, livraison, expédition, jours, combien de temps, quand, recevoir, standard, express',
            'priority': 9,
        },
        {
            'category': 'Commandes & Livraison',
            'question': 'Puis-je modifier ou annuler ma commande ?',
            'answer': """**Modification/Annulation de commande :**

✅ Vous pouvez annuler une commande si elle est encore au statut **"En attente"** ou **"Confirmée"**.

**Comment faire :**
1. Allez dans "Mes commandes"
2. Ouvrez la commande concernée
3. Cliquez sur "Annuler la commande"

⚠️ Une fois la commande **"En traitement"** ou **"Expédiée"**, l'annulation n'est plus possible. Vous devrez faire une **demande de retour** à la réception.""",
            'keywords': 'modifier, annuler, annulation, changer, commande, cancel',
            'priority': 8,
        },
        {
            'category': 'Retours & Remboursements',
            'question': 'Quelle est la politique de retour ?',
            'answer': """**Politique de retour ShopWave — 30 jours**

Vous avez **30 jours** après réception pour retourner un article.

✅ **Conditions :**
- Article dans son état d'origine (non utilisé)
- Emballage intact (ou acceptable)
- Tous les accessoires inclus

🚫 **Articles non retournables :**
- Sous-vêtements et articles d'hygiène
- Articles numériques et logiciels
- Articles personnalisés

💰 **Remboursement** : traité en 5-7 jours ouvrables après réception du retour.""",
            'keywords': 'retour, rembours, échange, politique, conditions, 30 jours, renvoyer',
            'priority': 10,
        },
        {
            'category': 'Retours & Remboursements',
            'question': 'Comment initier un retour ?',
            'answer': """**Pour retourner un article :**

1. Connectez-vous à votre compte
2. Allez dans **"Mes commandes"**
3. Ouvrez la commande contenant l'article
4. Cliquez **"Demander un retour"**
5. Sélectionnez le motif et l'article
6. Confirmez votre demande

📦 Vous recevrez une **étiquette de retour** par email sous 24h.

Le remboursement est effectué sur votre moyen de paiement original sous **5-7 jours ouvrables**.""",
            'keywords': 'comment retourner, initier retour, étiquette, procédure retour',
            'priority': 9,
        },
        {
            'category': 'Paiement',
            'question': 'Quels moyens de paiement acceptez-vous ?',
            'answer': """**Moyens de paiement ShopWave :**

💳 **Carte bancaire** (Visa, Mastercard) via Stripe — 100% sécurisé
📱 **Paiement mobile** (D17, Postepay mobile)
💵 **Paiement à la livraison** (cash)

🔒 Tous les paiements en ligne sont **chiffrés SSL** et sécurisés.

❌ **Pas de frais supplémentaires** selon le mode de paiement choisi.""",
            'keywords': 'paiement, carte, visa, mastercard, mobile, cod, livraison, moyens, stripe, sécurisé',
            'priority': 9,
        },
        {
            'category': 'Paiement',
            'question': 'Mon paiement a échoué, que faire ?',
            'answer': """**Paiement échoué — Solutions :**

1. **Vérifiez vos informations** de carte (numéro, date, CVV)
2. **Vérifiez le plafond** de votre carte
3. **Contactez votre banque** — parfois les paiements en ligne sont bloqués par défaut
4. **Essayez un autre moyen** de paiement (mobile ou livraison)
5. **Videz le cache** de votre navigateur et réessayez

Si le problème persiste, je peux vous mettre en relation avec notre support technique.""",
            'keywords': 'paiement échoué, erreur paiement, refusé, carte refusée, problème paiement',
            'priority': 8,
        },
        {
            'category': 'Compte & Connexion',
            'question': 'J\'ai oublié mon mot de passe',
            'answer': """**Mot de passe oublié :**

1. Allez sur la page de **connexion**
2. Cliquez **"Mot de passe oublié ?"**
3. Entrez votre **adresse email**
4. Vérifiez votre boîte mail (et les spams)
5. Cliquez le lien reçu (valide 24h)
6. Choisissez un nouveau mot de passe

⏱️ Le lien expire après **24 heures**.

📧 Si vous ne recevez pas l'email, vérifiez votre dossier spam ou contactez-nous.""",
            'keywords': 'mot de passe, oublié, connexion, reset, réinitialiser, login, compte',
            'priority': 9,
        },
        {
            'category': 'Produits',
            'question': 'Comment savoir si un produit est en stock ?',
            'answer': """**Vérifier la disponibilité :**

Sur la **fiche produit** :
- ✅ "En stock (X disponibles)" — Disponible à la commande
- ❌ "Rupture de stock" — Temporairement indisponible

💡 **Astuce :** Ajoutez les articles en rupture à vos **favoris** ❤️ pour être notifié dès le retour en stock.

Vous pouvez aussi me donner le nom du produit et je vérifierai pour vous !""",
            'keywords': 'stock, disponible, disponibilité, rupture, en stock, épuisé, dispo',
            'priority': 8,
        },
    ]

    for faq_data in faqs_data:
        cat_name = faq_data.pop('category')
        faq_data['category'] = cats.get(cat_name)
        FAQ.objects.get_or_create(question=faq_data['question'], defaults=faq_data)

    print(f'  ✓ {FAQ.objects.count()} FAQs created')

    # Quick replies
    quick_replies = [
        {'label': '📦 Suivre ma commande', 'message': 'Je veux suivre ma commande', 'order': 1},
        {'label': '🔄 Politique de retour', 'message': 'Quelle est la politique de retour ?', 'order': 2},
        {'label': '🚚 Délais de livraison', 'message': 'Quels sont les délais de livraison ?', 'order': 3},
        {'label': '💳 Moyens de paiement', 'message': 'Quels moyens de paiement acceptez-vous ?', 'order': 4},
        {'label': '👤 Parler à un agent', 'message': 'Je veux parler à un conseiller humain', 'order': 5, 'show_at_start': True},
    ]

    for qr in quick_replies:
        QuickReply.objects.get_or_create(label=qr['label'], defaults=qr)

    print(f'  ✓ {QuickReply.objects.count()} quick replies created')
