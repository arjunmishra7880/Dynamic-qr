from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.authentication.models import User
from apps.businesses.models import Business, BusinessUser
from apps.cards.models import Card
from apps.cards.qr_utils import attach_qr_to_card
from apps.menus.models import Menu, MenuCategory, MenuItem
from apps.analytics.models import ScanEvent
from apps.audit.models import AuditLog

class Command(BaseCommand):
    help = 'Seeds initial demonstration data for Dynamic QR Platform'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding demo data...'))

        # 1. Super Admin User
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@dynamicqr.local',
                'role': User.ROLE_SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'security_question': 'What is your favorite city?',
            }
        )
        if created:
            admin.set_password('admin123')
            admin.set_security_answer('San Francisco')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Created Super Admin (admin / admin123)'))
        else:
            self.stdout.write('Super Admin already exists.')

        # 1b. Demo Admin User
        demo_admin, d_created = User.objects.get_or_create(
            username='demo_admin',
            defaults={
                'email': 'demo_admin@dynamicqr.local',
                'role': User.ROLE_SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'security_question': 'What is your favorite city?',
            }
        )
        if d_created:
            demo_admin.set_password('demo123')
            demo_admin.set_security_answer('San Francisco')
            demo_admin.save()
            self.stdout.write(self.style.SUCCESS('Created Demo Admin (demo_admin / demo123)'))

        # 2. Business Owner User
        owner, o_created = User.objects.get_or_create(
            username='artisan_owner',
            defaults={
                'email': 'owner@artisanroast.com',
                'role': User.ROLE_BUSINESS_OWNER,
                'security_question': 'What is your favorite city?',
            }
        )
        if o_created:
            owner.set_password('owner123')
            owner.set_security_answer('Seattle')
            owner.save()
            self.stdout.write(self.style.SUCCESS('Created Business Owner (artisan_owner / owner123)'))

        # 3. Demo Business
        business, b_created = Business.objects.get_or_create(
            slug='artisan-roast',
            defaults={
                'name': 'The Artisan Roast & Bakery',
                'description': 'Handcrafted specialty coffee, freshly baked sourdough pastries, and seasonal brunch.',
                'phone': '+1 (555) 234-5678',
                'email': 'hello@artisanroast.com',
                'website': 'https://example.com/artisan-roast',
                'address': '742 Market Street, Suite 100',
                'city': 'San Francisco',
                'state': 'CA',
                'country': 'USA',
                'google_review_url': 'https://g.page/r/artisan-roast/review',
                'opening_hours': {
                    'Monday - Friday': '07:00 AM - 06:00 PM',
                    'Saturday - Sunday': '08:00 AM - 07:00 PM'
                },
                'status': Business.STATUS_ACTIVE
            }
        )
        if b_created:
            self.stdout.write(self.style.SUCCESS('Created Business: The Artisan Roast & Bakery'))

        # Business user link
        BusinessUser.objects.get_or_create(
            business=business,
            user=owner,
            defaults={'role': BusinessUser.ROLE_OWNER}
        )

        # 4. Digital Menu
        menu, m_created = Menu.objects.get_or_create(
            business=business,
            defaults={
                'title': 'Signature Cafe & Brunch Menu',
                'description': 'Made fresh daily with sustainably sourced ingredients.',
                'is_active': True
            }
        )

        cat_coffee, _ = MenuCategory.objects.get_or_create(
            menu=menu,
            name='Specialty Coffee & Beverages',
            defaults={'display_order': 1}
        )
        cat_pastry, _ = MenuCategory.objects.get_or_create(
            menu=menu,
            name='Fresh Baked Goods',
            defaults={'display_order': 2}
        )
        cat_brunch, _ = MenuCategory.objects.get_or_create(
            menu=menu,
            name='Kitchen Specialties',
            defaults={'display_order': 3}
        )

        items = [
            (cat_coffee, 'Nitro Cold Brew', 'Steeped for 20 hours with organic single-origin beans.', 5.50, True, False),
            (cat_coffee, 'Vanilla Cardamom Latte', 'Double shot espresso with housemade spiced vanilla syrup.', 6.25, True, False),
            (cat_pastry, 'Almond Croissant', 'Twice-baked butter croissant with rich almond frangipane.', 4.75, True, False),
            (cat_pastry, 'Blueberry Lavender Scone', 'Warm crumbly scone glazed with culinary lavender drizzle.', 4.25, True, False),
            (cat_brunch, 'Avocado Toast & Poached Egg', 'Sourdough toast, heirloom tomatoes, microgreens, dukkah.', 12.50, True, True),
            (cat_brunch, 'Smoked Salmon Brioche', 'House-cured salmon, whipped dill cream cheese, capers.', 14.50, False, False),
        ]

        for cat, name, desc, price, is_veg, is_spicy in items:
            MenuItem.objects.get_or_create(
                category=cat,
                name=name,
                defaults={
                    'description': desc,
                    'price': price,
                    'is_vegetarian': is_veg,
                    'is_spicy': is_spicy,
                    'is_available': True
                }
            )

        # 5. Cards (including the A7K92X card from README)
        cards_data = [
            {
                'card_id': 'A7K92X',
                'public_token': 'pub_a7k92x_token_secure',
                'status': Card.STATUS_ACTIVE,
                'business': business,
                'purpose': 'Table 1 Dynamic Menu Card',
                'destination_type': Card.DEST_DIGITAL_MENU,
                'destination_url': 'http://localhost:3030/business/artisan-roast/menu',
            },
            {
                'card_id': 'B8M41P',
                'public_token': 'pub_b8m41p_token_secure',
                'status': Card.STATUS_ACTIVE,
                'business': business,
                'purpose': 'Counter NFC Google Review Puck',
                'destination_type': Card.DEST_REVIEW_PAGE,
                'destination_url': 'http://localhost:3030/business/artisan-roast/reviews',
            },
            {
                'card_id': 'C3X99Z',
                'public_token': 'pub_c3x99z_token_secure',
                'status': Card.STATUS_UNACTIVATED,
                'business': None,
                'purpose': 'Unallocated Warehouse Stock NFC Card',
                'destination_type': Card.DEST_EXTERNAL_URL,
                'destination_url': '',
            },
            {
                'card_id': 'D5Y12K',
                'public_token': 'pub_d5y12k_token_secure',
                'status': Card.STATUS_SUSPENDED,
                'business': business,
                'purpose': 'Outdoor Patio Stand #9 (Temporarily Suspended)',
                'destination_type': Card.DEST_BUSINESS_PROFILE,
                'destination_url': 'http://localhost:3030/business/artisan-roast',
            }
        ]

        for c_data in cards_data:
            c_id = c_data['card_id']
            card, created = Card.objects.get_or_create(
                card_id=c_id,
                defaults=c_data
            )
            if created:
                try:
                    attach_qr_to_card(card)
                    card.save()
                except Exception as ex:
                    self.stdout.write(f'QR attach notice for {c_id}: {ex}')
                self.stdout.write(self.style.SUCCESS(f'Created Card [{c_id}] ({card.status})'))

        # 6. Sample Scan Events for Analytics
        card_a = Card.objects.filter(card_id='A7K92X').first()
        if card_a and ScanEvent.objects.count() == 0:
            for i in range(12):
                ScanEvent.objects.create(
                    card=card_a,
                    business=business,
                    event_type=ScanEvent.EVENT_CARD_VISIT,
                    destination=card_a.destination_url,
                    user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Mobile/15E148',
                    ip_address='127.0.0.1',
                    device_type='MOBILE',
                    referrer='https://dynamic-qr.local'
                )
            self.stdout.write(self.style.SUCCESS('Generated sample scan telemetry.'))

        self.stdout.write(self.style.SUCCESS('Demo data seeding complete!'))
