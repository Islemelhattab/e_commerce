from rest_framework import serializers
from .models import AccountingAccount, FiscalPeriod, JournalEntry, JournalEntryLine


class AccountingAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountingAccount
        fields = '__all__'
        read_only_fields = ['id']


class FiscalPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = FiscalPeriod
        fields = '__all__'
        read_only_fields = ['id', 'closed_by', 'closed_at']


class JournalEntryLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = JournalEntryLine
        fields = '__all__'
        read_only_fields = ['id']


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalEntryLineSerializer(many=True, read_only=True)
    is_balanced = serializers.SerializerMethodField()

    class Meta:
        model = JournalEntry
        fields = '__all__'
        read_only_fields = ['id', 'entry_number', 'posted_at', 'created_at']

    def get_is_balanced(self, obj):
        return obj.is_balanced()


class JournalEntryWriteSerializer(serializers.ModelSerializer):
    lines = JournalEntryLineSerializer(many=True)

    class Meta:
        model = JournalEntry
        fields = '__all__'
        read_only_fields = ['id', 'entry_number', 'posted_at', 'created_at']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        entry = JournalEntry.objects.create(**validated_data)
        for line_data in lines_data:
            JournalEntryLine.objects.create(entry=entry, **line_data)
        return entry
