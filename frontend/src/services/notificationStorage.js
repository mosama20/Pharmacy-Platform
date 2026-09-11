// Local In-App & Browser Push Notification Manager
const NOTIFICATIONS_STORAGE_KEY = 'pharmacy_customer_notifications_v1';
const LEGACY_STORAGE_KEY = 'chefaa_customer_notifications_v1';

export const getStoredNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const pushCustomerNotification = (notif) => {
  try {
    const list = getStoredNotifications();
    const newEntry = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: notif.title,
      body: notif.body,
      type: notif.type || 'order', // order, prescription, promo, system
      orderId: notif.orderId,
      rxId: notif.rxId,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [newEntry, ...list].slice(0, 30); // keep last 30
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    // Also trigger native browser notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.body,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Native notification display failed:', err);
      }
    }

    // Dispatch event so NotificationBell updates in real-time across tabs/components
    window.dispatchEvent(new CustomEvent('pharmacy_new_notification', { detail: newEntry }));
    window.dispatchEvent(new CustomEvent('chefaa_new_notification', { detail: newEntry }));

    return newEntry;
  } catch (e) {
    console.error('Failed to store notification:', e);
  }
};

export const markAllNotificationsAsRead = () => {
  try {
    const list = getStoredNotifications().map((n) => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pharmacy_notifications_read'));
    window.dispatchEvent(new CustomEvent('chefaa_notifications_read'));
    return list;
  } catch (e) {
    return [];
  }
};

export const requestBrowserNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch (e) {
    return 'denied';
  }
};
