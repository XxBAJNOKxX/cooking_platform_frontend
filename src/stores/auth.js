import { defineStore } from 'pinia';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('auth_token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async register(userData) {
      const response = await api.post('/register', userData);
      this.setToken(response.data.access_token);
      this.user = response.data.user;
    },

    async login(credentials) {
      const response = await api.post('/login', credentials);
      this.setToken(response.data.access_token);
      this.user = response.data.user;
    },

    async logout() {
      try {
        await api.post('/logout');
      } catch (error) {
        console.error('Hiba kijelentkezéskor:', error);
      } finally {
        this.clearAuth();
      }
    },

    async fetchUser() {
      if (!this.token) return;

      try {
        const response = await api.get('/user');
        this.user = response.data.data;
      } catch (error) {
        this.clearAuth();
      }
    },

    setToken(token) {
      this.token = token;
      localStorage.setItem('auth_token', token);
    },

    clearAuth() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('auth_token');
    }
  }
});
