from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, EmployeeViewSet, LeaveRequestViewSet, PayrollViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='departments')
router.register(r'employees',   EmployeeViewSet,   basename='employees')
router.register(r'leaves',      LeaveRequestViewSet, basename='leaves')
router.register(r'payrolls',    PayrollViewSet,    basename='payrolls')

urlpatterns = [
    path('', include(router.urls)),
]
