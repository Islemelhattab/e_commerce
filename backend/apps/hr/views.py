from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone

from .models import Department, Employee, LeaveRequest, Payroll
from .serializers import (
    DepartmentSerializer, EmployeeSerializer,
    LeaveRequestSerializer, PayrollSerializer, PayrollCreateSerializer,
)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.filter(is_active=True).prefetch_related('employees')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminUser]
    search_fields = ['name', 'code']


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('department').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['status', 'department', 'contract_type']
    search_fields = ['first_name', 'last_name', 'employee_id', 'email']

    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        employee = self.get_object()
        employee.status = 'terminated'
        employee.end_date = request.data.get('end_date', timezone.now().date())
        employee.save()
        return Response(EmployeeSerializer(employee).data)

    @action(detail=True, methods=['get'])
    def payroll_history(self, request, pk=None):
        employee = self.get_object()
        payrolls = employee.payrolls.all()
        return Response(PayrollSerializer(payrolls, many=True).data)

    @action(detail=True, methods=['get'])
    def leave_history(self, request, pk=None):
        employee = self.get_object()
        leaves = employee.leave_requests.all()
        return Response(LeaveRequestSerializer(leaves, many=True).data)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related('employee', 'reviewed_by').all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['status', 'leave_type', 'employee']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=400)
        leave.status = 'approved'
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=400)
        leave.status = 'rejected'
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)


class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.select_related('employee').all()
    permission_classes = [IsAdminUser]
    filterset_fields = ['status', 'employee', 'period_year', 'period_month']

    def get_serializer_class(self):
        if self.action == 'create':
            return PayrollCreateSerializer
        return PayrollSerializer

    def perform_create(self, serializer):
        payroll = serializer.save(base_salary=serializer.validated_data['employee'].base_salary)
        payroll.calculate()

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != 'draft':
            return Response({'error': 'Seules les fiches en brouillon peuvent être validées.'}, status=400)
        payroll.status = 'validated'
        payroll.save()
        return Response(PayrollSerializer(payroll).data)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != 'validated':
            return Response({'error': 'La fiche doit être validée avant paiement.'}, status=400)
        payroll.status = 'paid'
        payroll.paid_at = timezone.now().date()
        payroll.save()
        payroll.post_to_accounting()
        return Response(PayrollSerializer(payroll).data)

    @action(detail=False, methods=['post'])
    def generate_batch(self, request):
        """Génère les fiches de paie pour tous les employés actifs d'un mois."""
        month = request.data.get('month', timezone.now().month)
        year = request.data.get('year', timezone.now().year)
        employees = Employee.objects.filter(status='active')
        created, skipped = [], []

        for emp in employees:
            obj, was_created = Payroll.objects.get_or_create(
                employee=emp,
                period_month=month,
                period_year=year,
                defaults={
                    'base_salary': emp.base_salary,
                    'bonus': 0,
                    'allowances': 0,
                    'deductions': 0,
                }
            )
            if was_created:
                obj.calculate()
                created.append(str(emp))
            else:
                skipped.append(str(emp))

        return Response({
            'month': month, 'year': year,
            'created': created, 'skipped': skipped,
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Résumé de la masse salariale pour un mois donné."""
        month = request.query_params.get('month', timezone.now().month)
        year  = request.query_params.get('year', timezone.now().year)
        payrolls = Payroll.objects.filter(period_month=month, period_year=year)

        from django.db.models import Sum
        agg = payrolls.aggregate(
            total_gross=Sum('gross_salary'),
            total_cnss_employee=Sum('cnss_employee'),
            total_cnss_employer=Sum('cnss_employer'),
            total_irpp=Sum('irpp'),
            total_net=Sum('net_salary'),
        )
        agg['count'] = payrolls.count()
        agg['month'] = month
        agg['year'] = year
        return Response(agg)
