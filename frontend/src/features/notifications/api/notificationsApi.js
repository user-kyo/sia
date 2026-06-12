import api from '../../../lib/axios';

export const fetchNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

export const dismissNotification = async (id) => {
  const response = await api.put(`/notifications/${id}/dismiss`);
  return response.data;
};

export const dismissAllNotifications = async () => {
  const response = await api.put('/notifications/dismiss-all');
  return response.data;
};
