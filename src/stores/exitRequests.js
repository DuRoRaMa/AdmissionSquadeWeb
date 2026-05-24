// stores/exitRequests.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
// import apiClient from '@/axios' // раскомментировать, когда бэкенд готов

export const useExitRequestsStore = defineStore('exitRequests', () => {
  const isLoading = ref(false)

  // Создать заявку на выход из отряда
  async function createExitRequest(membershipId, reason) {
    isLoading.value = true
    try {
      // TODO: заменить на реальный API-вызов, когда бэкенд будет готов
      console.log('Заявка на выход:', { membershipId, reason })
      // const response = await apiClient.post(`/api/v1/squads/members/${membershipId}/exit-requests/`, { reason })
      // return response.data

      // Имитация успешного ответа
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, message: 'Заявка на выход отправлена командиру отряда' }
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Ошибка отправки заявки')
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, createExitRequest }
})