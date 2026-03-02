import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import apiClient from '../axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(accessToken, refreshToken = null) {
    if (accessToken) {
      localStorage.setItem('token', accessToken)
      token.value = accessToken
    } else {
      localStorage.removeItem('token')
      token.value = null
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      localStorage.removeItem('refreshToken')
    }
  }

  async function login(credentials) {
    isLoading.value = true
    try {
      const tokenResponse = await apiClient.post('api/v1/users/auth/token/', {
        email: credentials.email,
        password: credentials.password,
      })
      const { access, refresh } = tokenResponse.data
      setToken(access, refresh)
      const userResponse = await apiClient.get('api/v1/users/me/')
      user.value = userResponse.data
      return { success: true, user: user.value }
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'Ошибка входа'
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    setToken(null)
    user.value = null
  }

  async function register(userData) {
    isLoading.value = true
    try {
      const userResponse = apiClient.post('api/v1/users/register/', userData)
      return {
        success: true,
        message: (await userResponse).data.message || 'Регистрация успешна',
        user: (await userResponse).data,
      }
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Ошибка регистрации'
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  async function forgotPassword(email) {
    isLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true, message: 'Инструкция отправлена на почту' }
    } finally {
      isLoading.value = false
    }
  }

  async function resetPassword(data) {
    isLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true, message: 'Пароль изменён' }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return null
    isLoading.value = true
    try {
      const response = await apiClient.get('api/v1/users/me/')
      user.value = response.data
      return user.value
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    fetchUser,
  }
})

export default useAuthStore
