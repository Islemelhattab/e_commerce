from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db.models import Sum, Count, Avg
from django.utils import timezone

# ==================== USERS ADMIN ====================
from apps.users.models import User, Address, Wishlist

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'get_full_name', 'phone', 'is_email_verified', 'is_active', 'date_joined', 'order_count']
    list_filter = ['is_active', 'is_staff', 'is_email_verified', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone', 'cin']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login', 'id']

    fieldsets = (
        ('Identifiants', {'fields': ('id', 'email', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'phone', 'cin', 'date_of_birth', 'avatar')}),
        ('Vérification', {'fields': ('is_email_verified', 'is_phone_verified', 'email_verification_token', 'phone_otp')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('date_joined', 'last_login')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    def order_count(self, obj):
        return obj.orders.count()
    order_count.short_description = 'Commandes'


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'city', 'type', 'is_default']
    list_filter = ['type', 'is_default', 'city']
    search_fields = ['full_name', 'user__email', 'city', 'address_line1']


# ==================== PRODUCTS ADMIN ====================
from apps.products.models import Product, Category, Brand, ProductImage, ProductVariant, ProductAttribute, Tag

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_primary', 'order']

class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    extra = 2
    fields = ['name', 'value']

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['name', 'sku', 'price', 'stock', 'is_active']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'brand', 'price', 'compare_price', 'stock', 'is_active', 'is_featured', 'average_rating', 'sales_count', 'created_at']
    list_filter = ['is_active', 'is_featured', 'is_new', 'category', 'brand', 'created_at']
    search_fields = ['name', 'sku', 'description']
    list_editable = ['price', 'stock', 'is_active', 'is_featured']
    readonly_fields = ['id', 'slug', 'average_rating', 'review_count', 'sales_count', 'view_count', 'created_at', 'updated_at']
    prepopulated_fields = {}
    inlines = [ProductImageInline, ProductAttributeInline, ProductVariantInline]
    filter_horizontal = ['tags']

    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'slug', 'description', 'short_description', 'category', 'brand', 'tags')
        }),
        ('Tarification', {
            'fields': ('price', 'compare_price', 'cost_price')
        }),
        ('Inventaire', {
            'fields': ('sku', 'barcode', 'stock', 'low_stock_threshold', 'weight')
        }),
        ('Statut', {
            'fields': ('is_active', 'is_featured', 'is_new')
        }),
        ('Statistiques', {
            'fields': ('average_rating', 'review_count', 'sales_count', 'view_count'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'brand')

    actions = ['make_active', 'make_inactive', 'make_featured']

    def make_active(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f'{queryset.count()} produits activés.')
    make_active.short_description = 'Activer les produits sélectionnés'

    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} produits désactivés.')
    make_inactive.short_description = 'Désactiver les produits sélectionnés'

    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f'{queryset.count()} produits mis en vedette.')
    make_featured.short_description = 'Mettre en vedette'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active', 'order', 'product_count']
    list_filter = ['is_active', 'parent']
    search_fields = ['name']
    list_editable = ['is_active', 'order']
    prepopulated_fields = {'slug': ('name',)}

    def product_count(self, obj):
        return obj.products.filter(is_active=True).count()
    product_count.short_description = 'Produits actifs'


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'product_count']
    list_filter = ['is_active']
    search_fields = ['name']
    list_editable = ['is_active']
    prepopulated_fields = {'slug': ('name',)}

    def product_count(self, obj):
        return obj.products.filter(is_active=True).count()
    product_count.short_description = 'Produits'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


# ==================== ORDERS ADMIN ====================
from apps.orders.models import Order, OrderItem, ReturnRequest, OrderStatusHistory

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'variant', 'product_name', 'price', 'quantity', 'total']
    can_delete = False

class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['status', 'comment', 'created_at', 'created_by']
    can_delete = False
    ordering = ['created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user_email', 'status', 'payment_method', 'payment_status', 'total', 'created_at']
    list_filter = ['status', 'payment_method', 'payment_status', 'created_at']
    search_fields = ['order_number', 'user__email', 'tracking_number']
    readonly_fields = ['id', 'order_number', 'user', 'created_at', 'updated_at', 'subtotal', 'total']
    list_editable = ['status']
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Commande', {'fields': ('id', 'order_number', 'user', 'status', 'notes')}),
        ('Paiement', {'fields': ('payment_method', 'payment_status', 'stripe_payment_intent')}),
        ('Adresse', {'fields': ('shipping_address', 'billing_address')}),
        ('Montants', {'fields': ('subtotal', 'shipping_cost', 'discount_amount', 'tax_amount', 'total')}),
        ('Livraison', {'fields': ('shipping_method', 'tracking_number', 'estimated_delivery', 'delivered_at')}),
        ('Annulation', {'fields': ('cancelled_at', 'cancellation_reason'), 'classes': ('collapse',)}),
        ('Dates', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def user_email(self, obj):
        return obj.user.email if obj.user else '—'
    user_email.short_description = 'Email client'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('items')

    actions = ['mark_confirmed', 'mark_processing', 'mark_shipped', 'mark_delivered']

    def _update_status(self, request, queryset, new_status, label):
        for order in queryset:
            order.status = new_status
            order.save(update_fields=['status'])
            OrderStatusHistory.objects.create(
                order=order, status=new_status,
                comment=f'Statut mis à jour via admin', created_by=request.user
            )
        self.message_user(request, f'{queryset.count()} commande(s) → {label}.')

    def mark_confirmed(self, request, queryset): self._update_status(request, queryset, 'confirmed', 'Confirmée')
    mark_confirmed.short_description = 'Marquer comme confirmée'

    def mark_processing(self, request, queryset): self._update_status(request, queryset, 'processing', 'En traitement')
    mark_processing.short_description = 'Marquer en traitement'

    def mark_shipped(self, request, queryset): self._update_status(request, queryset, 'shipped', 'Expédiée')
    mark_shipped.short_description = 'Marquer comme expédiée'

    def mark_delivered(self, request, queryset): self._update_status(request, queryset, 'delivered', 'Livrée')
    mark_delivered.short_description = 'Marquer comme livrée'


@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'reason', 'status', 'created_at']
    list_filter = ['status', 'reason', 'created_at']
    search_fields = ['order__order_number']
    list_editable = ['status']


# ==================== COUPONS ADMIN ====================
from apps.coupons.models import Coupon

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'usage_count', 'usage_limit', 'is_active', 'valid_from', 'valid_until', 'is_expired']
    list_filter = ['discount_type', 'is_active']
    search_fields = ['code', 'description']
    list_editable = ['is_active']
    filter_horizontal = ['applicable_products', 'applicable_categories']

    def is_expired(self, obj):
        from django.utils import timezone
        return obj.valid_until < timezone.now()
    is_expired.short_description = 'Expiré'
    is_expired.boolean = True


# ==================== SHIPPING ADMIN ====================
from apps.shipping.models import ShippingMethod

@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'estimated_days_min', 'estimated_days_max', 'free_shipping_threshold', 'is_active']
    list_editable = ['price', 'is_active']


# ==================== REVIEWS ADMIN ====================
from apps.reviews.models import Review, ReviewReport

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user_email', 'rating', 'title', 'is_approved', 'is_verified_purchase', 'created_at']
    list_filter = ['rating', 'is_approved', 'is_verified_purchase', 'created_at']
    search_fields = ['product__name', 'user__email', 'comment']
    list_editable = ['is_approved']
    readonly_fields = ['product', 'user', 'created_at']

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Client'

    actions = ['approve_reviews', 'reject_reviews']

    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, f'{queryset.count()} avis approuvés.')
    approve_reviews.short_description = 'Approuver'

    def reject_reviews(self, request, queryset):
        queryset.update(is_approved=False)
        self.message_user(request, f'{queryset.count()} avis rejetés.')
    reject_reviews.short_description = 'Rejeter'


# ==================== NOTIFICATIONS ADMIN ====================
from apps.notifications.models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['user__email', 'title', 'message']


# ==================== ADMIN SITE CUSTOMIZATION ====================
admin.site.site_header = 'ShopWave Administration'
admin.site.site_title = 'ShopWave Admin'
admin.site.index_title = 'Tableau de bord'
