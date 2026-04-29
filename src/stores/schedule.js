import { defineStore } from 'pinia'
import { ref } from 'vue'

import apiClient from '@/axios'

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (typeof data?.message === 'string') {
    return data.message
  }

  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0]

    if (Array.isArray(firstValue) && firstValue.length) {
      return firstValue.join(' ')
    }

    if (typeof firstValue === 'string') {
      return firstValue
    }
  }

  return fallback
}

function getScheduleEditDataUrl(scheduleId) {
  return `/api/v1/rosters/schedules/${scheduleId}/edit-data/`
}

function getScheduleAssignmentsUrl(scheduleId) {
  return `/api/v1/rosters/schedules/${scheduleId}/assignments/`
}

function getScheduleNeedsUrl(scheduleId) {
  return `/api/v1/rosters/schedules/${scheduleId}/needs/`
}

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref([])
  const entries = ref([])
  const editData = ref(null)
  const isLoading = ref(false)
  const isGenerating = ref(false)
  const isPublishing = ref(false)
  const isDeleting = ref(false)
  const isSavingAssignments = ref(false)
  const isSavingNeeds = ref(false)

  async function fetchSchedules() {
    isLoading.value = true

    try {
      const response = await apiClient.get('/api/v1/rosters/schedules/')
      schedules.value = normalizeListResponse(response.data)

      return {
        success: true,
        data: schedules.value,
      }
    } catch (error) {
      schedules.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить графики'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createSchedule(payload) {
    isLoading.value = true

    try {
      const response = await apiClient.post('/api/v1/rosters/schedules/', payload)
      await fetchSchedules()

      return {
        success: true,
        data: response.data,
        message: 'Черновик графика создан',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось создать график'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function generateSchedule(scheduleId) {
    isGenerating.value = true

    try {
      const response = await apiClient.post(`/api/v1/rosters/schedules/${scheduleId}/generate/`)
      await fetchSchedules()

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'График сформирован',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось сгенерировать график'),
      }
    } finally {
      isGenerating.value = false
    }
  }

  async function publishSchedule(scheduleId) {
    isPublishing.value = true

    try {
      const response = await apiClient.post(`/api/v1/rosters/schedules/${scheduleId}/publish/`)
      await fetchSchedules()

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'График опубликован',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось опубликовать график'),
      }
    } finally {
      isPublishing.value = false
    }
  }

  async function deleteSchedule(scheduleId) {
    isDeleting.value = true

    try {
      await apiClient.delete(`/api/v1/rosters/schedules/${scheduleId}/`)
      await fetchSchedules()

      return {
        success: true,
        message: 'График удалён',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось удалить график'),
      }
    } finally {
      isDeleting.value = false
    }
  }

  async function fetchScheduleEntries(scheduleId) {
    isLoading.value = true

    try {
      const response = await apiClient.get(`/api/v1/rosters/schedules/${scheduleId}/entries/`)
      entries.value = normalizeListResponse(response.data)

      return {
        success: true,
        data: entries.value,
      }
    } catch (error) {
      entries.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить смены графика'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchScheduleEditData(scheduleId, date = '') {
    isLoading.value = true

    try {
      const response = await apiClient.get(getScheduleEditDataUrl(scheduleId), {
        params: date ? { date } : {},
      })

      editData.value = response.data

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      editData.value = null

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить данные редактирования графика'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function saveScheduleDayNeeds(scheduleId, payload) {
    isSavingNeeds.value = true

    try {
      const response = await apiClient.post(getScheduleNeedsUrl(scheduleId), payload)

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Потребности сохранены',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось сохранить потребности'),
      }
    } finally {
      isSavingNeeds.value = false
    }
  }

  async function saveScheduleDayAssignments(scheduleId, payload) {
    isSavingAssignments.value = true

    try {
      const response = await apiClient.post(getScheduleAssignmentsUrl(scheduleId), payload)

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Назначения сохранены',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось сохранить назначения'),
      }
    } finally {
      isSavingAssignments.value = false
    }
  }

  async function getScheduleById(scheduleId) {
    const localSchedule = schedules.value.find((item) => String(item.id) === String(scheduleId))

    if (localSchedule) {
      return {
        success: true,
        data: localSchedule,
      }
    }

    const result = await fetchSchedules()

    if (!result.success) {
      return result
    }

    const schedule = schedules.value.find((item) => String(item.id) === String(scheduleId))

    if (!schedule) {
      return {
        success: false,
        message: 'График не найден',
      }
    }

    return {
      success: true,
      data: schedule,
    }
  }

  return {
    schedules,
    entries,
    editData,
    isLoading,
    isGenerating,
    isPublishing,
    isDeleting,
    isSavingAssignments,
    isSavingNeeds,
    fetchSchedules,
    createSchedule,
    generateSchedule,
    publishSchedule,
    deleteSchedule,
    fetchScheduleEntries,
    fetchScheduleEditData,
    saveScheduleDayNeeds,
    saveScheduleDayAssignments,
    getScheduleById,
  }
})
