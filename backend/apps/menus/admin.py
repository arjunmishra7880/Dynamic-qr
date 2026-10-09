from django.contrib import admin
from .models import Menu, MenuCategory, MenuItem

class MenuItemInline(admin.TabularInline):
    model = MenuItem
    extra = 1

@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ('title', 'business', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'business__name')

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'menu', 'display_order', 'is_active')
    list_filter = ('is_active',)
    inlines = [MenuItemInline]

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_vegetarian', 'is_spicy', 'is_available')
    list_filter = ('is_vegetarian', 'is_spicy', 'is_available')
    search_fields = ('name', 'category__name')
