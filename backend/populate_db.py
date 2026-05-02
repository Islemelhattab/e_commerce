import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.products.models import Category, Product
from django.contrib.auth.hashers import make_password

def seed():
    print("Seeding database...")
    
    # Create superuser
    if not User.objects.filter(email='admin@ecommerce.local').exists():
        User.objects.create(
            email='admin@ecommerce.local',
            password=make_password('admin123'),
            is_staff=True,
            is_superuser=True,
            first_name='Admin',
            last_name='User'
        )
        print("Created superuser: admin@ecommerce.local / admin123")
        
    # Create client user
    if not User.objects.filter(email='client@ecommerce.local').exists():
        User.objects.create(
            email='client@ecommerce.local',
            password=make_password('client123'),
            is_staff=False,
            is_superuser=False,
            first_name='Client',
            last_name='User'
        )
        print("Created client user: client@ecommerce.local / client123")
    
    # Create Category
    cat, _ = Category.objects.get_or_create(
        slug="electronics",
        defaults={'name': 'Electronics', 'description': 'Electronic items and gadgets'}
    )
    
    import urllib.request
    from django.core.files.base import ContentFile
    
    CATEGORY_IMAGES = {
        'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
        'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
        'home': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',
        'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
        'beauty': 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800&q=80',
        'books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80',
    }

    PRODUCT_IMAGES = {
        'Smartphone X': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
        "Canapé d'angle moderne": 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
        'Adidas Ultraboost 23': 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80',
        'Nike Air Max 270 React': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        'Apple MacBook Pro 14" M3': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        'Samsung QLED 65" 4K Smart TV': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
        'Xiaomi Redmi Note 13 Pro': 'https://images.unsplash.com/photo-1598327105666-5b89351cb315?w=800&q=80',
        'iPhone 15 Pro Max': 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
        'Samsung Galaxy S24 Ultra': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
    }
    
    # Create Products
    for i, product_name in enumerate(PRODUCT_IMAGES.keys()):
        Product.objects.get_or_create(
            sku=f"PRD-{i:03d}",
            defaults={
                'name': product_name,
                'description': f'Description for {product_name}',
                'category': cat,
                'price': 100.00 + (i * 50),
                'stock': 50,
            }
        )

    try:
        from apps.products.models import ProductImage
        import random

        for category in Category.objects.all():
            img_url = CATEGORY_IMAGES.get(category.slug, 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80')
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                img_content = urllib.request.urlopen(req).read()
                category.image.save(f'cat_{category.slug}.jpg', ContentFile(img_content), save=True)
            except Exception as e:
                print(f"Failed category image {category.name}: {e}")

        for product in Product.objects.all():
            # Match product name or use generic fallback
            img_url = PRODUCT_IMAGES.get(product.name, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80')
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                img_content = urllib.request.urlopen(req).read()
                
                # Overwrite or create image
                img_obj = product.images.first()
                if not img_obj:
                    ProductImage.objects.create(
                        product=product,
                        is_primary=True,
                        image=ContentFile(img_content, name=f'prod_{product.id}.jpg'),
                        alt_text=product.name
                    )
                else:
                    img_obj.image.save(f'prod_{product.id}.jpg', ContentFile(img_content), save=True)
            except Exception as e:
                print(f"Failed product image {product.name}: {e}")
            
        print("Assigned semantic images to categories and products.")
    except Exception as e:
        print(f"Failed to assign semantic images: {e}")

    print("Database seeding completed.")

if __name__ == '__main__':
    seed()
