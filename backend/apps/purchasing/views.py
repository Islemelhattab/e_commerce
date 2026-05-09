from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from apps.permissions import IsPurchasingUser, IsSupplierUser  # FIX: was IsAdminUser

from .models import Supplier, PurchaseOrder, PurchaseOrderLine, SupplierInvoice
from .serializers import (
    SupplierSerializer, PurchaseOrderSerializer,
    PurchaseOrderWriteSerializer, SupplierInvoiceSerializer,
    PurchaseOrderLineSerializer,
)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsPurchasingUser]
    search_fields = ['name', 'code', 'email']
    filterset_fields = ['status', 'currency']


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier').prefetch_related('lines').all()
    permission_classes = [IsPurchasingUser]
    filterset_fields = ['status', 'supplier']
    search_fields = ['po_number', 'supplier__name']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PurchaseOrderWriteSerializer
        return PurchaseOrderSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        order = self.get_object()
        if order.status != 'draft':
            return Response({'error': 'Seul un bon en brouillon peut être envoyé.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = 'sent'
        order.save()
        return Response(PurchaseOrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.status != 'sent':
            return Response({'error': 'Le BC doit être en statut envoyé.'}, status=400)
        order.status = 'confirmed'
        order.expected_date = request.data.get('expected_date', order.expected_date)
        order.save()
        return Response(PurchaseOrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        order = self.get_object()
        if order.status not in ['confirmed', 'partial']:
            return Response({'error': 'Le BC doit être confirmé pour réception.'}, status=400)

        lines_data = request.data.get('lines', [])
        all_received = True

        for item in lines_data:
            try:
                line = order.lines.get(id=item['line_id'])
                qty = item.get('quantity_received', 0)
                line.quantity_received += qty
                line.save()
                product = line.product
                product.stock += int(qty)
                product.save()
                if line.quantity_received < line.quantity_ordered:
                    all_received = False
            except PurchaseOrderLine.DoesNotExist:
                continue

        order.status = 'received' if all_received else 'partial'
        order.received_date = timezone.now().date()
        order.save()
        return Response(PurchaseOrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status in ['received']:
            return Response({'error': 'Impossible d\'annuler un BC déjà reçu.'}, status=400)
        order.status = 'cancelled'
        order.save()
        return Response(PurchaseOrderSerializer(order).data)


class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.select_related('supplier', 'purchase_order').all()
    serializer_class = SupplierInvoiceSerializer
    permission_classes = [IsPurchasingUser]
    filterset_fields = ['status', 'supplier']

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status != 'pending':
            return Response({'error': 'Facture déjà traitée.'}, status=400)
        invoice.status = 'validated'
        invoice.save()
        return Response(SupplierInvoiceSerializer(invoice).data)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status != 'validated':
            return Response({'error': 'La facture doit être validée avant paiement.'}, status=400)
        invoice.status = 'paid'
        invoice.paid_at = timezone.now().date()
        invoice.save()
        return Response(SupplierInvoiceSerializer(invoice).data)


class SupplierPortalOrdersView(viewsets.ReadOnlyModelViewSet):
    """Vue réservée aux fournisseurs pour consulter leurs BCs."""
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsSupplierUser]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'supplier_profile'):
            return PurchaseOrder.objects.filter(supplier=user.supplier_profile)
        return PurchaseOrder.objects.none()


class SupplierPortalInvoiceView(viewsets.ModelViewSet):
    """Vue réservée aux fournisseurs pour soumettre leurs factures."""
    serializer_class = SupplierInvoiceSerializer
    permission_classes = [IsSupplierUser]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'supplier_profile'):
            return SupplierInvoice.objects.filter(supplier=user.supplier_profile)
        return SupplierInvoice.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'supplier_profile'):
            serializer.save(supplier=user.supplier_profile)
