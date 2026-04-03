from django.db import models
import uuid

class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
    order_item = models.ForeignKey('orders.OrderItem', on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    helpful_count = models.IntegerField(default=0)
    images = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reviews'
        unique_together = ('product', 'user')
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        product = self.product
        reviews = Review.objects.filter(product=product, is_approved=True)
        if reviews.exists():
            from django.db.models import Avg
            product.average_rating = reviews.aggregate(avg=Avg('rating'))['avg']
            product.review_count = reviews.count()
            product.save(update_fields=['average_rating', 'review_count'])

class ReviewReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='reports')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    reason = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'review_reports'
        unique_together = ('review', 'user')
