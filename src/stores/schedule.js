import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/axios'

export const useScheduleStore = defineStore('schedule', () => {
  const myEntries = ref([])
  const myRequests = ref([])
  const adminRequests = ref([])
  const schedules = ref([])
  const isLoading = ref(false)

  async function fetchMySchedule() {
    isLoading.value = true
    try {
      const response = await apiClient.get('/api/v1/rosters/my-schedule/')
      myEntries.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось загрузить мой график'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSchedules() {
    isLoading.value = true
    try {
      const response = await apiClient.get('/api/v1/rosters/schedules/')
      schedules.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось загрузить графики'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createSchedule(payload) {
    isLoading.value = true
    try {
      const response = await apiClient.post('/api/v1/rosters/schedules/', payload)
      return { success: true, data: response.data, message: 'График создан' }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось создать график'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function generateSchedule(scheduleId) {
    try {
      const response = await apiClient.post(`/api/v1/rosters/schedules/${scheduleId}/generate/`)
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось сгенерировать график'
      }
    }
  }

  async function publishSchedule(scheduleId) {
    try {
      const response = await apiClient.post(`/api/v1/rosters/schedules/${scheduleId}/publish/`)
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось опубликовать график'
      }
    }
  }

  async function fetchMyRequests() {
    isLoading.value = true
    try {
      const response = await apiClient.get('/api/v1/rosters/my-change-requests/')
      myRequests.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось загрузить мои заявки'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAdminRequests() {
    isLoading.value = true
    try {
      const response = await apiClient.get('/api/v1/rosters/change-requests/')
      adminRequests.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось загрузить заявки'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createChangeRequest(payload) {
    try {
      const response = await apiClient.post('/api/v1/rosters/change-requests/create/', payload)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось создать заявку'
      }
    }
  }

  async function approveChangeRequest(id) {
    try {
      const response = await apiClient.post(`/api/v1/rosters/change-requests/${id}/approve/`)
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось одобрить заявку'
      }
    }
  }

  async function rejectChangeRequest(id, reviewComment = '') {
    try {
      const response = await apiClient.post(`/api/v1/rosters/change-requests/${id}/reject/`, {
        review_comment: reviewComment
      })
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось отклонить заявку'
      }
    }
  }

  async function createQr(entryId) {
    try {
      const response = await apiClient.post(`/api/v1/rosters/entries/${entryId}/qr/`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось получить QR-код'
      }
    }
  }

  async function scanQr(token) {
    try {
      const response = await apiClient.post('/api/v1/rosters/scan-qr/', { token })
      return { success: true, data: response.data, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось обработать QR'
      }
    }
  }

  const nearestEntry = computed(() => {
    if (!myEntries.value.length) return null

    const sorted = [...myEntries.value].sort((a, b) => {
      const aDate = new Date(`${a.date}T${a.starts_at}`)
      const bDate = new Date(`${b.date}T${b.starts_at}`)
      return aDate - bDate
    })

    return sorted[0] || null
  })

  return {
    myEntries,
    myRequests,
    adminRequests,
    schedules,
    isLoading,
    nearestEntry,
    fetchMySchedule,
    fetchSchedules,
    createSchedule,
    generateSchedule,
    publishSchedule,
    fetchMyRequests,
    fetchAdminRequests,
    createChangeRequest,
    approveChangeRequest,
    rejectChangeRequest,
    createQr,
    scanQr
  }
})