from django.contrib import admin
from .models import Card, ActivationSession, CardAssignment

@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('card_id', 'status', 'business', 'purpose', 'destination_type', 'destination_url')
    list_filter = ('status', 'destination_type')
    search_fields = ('card_id', 'public_token', 'purpose', 'business__name')
    readonly_fields = ('public_token', 'first_scanned_at', 'activated_at', 'qr_image')

@admin.register(ActivationSession)
class ActivationSessionAdmin(admin.ModelAdmin):
    list_display = ('card', 'session_token', 'status', 'expires_at', 'created_at')
    list_filter = ('status',)

@admin.register(CardAssignment)
class CardAssignmentAdmin(admin.ModelAdmin):
    list_display = ('card', 'business', 'assigned_by', 'assigned_at', 'unassigned_at')
    search_fields = ('card__card_id', 'business__name')
