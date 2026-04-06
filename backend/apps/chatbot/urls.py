from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChatInitView, ChatSendMessageView, ChatEscalateView,
    ChatRateView, FAQHelpfulView, PublicFAQView,
    AdminChatSessionViewSet, AdminFAQViewSet, AdminFAQCategoryViewSet,
    AdminQuickReplyViewSet, AdminChatbotConfigView, AdminChatStatsView,
)

# Public chatbot router
router = DefaultRouter()
router.register(r'admin/sessions', AdminChatSessionViewSet, basename='admin-chat-sessions')
router.register(r'admin/faqs', AdminFAQViewSet, basename='admin-faqs')
router.register(r'admin/faq-categories', AdminFAQCategoryViewSet, basename='admin-faq-categories')
router.register(r'admin/quick-replies', AdminQuickReplyViewSet, basename='admin-quick-replies')

urlpatterns = [
    # Public chat endpoints
    path('init/', ChatInitView.as_view(), name='chat-init'),
    path('message/', ChatSendMessageView.as_view(), name='chat-message'),
    path('escalate/', ChatEscalateView.as_view(), name='chat-escalate'),
    path('rate/', ChatRateView.as_view(), name='chat-rate'),
    path('faq/', PublicFAQView.as_view(), name='public-faq'),
    path('faq/<uuid:faq_id>/helpful/', FAQHelpfulView.as_view(), name='faq-helpful'),

    # Admin endpoints
    path('admin/config/', AdminChatbotConfigView.as_view(), name='admin-chatbot-config'),
    path('admin/stats/', AdminChatStatsView.as_view(), name='admin-chatbot-stats'),

    # Admin ViewSet routes
    path('', include(router.urls)),
]
