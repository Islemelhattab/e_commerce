from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum, Q
from django.utils import timezone

from .models import AccountingAccount, FiscalPeriod, JournalEntry, JournalEntryLine
from .serializers import (
    AccountingAccountSerializer, FiscalPeriodSerializer,
    JournalEntrySerializer, JournalEntryWriteSerializer,
)


class AccountingAccountViewSet(viewsets.ModelViewSet):
    queryset = AccountingAccount.objects.all()
    serializer_class = AccountingAccountSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['account_type', 'is_active']
    search_fields = ['code', 'name']


class FiscalPeriodViewSet(viewsets.ModelViewSet):
    queryset = FiscalPeriod.objects.all()
    serializer_class = FiscalPeriodSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        period = self.get_object()
        if period.status == 'closed':
            return Response({'error': 'Période déjà clôturée.'}, status=400)
        period.status = 'closed'
        period.closed_by = request.user
        period.closed_at = timezone.now()
        period.save()
        return Response(FiscalPeriodSerializer(period).data)


class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.prefetch_related('lines__account').all()
    permission_classes = [IsAdminUser]
    filterset_fields = ['source', 'status']
    search_fields = ['entry_number', 'description']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return JournalEntryWriteSerializer
        return JournalEntrySerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def post_entry(self, request, pk=None):
        """Valider une écriture comptable."""
        entry = self.get_object()
        if entry.status != 'draft':
            return Response({'error': 'Seules les écritures en brouillon peuvent être validées.'}, status=400)
        try:
            entry.post(user=request.user)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
        return Response(JournalEntrySerializer(entry).data)

    @action(detail=False, methods=['get'])
    def balance(self, request):
        """Balance générale : solde débit/crédit par compte."""
        accounts = AccountingAccount.objects.filter(is_active=True)
        result = []
        for acc in accounts:
            lines = JournalEntryLine.objects.filter(
                account=acc,
                entry__status='posted'
            )
            total_debit  = lines.aggregate(s=Sum('debit'))['s']  or Decimal('0')
            total_credit = lines.aggregate(s=Sum('credit'))['s'] or Decimal('0')
            solde = total_debit - total_credit
            result.append({
                'code':         acc.code,
                'name':         acc.name,
                'account_type': acc.account_type,
                'total_debit':  total_debit,
                'total_credit': total_credit,
                'solde':        solde,
            })
        return Response(result)

    @action(detail=False, methods=['get'])
    def income_statement(self, request):
        """Compte de résultat : Produits - Charges."""
        revenue_accounts = AccountingAccount.objects.filter(account_type='revenue', is_active=True)
        expense_accounts = AccountingAccount.objects.filter(account_type='expense', is_active=True)

        def account_balance(acc):
            lines = JournalEntryLine.objects.filter(account=acc, entry__status='posted')
            d = lines.aggregate(s=Sum('debit'))['s']  or Decimal('0')
            c = lines.aggregate(s=Sum('credit'))['s'] or Decimal('0')
            return c - d  # crédit dominant pour produits

        revenues = [{'code': a.code, 'name': a.name, 'amount': account_balance(a)} for a in revenue_accounts]
        expenses = [{'code': a.code, 'name': a.name, 'amount': account_balance(a)} for a in expense_accounts]

        total_revenue  = sum(r['amount'] for r in revenues)
        total_expenses = sum(e['amount'] for e in expenses)
        net_result     = total_revenue - total_expenses

        return Response({
            'revenues':       revenues,
            'expenses':       expenses,
            'total_revenue':  total_revenue,
            'total_expenses': total_expenses,
            'net_result':     net_result,
        })

    @action(detail=False, methods=['get'])
    def tva_declaration(self, request):
        """Déclaration TVA : TVA collectée - TVA déductible."""
        collected_acc  = AccountingAccount.objects.filter(code='445710').first()
        deductible_acc = AccountingAccount.objects.filter(code='445620').first()

        def balance(acc):
            if not acc:
                return Decimal('0')
            lines = JournalEntryLine.objects.filter(account=acc, entry__status='posted')
            c = lines.aggregate(s=Sum('credit'))['s'] or Decimal('0')
            d = lines.aggregate(s=Sum('debit'))['s']  or Decimal('0')
            return c - d

        tva_collected  = balance(collected_acc)
        tva_deductible = balance(deductible_acc)
        tva_due        = tva_collected - tva_deductible

        return Response({
            'tva_collected':  tva_collected,
            'tva_deductible': tva_deductible,
            'tva_due':        tva_due,
        })
