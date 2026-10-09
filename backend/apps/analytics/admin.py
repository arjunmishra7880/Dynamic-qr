from django.contrib import admin
from .models import ScanEvent

@admin.register(ScanEvent)
class ScanEventAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'business', 'card', 'device_type', 'timestamp', 'ip_address')
    list_filter = ('event_type', 'device_type')
    search_fields = ('business__name', 'card__card_id', 'destination')
    readonly_fields = ('timestamp',)
