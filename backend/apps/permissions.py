"""
apps/permissions.py
Custom DRF permission classes for ERP role-based access control.

Group names must match exactly what is created in Django admin / create_erp_groups command:
  - 'Responsable RH'
  - 'Comptable'
  - 'Fournisseur'

is_staff users always have access to everything.
"""
from rest_framework.permissions import BasePermission


def _in_group(user, *group_names):
    """Return True if user is staff OR belongs to any of the given groups."""
    if not user or not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    return user.groups.filter(name__in=group_names).exists()


class IsErpUser(BasePermission):
    """
    Staff  OR  Comptable  OR  Responsable RH.
    Covers ERP dashboard + purchasing + accounting + HR overview.
    """
    message = "Accès réservé aux utilisateurs ERP."

    def has_permission(self, request, view):
        return _in_group(request.user, 'Comptable', 'Responsable RH')


class IsHRUser(BasePermission):
    """
    Staff  OR  Responsable RH.
    Covers employees, leaves, payroll.
    """
    message = "Accès réservé au responsable RH."

    def has_permission(self, request, view):
        return _in_group(request.user, 'Responsable RH')


class IsAccountingUser(BasePermission):
    """
    Staff  OR  Comptable.
    Covers accounting accounts, fiscal periods, journal entries.
    """
    message = "Accès réservé aux comptables."

    def has_permission(self, request, view):
        return _in_group(request.user, 'Comptable')


class IsSupplierUser(BasePermission):
    """
    Staff  OR  Fournisseur.
    Covers supplier portal (read their own orders, submit invoices).
    """
    message = "Accès réservé aux fournisseurs."

    def has_permission(self, request, view):
        return _in_group(request.user, 'Fournisseur')


class IsPurchasingUser(BasePermission):
    """
    Staff  OR  Comptable (can manage purchase orders and invoices).
    """
    message = "Accès réservé aux utilisateurs achats."

    def has_permission(self, request, view):
        return _in_group(request.user, 'Comptable', 'Responsable RH')
