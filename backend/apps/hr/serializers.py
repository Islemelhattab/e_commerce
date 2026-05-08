from rest_framework import serializers
from .models import Department, Employee, LeaveRequest, Payroll


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ['id']

    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['id', 'employee_id', 'created_at', 'updated_at']
        extra_kwargs = {
            'cin': {'write_only': True},
            'bank_account': {'write_only': True},
            'cnss_number': {'write_only': True},
        }

    def get_full_name(self, obj):
        return obj.get_full_name()


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['id', 'days', 'status', 'reviewed_by', 'reviewed_at', 'created_at']


class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    period_label = serializers.SerializerMethodField()

    class Meta:
        model = Payroll
        fields = '__all__'
        read_only_fields = [
            'id', 'gross_salary', 'cnss_employee', 'cnss_employer',
            'irpp', 'net_salary', 'created_at', 'journal_entry'
        ]

    def get_period_label(self, obj):
        return f"{obj.period_month:02d}/{obj.period_year}"


class PayrollCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = ['employee', 'period_month', 'period_year', 'bonus', 'allowances', 'deductions']
