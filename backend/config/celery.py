import os
from celery import Celery
from celery.utils.log import get_task_logger

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('shopwave')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

logger = get_task_logger(__name__)


# ==================== EMAIL TASKS ====================
@app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_email(self, order_id):
    """Send order confirmation email to customer."""
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        from apps.orders.models import Order

        order = Order.objects.select_related('user').prefetch_related('items').get(id=order_id)
        items_text = '\n'.join([
            f"  - {item.product_name} x{item.quantity} = {item.total} DT"
            for item in order.items.all()
        ])

        message = f"""
Bonjour {order.user.first_name},

Votre commande #{order.order_number} a été confirmée.

Articles commandés:
{items_text}

Total: {order.total} DT
Mode de paiement: {order.get_payment_method_display()}

Adresse de livraison:
{order.shipping_address.get('full_name')}
{order.shipping_address.get('address_line1')}
{order.shipping_address.get('city')}, {order.shipping_address.get('state')}

Merci pour votre commande !

L'équipe ShopWave
        """

        send_mail(
            subject=f'Confirmation de commande #{order.order_number} - ShopWave',
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=False,
        )
        logger.info(f"Confirmation email sent for order {order.order_number}")
    except Exception as exc:
        logger.error(f"Failed to send confirmation email for order {order_id}: {exc}")
        raise self.retry(exc=exc)


@app.task(bind=True, max_retries=3)
def send_shipping_notification_email(self, order_id):
    """Send shipping notification with tracking info."""
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        from apps.orders.models import Order

        order = Order.objects.select_related('user').get(id=order_id)
        message = f"""
Bonjour {order.user.first_name},

Votre commande #{order.order_number} a été expédiée !

Numéro de suivi: {order.tracking_number or 'À venir'}
Livraison estimée: {order.estimated_delivery.strftime('%d/%m/%Y') if order.estimated_delivery else 'Sous 2-3 jours ouvrables'}

Suivez votre commande: {settings.FRONTEND_URL}/account/orders/{order.id}

Merci pour votre confiance !

L'équipe ShopWave
        """

        send_mail(
            subject=f'Votre commande #{order.order_number} est en route !',
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@app.task(bind=True, max_retries=3)
def send_welcome_email(self, user_id):
    """Send welcome email to new user."""
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        from django.contrib.auth import get_user_model

        User = get_user_model()
        user = User.objects.get(id=user_id)

        send_mail(
            subject='Bienvenue sur ShopWave !',
            message=f"""
Bonjour {user.first_name},

Bienvenue sur ShopWave ! Votre compte a été créé avec succès.

Commencez à découvrir nos milliers de produits sur {settings.FRONTEND_URL}

À bientôt,
L'équipe ShopWave
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception as exc:
        raise self.retry(exc=exc)


# ==================== NOTIFICATION TASKS ====================
@app.task
def create_order_notification(order_id, notif_type, title, message):
    """Create a notification and push via WebSocket."""
    try:
        from apps.orders.models import Order
        from apps.notifications.models import Notification
        import asyncio

        order = Order.objects.select_related('user').get(id=order_id)
        notif = Notification.objects.create(
            user=order.user,
            type=notif_type,
            title=title,
            message=message,
            data={'order_id': str(order.id), 'order_number': order.order_number}
        )

        # Push via WebSocket
        from apps.consumers import send_notification_to_user
        asyncio.run(send_notification_to_user(
            str(order.user.id),
            {
                'id': str(notif.id),
                'type': notif.type,
                'title': notif.title,
                'message': notif.message,
                'data': notif.data,
                'created_at': notif.created_at.isoformat(),
            }
        ))
    except Exception as e:
        logger.error(f"Error creating notification for order {order_id}: {e}")


@app.task
def update_product_ratings():
    """Recalculate all product ratings (run periodically)."""
    from apps.products.models import Product
    from apps.reviews.models import Review
    from django.db.models import Avg, Count

    products = Product.objects.filter(is_active=True)
    updated = 0
    for product in products:
        stats = Review.objects.filter(product=product, is_approved=True).aggregate(
            avg=Avg('rating'), count=Count('id')
        )
        if stats['avg'] is not None:
            product.average_rating = round(stats['avg'], 2)
            product.review_count = stats['count']
            product.save(update_fields=['average_rating', 'review_count'])
            updated += 1
    logger.info(f"Updated ratings for {updated} products")


@app.task
def cleanup_expired_coupons():
    """Deactivate expired coupons."""
    from apps.coupons.models import Coupon
    from django.utils import timezone

    expired = Coupon.objects.filter(
        is_active=True,
        valid_until__lt=timezone.now()
    )
    count = expired.count()
    expired.update(is_active=False)
    logger.info(f"Deactivated {count} expired coupons")


@app.task
def send_low_stock_alerts():
    """Alert admin when products are low on stock."""
    from apps.products.models import Product
    from django.core.mail import send_mail
    from django.conf import settings

    low_stock = Product.objects.filter(
        is_active=True,
        stock__lte=5,
        stock__gt=0
    )
    if low_stock.exists():
        items = '\n'.join([f"  - {p.name}: {p.stock} restant(s)" for p in low_stock])
        send_mail(
            subject='[ShopWave] Alerte stock bas',
            message=f"Les produits suivants sont en stock bas:\n\n{items}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],
        )


# ==================== CELERY BEAT SCHEDULE ====================
from celery.schedules import crontab

app.conf.beat_schedule = {
    'update-product-ratings-daily': {
        'task': 'config.celery.update_product_ratings',
        'schedule': crontab(hour=2, minute=0),
    },
    'cleanup-expired-coupons-daily': {
        'task': 'config.celery.cleanup_expired_coupons',
        'schedule': crontab(hour=3, minute=0),
    },
    'low-stock-alerts-daily': {
        'task': 'config.celery.send_low_stock_alerts',
        'schedule': crontab(hour=8, minute=0),
    },
}
