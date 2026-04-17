// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../axios'
import { useUserStore } from './user'

function decodeBase64Url(value) {
  if (!value) return null

  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return atob(padded)
  } catch {
    return null
  }
}

function parseJwt(tokenValue) {
  if (!tokenValue) return null

  const parts = tokenValue.split('.')
  if (parts.length < 2) return null

  const payload = decodeBase64Url(parts[1])
  if (!payload) return null

  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const tokenPayload = computed(() => parseJwt(token.value))
  const currentUserId = computed(() => {
    const payload = tokenPayload.value
    return payload?.user_id ?? payload?.userId ?? payload?.sub ?? null
  })

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

      const userStore = useUserStore()
      await userStore.fetchUser()

      return { success: true, user: userStore.user }
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Ошибка входа'

      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    token.value = null

    const userStore = useUserStore()
    userStore.clearUser()
  }

  async function register(userData) {
    isLoading.value = true
    try {
      const response = await apiClient.post('api/v1/users/register/', userData)
      return {
        success: true,
        message: response.data.message,
        user: response.data.data,
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

  async function forgotPassword() {
    return {
      success: false,
      message: 'Функция восстановления пароля пока не реализована',
    }
  }

  async function resetPassword() {
    return {
      success: false,
      message: 'Функция сброса пароля пока не реализована',
    }
  }

  return {
    token,
    isLoading,
    isAuthenticated,
    tokenPayload,
    currentUserId,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
  }
})

export default useAuthStore