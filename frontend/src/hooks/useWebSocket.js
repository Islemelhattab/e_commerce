import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../services/store';
import toast from 'react-hot-toast';

const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export function useWebSocket() {
  const { isAuthenticated } = useAuthStore();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT = 5;

  const connect = useCallback(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      console.log('[WS] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] Disconnected:', event.code);
      if (event.code !== 1000 && reconnectAttempts.current < MAX_RECONNECT) {
        reconnectAttempts.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
  }, [isAuthenticated]);

  const handleMessage = (data) => {
    switch (data.type) {
      case 'notification':
        showNotificationToast(data.data);
        // Update notification store/query cache if needed
        break;
      case 'order_update':
        showOrderUpdateToast(data.data);
        break;
      case 'connected':
        break;
      default:
        console.log('[WS] Unknown message type:', data.type);
    }
  };

  const showNotificationToast = (notif) => {
    const icons = {
      order_confirmed: '✓',
      order_shipped: '→',
      order_delivered: '✓',
      promo: '★',
    };
    toast(notif.message, {
      duration: 5000,
      style: {
        background: 'var(--color-primary)',
        color: 'white',
        fontFamily: 'DM Sans, sans-serif',
      },
    });
  };

  const showOrderUpdateToast = (order) => {
    toast.success(`Commande #${order.order_number}: ${order.status_display}`, {
      duration: 5000,
    });
  };

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const markNotificationRead = useCallback((notificationId) => {
    sendMessage({ type: 'mark_read', notification_id: notificationId });
  }, [sendMessage]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [isAuthenticated, connect]);

  return { sendMessage, markNotificationRead };
}

export default useWebSocket;
