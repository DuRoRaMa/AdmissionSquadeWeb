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

  function setToken(accessToken, refreshToken = undefined) {
    if (accessToken) {
      localStorage.setItem('token', accessToken)
      token.value = accessToken
    } else {
      localStorage.removeItem('token')
      token.value = null
    }

    if (refreshToken !== undefined) {
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      } else {
        localStorage.removeItem('refreshToken')
      }
    }
  }

  async function login(credentials) {
    isLoading.value = true

    try {
      const response = await apiClient.post(
        'api/v1/users/auth/token/',
        credentials,
      )

      setToken(
        response.data.access,
        response.data.refresh,
      )

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(
          error,
          'Неверный email или пароль.',
        ),
      }
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
  function getApiErrorMessage(
    error,
    fallbackMessage = 'Произошла ошибка',
    withFieldErrors = false,
  ) {
    const data = error.response?.data

    let message = fallbackMessage
    const fieldErrors = {}

    if (!data) {
      message = error.message || fallbackMessage

      return withFieldErrors
        ? { message, fieldErrors }
        : message
    }

    if (typeof data === 'string') {
      message = data

      return withFieldErrors
        ? { message, fieldErrors }
        : message
    }

    // Общие ошибки, не относящиеся к конкретному полю
    if (data.detail) {
      message = String(data.detail)
    } else if (data.message) {
      message = String(data.message)
    } else if (data.error) {
      message = String(data.error)
    } else if (data.non_field_errors) {
      message = Array.isArray(data.non_field_errors)
        ? data.non_field_errors.join(' ')
        : String(data.non_field_errors)
    }

    const generalErrorKeys = new Set([
      'detail',
      'message',
      'error',
      'non_field_errors',
    ])

    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.entries(data).forEach(([field, value]) => {
        if (generalErrorKeys.has(field)) {
          return
        }

        if (Array.isArray(value)) {
          fieldErrors[field] = value
            .map((item) => String(item))
            .join(' ')
          return
        }

        if (typeof value === 'string') {
          fieldErrors[field] = value
          return
        }

        if (value && typeof value === 'object') {
          fieldErrors[field] = Object.values(value)
            .flat()
            .map((item) => String(item))
            .join(' ')
        }
      })
    }

    // Если общей ошибки нет, но сервер вернул ошибки полей,
    // формируем резервное сообщение.
    if (
      message === fallbackMessage &&
      Object.keys(fieldErrors).length > 0
    ) {
      message = Object.values(fieldErrors).join(' ')
    }

    return withFieldErrors
      ? { message, fieldErrors }
      : message
  }
  async function startRegistration(userData) {
    isLoading.value = true

    try {
      const response = await apiClient.post(
        'api/v1/users/register/start/',
        userData,
      )

      return {
        success: true,
        message:
          response.data.message ||
          'Код подтверждения отправлен на почту',
        errors: {},
      }
    } catch (error) {
      const parsedError = getApiErrorMessage(
        error,
        'Не удалось проверить регистрационные данные',
        true,
      )

      return {
        success: false,
        message: parsedError.message,
        errors: parsedError.fieldErrors,
      }
    } finally {
      isLoading.value = false
    }
  }
  async function sendRegistrationEmailCode(email) {
    isLoading.value = true

    try {
      const response = await apiClient.post('api/v1/notifications/registration-code/', {
        email,
      })

      return {
        success: true,
        message: response.data.message || 'Код подтверждения отправлен на почту',
      }
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Не удалось отправить код подтверждения'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function register(userData) {
    isLoading.value = true

    try {
      const response = await apiClient.post(
        'api/v1/users/register/',
        userData,
      )

      return {
        success: true,
        message: response.data.message,
        user: response.data.data,
        errors: {},
      }
    } catch (error) {
      const parsedError = getApiErrorMessage(
        error,
        'Ошибка регистрации',
        true,
      )

      return {
        success: false,
        message: parsedError.message,
        errors: parsedError.fieldErrors,
      }
    } finally {
      isLoading.value = false
    }
  }

  async function forgotPassword(email) {
    isLoading.value = true

    try {
      const response = await apiClient.post('api/v1/users/password-reset/', {
        email,
      })

      return {
        success: true,
        message:
          response.data.message ||
          'Если пользователь с такой почтой существует, ссылка отправлена.',
      }
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Не удалось отправить ссылку восстановления'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function resetPassword(data) {
    isLoading.value = true

    try {
      const response = await apiClient.post(
        'api/v1/users/password-reset/confirm/',
        data
      )

      return {
        success: true,
        message: response.data.message || 'Пароль успешно изменен.',
      }
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Не удалось изменить пароль'),
      }
    } finally {
      isLoading.value = false
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
    setToken,
    sendRegistrationEmailCode,
    startRegistration
  }
})

export default useAuthStore