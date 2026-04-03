from django.db import models
import uuid

class Notification(models.Model):
    TYPES = [
        ('order_confirmed', 'Commande confirmée'),
        ('order_shipped', 'Commande expédiée'),
        ('order_delivered', 'Commande livrée'),
        ('order_cancelled', 'Commande annulée'),
        ('promo', 'Promotion'),
        ('return_update', 'Mise à jour retour'),
        ('price_drop', 'Baisse de prix'),
        ('back_in_stock', 'Retour en stock'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
