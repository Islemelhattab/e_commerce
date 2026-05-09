from django.db import migrations
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wishlist',
            name='product',
            field=django.db.models.fields.related.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='wishlist_items',
                to='products.product',
            ),
        ),
    ]
