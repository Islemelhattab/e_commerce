from django.db import models
import uuid


class ChatbotConfig(models.Model):
    """Global chatbot configuration - singleton pattern."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, default='Assistant ShopWave')
    welcome_message = models.TextField(
        default="Bonjour ! Je suis l'assistant ShopWave. Comment puis-je vous aider aujourd'hui ?"
    )
    fallback_message = models.TextField(
        default="Je n'ai pas compris votre demande. Souhaitez-vous être mis en relation avec un conseiller humain ?"
    )
    escalation_message = models.TextField(
        default="Je vous mets en relation avec un conseiller. Notre équipe vous répondra dans les plus brefs délais."
    )
    is_active = models.BooleanField(default=True)
    human_support_email = models.EmailField(default='support@shopwave.tn')
    human_support_hours = models.CharField(max_length=100, default='Lun-Ven, 9h-18h')
    avatar_color = models.CharField(max_length=10, default='#E63946')
    auto_open_delay = models.IntegerField(default=0, help_text='Secondes avant ouverture automatique (0 = désactivé)')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chatbot_config'
        verbose_name = 'Configuration Chatbot'

    def __str__(self):
        return self.name

    @classmethod
    def get_config(cls):
        obj, _ = cls.objects.get_or_create(pk=list(cls.objects.values_list('id', flat=True)[:1] or [uuid.uuid4()])[0])
        return obj


class FAQCategory(models.Model):
    """FAQ categories for organization."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, help_text='SVG path or icon name')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'faq_categories'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class FAQ(models.Model):
    """Frequently asked questions with keyword matching."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(FAQCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='faqs')
    question = models.CharField(max_length=500)
    answer = models.TextField()
    keywords = models.TextField(
        blank=True,
        help_text='Mots-clés séparés par des virgules pour la détection automatique'
    )
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0, help_text='Plus la valeur est haute, plus la priorité est élevée')
    view_count = models.IntegerField(default=0)
    helpful_count = models.IntegerField(default=0)
    not_helpful_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'faqs'
        ordering = ['-priority', '-view_count']

    def get_keywords_list(self):
        return [k.strip().lower() for k in self.keywords.split(',') if k.strip()]

    def __str__(self):
        return self.question[:80]


class QuickReply(models.Model):
    """Predefined quick reply buttons shown in the chat."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    label = models.CharField(max_length=100)
    message = models.CharField(max_length=500, help_text='Message envoyé quand le client clique')
    icon = models.CharField(max_length=50, blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    show_at_start = models.BooleanField(default=True, help_text='Afficher au démarrage de la conversation')

    class Meta:
        db_table = 'chatbot_quick_replies'
        ordering = ['order']

    def __str__(self):
        return self.label


class ChatSession(models.Model):
    """A single user chat session."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('escalated', 'Escaladée vers support'),
        ('resolved', 'Résolue'),
        ('abandoned', 'Abandonnée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='chat_sessions'
    )
    session_key = models.CharField(max_length=100, blank=True, help_text='For anonymous users')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)])
    rating_comment = models.TextField(blank=True)
    escalated_to_email = models.EmailField(blank=True)
    tags = models.JSONField(default=list)

    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-started_at']

    @property
    def message_count(self):
        return self.messages.count()

    @property
    def user_name(self):
        if self.user:
            return self.user.get_full_name() or self.user.email
        return 'Visiteur anonyme'

    def __str__(self):
        return f"Session {self.id} - {self.user_name}"


class ChatMessage(models.Model):
    """A single message in a chat session."""
    SENDER_TYPES = [
        ('user', 'Client'),
        ('bot', 'Bot'),
        ('agent', 'Agent humain'),
        ('system', 'Système'),
    ]
    MESSAGE_TYPES = [
        ('text', 'Texte'),
        ('quick_reply', 'Réponse rapide'),
        ('product_card', 'Carte produit'),
        ('order_status', 'Statut commande'),
        ('faq', 'FAQ'),
        ('escalation', 'Escalade'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPES)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    metadata = models.JSONField(default=dict, help_text='Extra data: product info, order info, etc.')
    faq = models.ForeignKey(FAQ, on_delete=models.SET_NULL, null=True, blank=True)
    intent = models.CharField(max_length=100, blank=True, help_text='Detected intent')
    confidence = models.FloatField(null=True, blank=True, help_text='NLP confidence score')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.sender_type}] {self.content[:60]}"


class SupportTicket(models.Model):
    """Created when chat is escalated to human support."""
    PRIORITY = [('low', 'Faible'), ('medium', 'Moyen'), ('high', 'Élevé'), ('urgent', 'Urgent')]
    STATUS = [('open', 'Ouvert'), ('in_progress', 'En cours'), ('resolved', 'Résolu'), ('closed', 'Fermé')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True, blank=True)
    session = models.OneToOneField(ChatSession, on_delete=models.CASCADE, related_name='ticket')
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.CharField(max_length=300)
    priority = models.CharField(max_length=10, choices=PRIORITY, default='medium')
    status = models.CharField(max_length=20, choices=STATUS, default='open')
    assigned_to = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_tickets'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'support_tickets'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            import random, string
            self.ticket_number = 'TKT-' + ''.join(random.choices(string.digits, k=6))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_number}: {self.subject}"
