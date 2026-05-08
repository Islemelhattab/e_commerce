from django.contrib import admin
from .models import Department, Employee, LeaveRequest, Payroll


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'manager', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'first_name', 'last_name', 'department',
                    'job_title', 'contract_type', 'status', 'hire_date']
    list_filter = ['status', 'contract_type', 'department']
    search_fields = ['first_name', 'last_name', 'employee_id', 'email', 'cin']
    readonly_fields = ['employee_id', 'created_at', 'updated_at']


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'days', 'status']
    list_filter = ['status', 'leave_type']
    search_fields = ['employee__first_name', 'employee__last_name']
    readonly_fields = ['days', 'reviewed_at']


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ['employee', 'period_month', 'period_year',
                    'gross_salary', 'net_salary', 'status', 'paid_at']
    list_filter = ['status', 'period_year']
    search_fields = ['employee__first_name', 'employee__last_name']
    readonly_fields = ['gross_salary', 'cnss_employee', 'cnss_employer',
                       'irpp', 'net_salary', 'created_at', 'journal_entry']
