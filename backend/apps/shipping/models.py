from django.db import models
import uuid

class ShippingMethod(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=500, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=3)
    estimated_days_min = models.IntegerField(default=1)
    estimated_days_max = models.IntegerField(default=3)
    is_active = models.BooleanField(default=True)
    free_shipping_threshold = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)

    class Meta:
        db_table = 'shipping_methods'

    def __str__(self):
        return self.name
