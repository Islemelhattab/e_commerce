from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from rest_framework import serializers
from django.utils import timezone
from .models import (
    ChatSession, ChatMessage, FAQ, FAQCategory,
    QuickReply, ChatbotConfig, SupportTicket
)
from .nlp import nlp


# ==================== SERIALIZERS ====================
class FAQCategorySerializer(serializers.ModelSerializer):
    faq_count = serializers.SerializerMethodField()

    class Meta:
        model = FAQCategory
        fields = ['id', 'name', 'icon', 'order', 'is_active', 'faq_count']

    def get_faq_count(self, obj):
        return obj.faqs.filter(is_active=True).count()


class FAQSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = FAQ
        fields = ['id', 'category', 'category_name', 'question', 'answer',
                  'keywords', 'is_active', 'priority', 'view_count',
                  'helpful_count', 'not_helpful_count', 'created_at', 'updated_at']
        read_only_fields = ['view_count', 'helpful_count', 'not_helpful_count', 'created_at', 'updated_at']


class QuickReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickReply
        fields = ['id', 'label', 'message', 'icon', 'order', 'is_active', 'show_at_start']


class ChatbotConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotConfig
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender_type', 'message_type', 'content', 'metadata',
                  'intent', 'confidence', 'is_read', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    user_name = serializers.ReadOnlyField()
    message_count = serializers.ReadOnlyField()

    class Meta:
        model = ChatSession
        fields = ['id', 'user_name', 'status', 'started_at', 'last_activity',
                  'rating', 'rating_comment', 'message_count', 'messages', 'tags']


class ChatSessionListSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField()
    message_count = serializers.ReadOnlyField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'user_name', 'status', 'started_at', 'last_activity',
                  'rating', 'message_count', 'last_message', 'tags']

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'content': msg.content[:100], 'sender_type': msg.sender_type, 'created_at': msg.created_at.isoformat()}
        return None


# ==================== CHATBOT CLIENT VIEWS ====================
class ChatInitView(APIView):
    """Initialize a chat session and return config + quick replies."""
    permission_classes = [AllowAny]

    def post(self, request):
        config = ChatbotConfig.objects.first()
        quick_replies = QuickReply.objects.filter(is_active=True, show_at_start=True)

        # Create session
        user = request.user if request.user.is_authenticated else None
        session = ChatSession.objects.create(
            user=user,
            session_key=request.data.get('session_key', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            ip_address=self._get_client_ip(request),
        )

        # Add welcome message
        welcome_content = config.welcome_message if config else "Bonjour ! Comment puis-je vous aider ?"
        ChatMessage.objects.create(
            session=session,
            sender_type='bot',
            message_type='text',
            content=welcome_content,
            intent='greeting',
        )

        return Response({
            'session_id': str(session.id),
            'config': ChatbotConfigSerializer(config).data if config else {
                'name': 'Assistant ShopWave',
                'avatar_color': '#E63946',
            },
            'quick_replies': QuickReplySerializer(quick_replies, many=True).data,
            'welcome_message': welcome_content,
        })

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class ChatSendMessageView(APIView):
    """Send a message and get bot response."""
    permission_classes = [AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        message_text = request.data.get('message', '').strip()

        if not session_id or not message_text:
            return Response({'error': 'session_id et message requis'}, status=400)

        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session introuvable'}, status=404)

        if session.status == 'escalated':
            return Response({
                'messages': [],
                'info': 'Cette conversation a été escaladée. Un agent vous contactera bientôt.',
            })

        # Save user message
        user_msg = ChatMessage.objects.create(
            session=session,
            sender_type='user',
            message_type='text',
            content=message_text,
        )

        # Generate bot response
        user = request.user if request.user.is_authenticated else None
        response_data = nlp.generate_response(message_text, session, user)

        # Save bot message
        bot_msg = ChatMessage.objects.create(
            session=session,
            sender_type='bot',
            message_type=response_data.get('message_type', 'text'),
            content=response_data['content'],
            metadata=response_data.get('metadata', {}),
            intent=response_data.get('intent', ''),
            confidence=response_data.get('confidence', 0),
            faq_id=response_data.get('faq_id'),
        )

        return Response({
            'user_message': ChatMessageSerializer(user_msg).data,
            'bot_response': {
                **ChatMessageSerializer(bot_msg).data,
                'quick_replies': response_data.get('quick_replies', []),
            },
        })


class ChatEscalateView(APIView):
    """Escalate chat to human support."""
    permission_classes = [AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        user_email = request.data.get('email', '')
        user_name = request.data.get('name', '')
        subject = request.data.get('subject', 'Demande de support')

        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session introuvable'}, status=404)

        session.status = 'escalated'
        session.escalated_to_email = user_email
        session.save(update_fields=['status', 'escalated_to_email'])

        # Create support ticket
        if not hasattr(session, 'ticket'):
            ticket = SupportTicket.objects.create(
                session=session,
                user=session.user,
                subject=subject or f"Chat escaladé - {user_name or 'Visiteur'}",
                priority='medium',
            )
            ticket_number = ticket.ticket_number
        else:
            ticket_number = session.ticket.ticket_number

        # System message
        config = ChatbotConfig.objects.first()
        escalation_msg = config.escalation_message if config else "Vous êtes mis en relation avec notre équipe."
        ChatMessage.objects.create(
            session=session,
            sender_type='system',
            message_type='escalation',
            content=escalation_msg,
            metadata={'ticket_number': ticket_number, 'user_email': user_email},
            intent='escalation',
        )

        # Send email notification to support team
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            messages = session.messages.filter(sender_type='user').values_list('content', flat=True)
            conversation = '\n'.join([f"Client: {m}" for m in messages])
            send_mail(
                subject=f'[ShopWave Support] Nouveau ticket {ticket_number}',
                message=f"""Nouveau ticket de support créé.

Ticket: {ticket_number}
Client: {user_name or 'Anonyme'}
Email: {user_email or 'Non fourni'}

Conversation:
{conversation}

Répondre à: {user_email or 'Pas d\'email fourni'}
""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.DEFAULT_FROM_EMAIL],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({
            'ticket_number': ticket_number,
            'message': 'Votre demande a été escaladée. Notre équipe vous contactera bientôt.',
            'status': 'escalated',
        })


class ChatRateView(APIView):
    """Rate a chat session."""
    permission_classes = [AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        try:
            session = ChatSession.objects.get(id=session_id)
            session.rating = int(rating)
            session.rating_comment = comment
            session.status = 'resolved'
            session.ended_at = timezone.now()
            session.save()
            return Response({'message': 'Merci pour votre évaluation !'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class FAQHelpfulView(APIView):
    """Mark FAQ as helpful or not."""
    permission_classes = [AllowAny]

    def post(self, request, faq_id):
        helpful = request.data.get('helpful', True)
        try:
            faq = FAQ.objects.get(id=faq_id)
            if helpful:
                faq.helpful_count += 1
            else:
                faq.not_helpful_count += 1
            faq.save(update_fields=['helpful_count', 'not_helpful_count'])
            return Response({'message': 'Merci pour votre retour !'})
        except FAQ.DoesNotExist:
            return Response({'error': 'FAQ non trouvée'}, status=404)


class PublicFAQView(APIView):
    """Public FAQ listing grouped by category."""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = FAQCategory.objects.filter(is_active=True).prefetch_related(
            'faqs'
        )
        search = request.query_params.get('search', '')

        result = []
        for cat in categories:
            faqs = cat.faqs.filter(is_active=True)
            if search:
                faqs = faqs.filter(question__icontains=search) | faqs.filter(keywords__icontains=search)
            if faqs.exists():
                result.append({
                    'category': FAQCategorySerializer(cat).data,
                    'faqs': FAQSerializer(faqs, many=True).data
                })

        # Uncategorized FAQs
        uncategorized = FAQ.objects.filter(is_active=True, category=None)
        if search:
            uncategorized = uncategorized.filter(question__icontains=search) | uncategorized.filter(keywords__icontains=search)
        if uncategorized.exists():
            result.append({
                'category': {'id': None, 'name': 'Général', 'icon': ''},
                'faqs': FAQSerializer(uncategorized, many=True).data
            })

        return Response(result)


# ==================== ADMIN CHATBOT VIEWS ====================
class AdminChatSessionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    filter_backends = []

    def get_queryset(self):
        qs = ChatSession.objects.select_related('user').prefetch_related('messages')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatSessionSerializer
        return ChatSessionListSerializer

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        session = self.get_object()
        session.status = 'resolved'
        session.ended_at = timezone.now()
        session.save()
        return Response({'message': 'Session fermée'})

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Admin replies to an escalated chat."""
        session = self.get_object()
        content = request.data.get('message', '')
        if not content:
            return Response({'error': 'Message requis'}, status=400)

        msg = ChatMessage.objects.create(
            session=session,
            sender_type='agent',
            message_type='text',
            content=content,
        )
        return Response(ChatMessageSerializer(msg).data)


class AdminFAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.select_related('category').all()
    serializer_class = FAQSerializer
    permission_classes = [IsAdminUser]
    filter_backends = []

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        is_active = self.request.query_params.get('is_active')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category__id=category)
        if is_active is not None:
            qs = qs.filter(is_active=is_active == 'true')
        if search:
            qs = qs.filter(question__icontains=search)
        return qs


class AdminFAQCategoryViewSet(viewsets.ModelViewSet):
    queryset = FAQCategory.objects.all()
    serializer_class = FAQCategorySerializer
    permission_classes = [IsAdminUser]


class AdminQuickReplyViewSet(viewsets.ModelViewSet):
    queryset = QuickReply.objects.all()
    serializer_class = QuickReplySerializer
    permission_classes = [IsAdminUser]


class AdminChatbotConfigView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        config = ChatbotConfig.objects.first()
        if not config:
            config = ChatbotConfig.objects.create()
        return Response(ChatbotConfigSerializer(config).data)

    def patch(self, request):
        config = ChatbotConfig.objects.first()
        if not config:
            config = ChatbotConfig.objects.create()
        serializer = ChatbotConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminChatStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Avg, Count
        total = ChatSession.objects.count()
        by_status = dict(ChatSession.objects.values_list('status').annotate(c=Count('id')))
        avg_rating = ChatSession.objects.filter(rating__isnull=False).aggregate(avg=Avg('rating'))['avg']
        top_intents = list(
            ChatMessage.objects.filter(sender_type='bot', intent__gt='')
            .values('intent').annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        top_faqs = list(
            FAQ.objects.filter(view_count__gt=0).order_by('-view_count')[:10]
            .values('id', 'question', 'view_count', 'helpful_count', 'not_helpful_count')
        )
        return Response({
            'total_sessions': total,
            'by_status': by_status,
            'avg_rating': round(avg_rating, 2) if avg_rating else None,
            'top_intents': top_intents,
            'top_faqs': top_faqs,
            'escalated_count': by_status.get('escalated', 0),
            'resolved_count': by_status.get('resolved', 0),
        })
