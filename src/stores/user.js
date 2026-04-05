// stores/user.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../axios'
import { useAuthStore } from './auth'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoading = ref(false)

  // Загрузка профиля текущего пользователя
  async function fetchUser() {
    const authStore = useAuthStore()
    if (!authStore.token) return null

    isLoading.value = true
    try {
      const response = await apiClient.get('api/v1/users/me/')
      user.value = response.data
      return user.value
    } catch (error) {
      if (error.response?.status === 401) {
        // Если токен невалиден — выходим
        authStore.logout()
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Обновление данных пользователя (PATCH)
  async function updateUser(data) {
    isLoading.value = true
    try {
      const response = await apiClient.patch('api/v1/users/me/', data)
      user.value = response.data
      return response.data
    } catch (error) {
      console.error('Update user error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Очистка данных (при выходе)
  function clearUser() {
    user.value = null
  }

  return {
    user,
    isLoading,
    fetchUser,
    updateUser,
    clearUser,
  }
})
export default useUserStore