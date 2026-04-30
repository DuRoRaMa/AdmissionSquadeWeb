import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import apiClient from '@/axios'

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  if (Array.isArray(data?.entries)) {
    return data.entries
  }

  if (Array.isArray(data?.items)) {
    return data.items
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

function getEntryDateTime(entry) {
  const date = entry?.date

  if (!date) {
    return null
  }

  const time = entry.starts_at || entry.start_time || '00:00'
  const value = new Date(`${date}T${time}`)

  if (Number.isNaN(value.getTime())) {
    return null
  }

  return value
}

function getFileNameFromDisposition(disposition, fallback) {
  if (!disposition) {
    return fallback
  }

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1])
  }

  const defaultMatch = disposition.match(/filename="?([^"]+)"?/i)
  if (defaultMatch?.[1]) {
    return defaultMatch[1]
  }

  return fallback
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref([])
  const entries = ref([])
  const editData = ref(null)

  const myEntries = ref([])
  const myRequests = ref([])
  const adminRequests = ref([])

  const isLoading = ref(false)
  const isGenerating = ref(false)
  const isPublishing = ref(false)
  const isDeleting = ref(false)
  const isSavingAssignments = ref(false)
  const isSavingNeeds = ref(false)
  const isCreatingRequest = ref(false)
  const isProcessingRequest = ref(false)
  const isQrLoading = ref(false)

  const nearestEntry = computed(() => {
    if (!Array.isArray(myEntries.value) || !myEntries.value.length) {
      return null
    }

    const now = new Date()

    const upcomingEntries = myEntries.value
      .map((entry) => ({
        entry,
        dateTime: getEntryDateTime(entry),
      }))
      .filter((item) => item.dateTime && item.dateTime >= now)
      .sort((first, second) => first.dateTime - second.dateTime)

    return upcomingEntries[0]?.entry || null
  })

  async function fetchMySchedule() {
    isLoading.value = true

    try {
      const response = await apiClient.get('/api/v1/rosters/my-schedule/')

      myEntries.value = normalizeListResponse(response.data)

      return {
        success: true,
        data: myEntries.value,
      }
    } catch (error) {
      myEntries.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить мой график'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMyRequests() {
    isLoading.value = true

    try {
      const response = await apiClient.get('/api/v1/rosters/my-change-requests/')

      myRequests.value = normalizeListResponse(response.data)

      return {
        success: true,
        data: myRequests.value,
      }
    } catch (error) {
      myRequests.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить мои заявки'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAdminRequests() {
    isLoading.value = true

    try {
      const response = await apiClient.get('/api/v1/rosters/change-requests/')

      adminRequests.value = normalizeListResponse(response.data)

      return {
        success: true,
        data: adminRequests.value,
      }
    } catch (error) {
      adminRequests.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить заявки на изменение графика'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createChangeRequest(payload) {
    isCreatingRequest.value = true

    try {
      const response = await apiClient.post('/api/v1/rosters/change-requests/create/', payload)

      await fetchMyRequests()

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Заявка на изменение графика отправлена',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось отправить заявку'),
      }
    } finally {
      isCreatingRequest.value = false
    }
  }

  async function approveChangeRequest(requestId, payload = {}) {
    isProcessingRequest.value = true

    try {
      const response = await apiClient.post(
        `/api/v1/rosters/change-requests/${requestId}/approve/`,
        payload,
      )

      await fetchAdminRequests()

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Заявка одобрена',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось одобрить заявку'),
      }
    } finally {
      isProcessingRequest.value = false
    }
  }

  async function rejectChangeRequest(requestId, payload = {}) {
    isProcessingRequest.value = true

    try {
      const response = await apiClient.post(
        `/api/v1/rosters/change-requests/${requestId}/reject/`,
        payload,
      )

      await fetchAdminRequests()

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Заявка отклонена',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось отклонить заявку'),
      }
    } finally {
      isProcessingRequest.value = false
    }
  }

  async function createQr(entryId) {
    isQrLoading.value = true

    try {
      const response = await apiClient.post(`/api/v1/rosters/entries/${entryId}/qr/`)

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'QR-код создан',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось создать QR-код'),
      }
    } finally {
      isQrLoading.value = false
    }
  }

  async function scanQr(payload) {
    isQrLoading.value = true

    try {
      const response = await apiClient.post('/api/v1/rosters/scan-qr/', payload)

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Посещение отмечено',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось отметить посещение'),
      }
    } finally {
      isQrLoading.value = false
    }
  }

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
      await fetchMySchedule()

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

  async function exportSchedule(scheduleId) {
    isLoading.value = true

    try {
      const response = await apiClient.get(`/api/v1/rosters/schedules/${scheduleId}/export/`, {
        responseType: 'blob',
      })

      const filename = getFileNameFromDisposition(
        response.headers?.['content-disposition'],
        `schedule-${scheduleId}.xlsx`,
      )

      downloadBlob(response.data, filename)

      return {
        success: true,
        message: 'Файл графика скачан',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось скачать график'),
      }
    } finally {
      isLoading.value = false
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

    myEntries,
    myRequests,
    adminRequests,
    nearestEntry,

    isLoading,
    isGenerating,
    isPublishing,
    isDeleting,
    isSavingAssignments,
    isSavingNeeds,
    isCreatingRequest,
    isProcessingRequest,
    isQrLoading,

    fetchMySchedule,
    fetchMyRequests,
    fetchAdminRequests,
    createChangeRequest,
    approveChangeRequest,
    rejectChangeRequest,
    createQr,
    scanQr,

    fetchSchedules,
    createSchedule,
    generateSchedule,
    publishSchedule,
    deleteSchedule,
    fetchScheduleEntries,
    fetchScheduleEditData,
    saveScheduleDayNeeds,
    saveScheduleDayAssignments,
    saveScheduleNeeds: saveScheduleDayNeeds,
    saveScheduleAssignments: saveScheduleDayAssignments,
    exportSchedule,
    getScheduleById,
  }
})