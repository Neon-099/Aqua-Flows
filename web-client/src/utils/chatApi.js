import { apiRequest } from './api';

export const listConversations = async (limit = 50, options = {}) => {
  const includeArchived =
    options?.archived === true || String(options?.archived || '').toLowerCase() === 'true';
  const query = includeArchived
    ? `/chat/conversations?limit=${limit}&archived=true`
    : `/chat/conversations?limit=${limit}`;
  const res = await apiRequest(query);
  return res?.data || [];
};

export const getMessages = async (conversationId, limit = 100) => {
  const res = await apiRequest(`/chat/conversations/${conversationId}/messages?limit=${limit}`);
  return res?.data?.messages || [];
};

export const sendMessage = async (conversationId, message) => {
  const res = await apiRequest(`/chat/conversations/${conversationId}/messages`, 'POST', { message });
  return res?.data;
};

export const markSeen = async (conversationId) => {
  const res = await apiRequest(`/chat/conversations/${conversationId}/seen`, 'POST');
  return res?.data;
};
