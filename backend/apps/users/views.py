from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.conf import settings
from rest_framework import serializers

User = get_user_model()


# ==================== SERIALIZERS ====================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'phone', 'cin', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Les mots de passe ne correspondent pas'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        token = get_random_string(64)
        user = User.objects.create_user(
            **validated_data,
            email_verification_token=token,
            is_email_verified=False
        )
        send_mail(
            'Vérification de votre compte ShopWave',
            f'Cliquez ici pour vérifier votre compte: {settings.FRONTEND_URL}/verify-email/{token}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField(source='get_full_name')
    avatar_url = serializers.SerializerMethodField()
    # FIX: expose groups as list of names so frontend can check ERP/supplier access
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'cin', 'first_name', 'last_name',
            'full_name', 'avatar', 'avatar_url', 'date_of_birth',
            'is_email_verified', 'is_phone_verified', 'date_joined',
            # FIX: added is_staff and groups so /admin and /erp routes work in the frontend
            'is_staff', 'groups',
        ]
        read_only_fields = ['id', 'email', 'is_email_verified', 'date_joined', 'is_staff', 'groups']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None

    def get_groups(self, obj):
        return list(obj.groups.values_list('name', flat=True))


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Les mots de passe ne correspondent pas'})
        return data


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.users.models import Address
        model = Address
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']


# ==================== VIEWS ====================
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Compte créé. Vérifiez votre email.',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': UserProfileSerializer(user, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.data.get('token')
    try:
        user = User.objects.get(email_verification_token=token)
        user.is_email_verified = True
        user.email_verification_token = None
        user.save()
        return Response({'message': 'Email vérifié avec succès'})
    except User.DoesNotExist:
        return Response({'error': 'Token invalide'}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        token = get_random_string(64)
        user.email_verification_token = token
        user.save()
        send_mail(
            'Réinitialisation de mot de passe - ShopWave',
            f'Lien de réinitialisation: {settings.FRONTEND_URL}/reset-password/{token}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )
    except User.DoesNotExist:
        pass
    return Response({'message': 'Si l\'email existe, un lien a été envoyé'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    try:
        user = User.objects.get(email_verification_token=token)
        user.set_password(new_password)
        user.email_verification_token = None
        user.save()
        return Response({'message': 'Mot de passe réinitialisé avec succès'})
    except User.DoesNotExist:
        return Response({'error': 'Token invalide'}, status=400)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Mot de passe incorrect'}, status=400)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Mot de passe changé avec succès'})


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    # FIX: disable pagination so the frontend receives a plain list, not {count, results:[]}
    pagination_class = None

    def get_queryset(self):
        from apps.users.models import Address
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        address = self.get_object()
        from apps.users.models import Address
        Address.objects.filter(user=request.user).update(is_default=False)
        address.is_default = True
        address.save()
        return Response({'message': 'Adresse par défaut mise à jour'})


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        from apps.users.models import Wishlist
        from apps.products.views import ProductListSerializer
        items = Wishlist.objects.filter(user=request.user).select_related('product')
        products = [item.product for item in items]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        from apps.users.models import Wishlist
        product_id = request.data.get('product_id')
        obj, created = Wishlist.objects.get_or_create(user=request.user, product_id=product_id)
        if not created:
            obj.delete()
            return Response({'in_wishlist': False, 'message': 'Retiré des favoris'})
        return Response({'in_wishlist': True, 'message': 'Ajouté aux favoris'})
