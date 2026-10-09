from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'phone', 'is_staff', 'is_superuser', 'date_joined')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Platform Roles & Security', {
            'fields': ('role', 'phone', 'security_question', 'security_answer_hash')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Platform Roles & Security', {
            'fields': ('role', 'phone', 'security_question')
        }),
    )
