from django.contrib import admin
from .models import Business, BusinessUser

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'city', 'phone', 'status', 'created_at')
    list_filter = ('status', 'city', 'country')
    search_fields = ('name', 'slug', 'email', 'phone')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(BusinessUser)
class BusinessUserAdmin(admin.ModelAdmin):
    list_display = ('user', 'business', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'business__name')
