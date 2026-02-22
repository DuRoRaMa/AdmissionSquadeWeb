import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  async function login(credentials) {
    isLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      // Эмуляция проверки
      if (credentials.email === 'test@example.com' && credentials.password === '123456') {
        const fakeToken = 'fake-jwt-token-' + Date.now()
        const fakeUser = { id: 1, email: credentials.email, username: 'Test User' }
        setToken(fakeToken)
        user.value = fakeUser
        return { success: true, user: fakeUser }
      } else {
        return { success: false, message: 'Неверный email или пароль' }
      }
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
      await new Promise((resolve) => setTimeout(resolve, 500))
      const fakeToken = 'fake-jwt-token-' + Date.now()
      const fakeUser = {
        id: Date.now(),
        email: userData.email,
        username: userData.username,
        last_name: userData.last_name,
        first_name: userData.first_name,
        middle_name: userData.middle_name,
      }
      setToken(fakeToken)
      user.value = fakeUser
      return { success: true, user: fakeUser }
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
  }
})

export default useAuthStore
