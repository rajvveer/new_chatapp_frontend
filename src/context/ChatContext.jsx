import { create } from 'zustand';
import api from '../utils/api';
import { toast } from 'react-toastify';

export const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  selectedConversation: null,
  messages: [],
  loading: false,
  typingUsers: {},
  replyingTo: null,

  // Actions
  setConversations: (conversations) => set({ conversations }),
  
  setSelectedConversation: (conversation) => set({ 
    selectedConversation: conversation,
    messages: [],
    replyingTo: null,
  }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg._id === messageId ? { ...msg, ...updates } : msg
    ),
  })),

  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((msg) => msg._id !== messageId),
  })),

  setReplyingTo: (message) => set({ replyingTo: message }),
  
  clearReply: () => set({ replyingTo: null }),

  setTyping: (conversationId, userId, isTyping) => set((state) => {
    const newTypingUsers = { ...state.typingUsers };
    
    if (isTyping) {
      if (!newTypingUsers[conversationId]) {
        newTypingUsers[conversationId] = [];
      }
      if (!newTypingUsers[conversationId].includes(userId)) {
        newTypingUsers[conversationId].push(userId);
      }
    } else {
      if (newTypingUsers[conversationId]) {
        newTypingUsers[conversationId] = newTypingUsers[conversationId].filter(
          (id) => id !== userId
        );
      }
    }
    
    return { typingUsers: newTypingUsers };
  }),

  // API Calls
  fetchConversations: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/conversations');
      set({ conversations: data.data, loading: false });
    } catch (error) {
      toast.error('Failed to fetch conversations');
      set({ loading: false });
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/messages/${conversationId}`);
      set({ messages: data.data, loading: false });
    } catch (error) {
      toast.error('Failed to fetch messages');
      set({ loading: false });
    }
  },

  sendMessage: async (conversationId, content, messageType = 'text', replyToId = null) => {
    try {
      const { data } = await api.post('/messages', {
        conversationId,
        content,
        messageType,
        replyTo: replyToId,
      });
      
      return data.data;
    } catch (error) {
      toast.error('Failed to send message');
      throw error;
    }
  },

  createConversation: async (userId) => {
    try {
      const { data } = await api.post('/conversations', { userId });
      set((state) => ({
        conversations: [data.data, ...state.conversations],
      }));
      return data.data;
    } catch (error) {
      toast.error('Failed to create conversation');
      throw error;
    }
  },

  markAsRead: async (conversationId) => {
    try {
      await api.put(`/messages/read/${conversationId}`);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  },
}));
