import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications."""

    async def connect(self):
        self.user = None
        # Authenticate via token in query string
        token = self._get_token_from_query()
        if token:
            self.user = await self._get_user_from_token(token)

        if not self.user:
            await self.close()
            return

        self.group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(json.dumps({
            'type': 'connected',
            'message': 'Connexion WebSocket établie'
        }))

    async def disconnect(self, close_code):
        if self.user:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Handle messages from client (e.g., mark notification read)."""
        try:
            data = json.loads(text_data)
            if data.get('type') == 'mark_read':
                notif_id = data.get('notification_id')
                await self._mark_notification_read(notif_id)
                await self.send(json.dumps({'type': 'notification_marked_read', 'id': notif_id}))
        except json.JSONDecodeError:
            pass

    async def notification_message(self, event):
        """Send notification to WebSocket client."""
        await self.send(json.dumps({
            'type': 'notification',
            'data': event['data']
        }))

    async def order_update(self, event):
        """Send order status update to client."""
        await self.send(json.dumps({
            'type': 'order_update',
            'data': event['data']
        }))

    def _get_token_from_query(self):
        query_string = self.scope.get('query_string', b'').decode()
        for part in query_string.split('&'):
            if part.startswith('token='):
                return part[6:]
        return None

    @database_sync_to_async
    def _get_user_from_token(self, token):
        try:
            UntypedToken(token)
            from rest_framework_simplejwt.backends import TokenBackend
            decoded = TokenBackend(algorithm='HS256', signing_key=settings.SECRET_KEY).decode(token, verify=True)
            user_id = decoded.get('user_id')
            return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist, Exception):
            return None

    @database_sync_to_async
    def _mark_notification_read(self, notif_id):
        from apps.notifications.models import Notification
        try:
            Notification.objects.filter(id=notif_id, user=self.user).update(is_read=True)
        except Exception:
            pass


# ==================== HELPER FUNCTION ====================
async def send_notification_to_user(user_id, notification_data):
    """Send a notification to a specific user via WebSocket."""
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    if channel_layer:
        await channel_layer.group_send(
            f"user_{user_id}",
            {
                'type': 'notification_message',
                'data': notification_data
            }
        )


async def send_order_update_to_user(user_id, order_data):
    """Send order status update to a specific user via WebSocket."""
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    if channel_layer:
        await channel_layer.group_send(
            f"user_{user_id}",
            {
                'type': 'order_update',
                'data': order_data
            }
        )
