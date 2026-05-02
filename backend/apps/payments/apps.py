from django.apps import AppConfig
class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.payments' # Doit être identique à ce qu'il y a dans settings.py