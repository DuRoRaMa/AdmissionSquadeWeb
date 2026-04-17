// stores/squads.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/axios'
import { useUserStore } from './user'
import { useAuthStore } from './auth'

export const useSquadsStore = defineStore('squads', () => {
  const squads = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchSquads() {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/api/v1/squads/')

      if (response.data && Array.isArray(response.data.results)) {
        squads.value = response.data.results
      } else if (Array.isArray(response.data)) {
        squads.value = response.data
      } else {
        squads.value = []
      }
    } catch (err) {
      error.value = err.response?.data?.detail || 'Ошибка загрузки отрядов'
      squads.value = []
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  async function joinSquad(squadId, roleId = null) {
    const userStore = useUserStore()
    const authStore = useAuthStore()

    if (!userStore.user) {
      await userStore.fetchUser()
    }

    if (!userStore.user) {
      throw new Error('Пользователь не авторизован')
    }

    const activeMemberships = Array.isArray(userStore.user.memberships)
      ? userStore.user.memberships.filter((m) => m?.is_active === true)
      : []

    if (activeMemberships.length > 0) {
      throw new Error('Вы уже состоите в отряде. Нельзя вступить в несколько отрядов одновременно.')
    }

    const currentUserId = userStore.user.id ?? authStore.currentUserId

    if (!currentUserId) {
      throw new Error('Не удалось определить ID текущего пользователя.')
    }

    const payload = {
      user: currentUserId,
    }

    if (roleId) {
      payload.role = roleId
    }

    try {
      const response = await apiClient.post(`/api/v1/squads/${squadId}/members/`, payload)
      await userStore.fetchUser()
      return response.data
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Ошибка вступления'

      throw new Error(message)
    }
  }

  return {
    squads,
    isLoading,
    error,
    fetchSquads,
    joinSquad,
  }
})