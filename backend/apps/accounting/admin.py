from django.contrib import admin
from .models import AccountingAccount, FiscalPeriod, JournalEntry, JournalEntryLine


class JournalEntryLineInline(admin.TabularInline):
    model = JournalEntryLine
    extra = 2
    readonly_fields = ['id']


@admin.register(AccountingAccount)
class AccountingAccountAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'account_type', 'is_active']
    list_filter = ['account_type', 'is_active']
    search_fields = ['code', 'name']
    ordering = ['code']


@admin.register(FiscalPeriod)
class FiscalPeriodAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'status']
    list_filter = ['status']


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['entry_number', 'date', 'description', 'source', 'status', 'created_at']
    list_filter = ['source', 'status']
    search_fields = ['entry_number', 'description']
    inlines = [JournalEntryLineInline]
    readonly_fields = ['entry_number', 'posted_at', 'created_at']
