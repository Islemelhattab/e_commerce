from django.contrib import admin
from .models import Supplier, PurchaseOrder, PurchaseOrderLine, SupplierInvoice


class PurchaseOrderLineInline(admin.TabularInline):
    model = PurchaseOrderLine
    extra = 1
    readonly_fields = ['subtotal']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'email', 'status', 'rating', 'created_at']
    list_filter = ['status', 'currency']
    search_fields = ['name', 'code', 'email']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'supplier', 'status', 'total', 'expected_date', 'created_at']
    list_filter = ['status', 'currency']
    search_fields = ['po_number', 'supplier__name']
    inlines = [PurchaseOrderLineInline]
    readonly_fields = ['po_number', 'subtotal', 'tax_amount', 'total', 'created_at', 'updated_at']


@admin.register(SupplierInvoice)
class SupplierInvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'supplier', 'status', 'amount_ttc', 'due_date', 'paid_at']
    list_filter = ['status']
    search_fields = ['invoice_number', 'supplier__name']
