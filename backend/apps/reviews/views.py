from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework import serializers
from django_filters.rest_framework import DjangoFilterBackend


# ==================== REVIEW SERIALIZERS ====================
class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        from apps.reviews.models import Review
        model = Review
        fields = ['id', 'product', 'user', 'user_name', 'rating', 'title', 'comment',
                  'is_verified_purchase', 'helpful_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'is_verified_purchase', 'helpful_count', 'created_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name[0]}." if obj.user else "Anonyme"

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product']

    def get_queryset(self):
        from apps.reviews.models import Review
        return Review.objects.filter(is_approved=True).select_related('user')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'report']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        if review.user != request.user and not request.user.is_staff:
            return Response({'error': 'Non autorisé'}, status=403)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def report(self, request, pk=None):
        from apps.reviews.models import ReviewReport
        review = self.get_object()
        ReviewReport.objects.get_or_create(
            review=review, user=request.user,
            defaults={'reason': request.data.get('reason', 'Inappropriate')}
        )
        return Response({'message': 'Signalement enregistré'})

    @action(detail=True, methods=['post'])
    def helpful(self, request, pk=None):
        review = self.get_object()
        review.helpful_count += 1
        review.save(update_fields=['helpful_count'])
        return Response({'helpful_count': review.helpful_count})


# ==================== NOTIFICATION SERIALIZERS ====================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.notifications.models import Notification
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'data', 'is_read', 'created_at']
        read_only_fields = ['id', 'type', 'title', 'message', 'data', 'created_at']


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from apps.notifications.models import Notification
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'message': 'Marqué comme lu'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'message': 'Toutes les notifications marquées comme lues'})


# ==================== SHIPPING VIEWS ====================
class ShippingMethodSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.shipping.models import ShippingMethod
        model = ShippingMethod
        fields = ['id', 'name', 'description', 'price', 'estimated_days_min', 'estimated_days_max', 'free_shipping_threshold']


from rest_framework.generics import ListAPIView

class ShippingMethodListView(ListAPIView):
    serializer_class = ShippingMethodSerializer
    pagination_class = None  # FIX: return plain list, not {count, results:[]}

    def get_queryset(self):
        from apps.shipping.models import ShippingMethod
        return ShippingMethod.objects.filter(is_active=True)
