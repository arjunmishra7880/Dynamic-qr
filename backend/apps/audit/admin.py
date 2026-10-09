from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'card', 'business', 'timestamp')
    list_filter = ('action',)
    search_fields = ('action', 'user__username', 'card__card_id', 'business__name')
    readonly_fields = ('timestamp',)
