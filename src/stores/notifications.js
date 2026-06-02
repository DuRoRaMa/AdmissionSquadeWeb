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

  if (Array.isArray(data?.items)) {
    return data.items
  }

  if (Array.isArray(data?.notifications)) {
    return data.notifications
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

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])
  const unreadCount = ref(0)

  const isLoading = ref(false)
  const isCountLoading = ref(false)
  const isMarkingRead = ref(false)

  const lastError = ref('')

  const hasUnread = computed(() => unreadCount.value > 0)

  async function fetchNotifications(params = {}) {
    isLoading.value = true
    lastError.value = ''

    try {
      const response = await apiClient.get('/notifications/', {
        params,
      })

      notifications.value = normalizeListResponse(response.data)

      return {
        success: true,
        data: notifications.value,
      }
    } catch (error) {
      notifications.value = []

      const message = getErrorMessage(
        error,
        'Не удалось загрузить уведомления',
      )

      lastError.value = message

      return {
        success: false,
        message,
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount() {
    isCountLoading.value = true

    try {
      const response = await apiClient.get('/notifications/unread-count/')

      unreadCount.value = Number(response.data?.count || 0)

      return {
        success: true,
        count: unreadCount.value,
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Не удалось загрузить количество уведомлений',
      )

      lastError.value = message

      return {
        success: false,
        message,
      }
    } finally {
      isCountLoading.value = false
    }
  }

  async function markAsRead(notificationId) {
    if (!notificationId) {
      return {
        success: false,
        message: 'Уведомление не выбрано',
      }
    }

    isMarkingRead.value = true

    try {
      const response = await apiClient.post(
        `/notifications/${notificationId}/read/`,
      )

      const updatedNotification = response.data

      const currentNotification = notifications.value.find((item) => {
        return String(item.id) === String(notificationId)
      })

      notifications.value = notifications.value.map((item) => {
        if (String(item.id) !== String(notificationId)) {
          return item
        }

        return {
          ...item,
          ...updatedNotification,
          is_read: true,
        }
      })

      if (currentNotification && !currentNotification.is_read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }

      return {
        success: true,
        data: updatedNotification,
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Не удалось отметить уведомление как прочитанное',
      )

      lastError.value = message

      return {
        success: false,
        message,
      }
    } finally {
      isMarkingRead.value = false
    }
  }

  async function markAllAsRead() {
    isMarkingRead.value = true

    try {
      const response = await apiClient.post('/notifications/read-all/')

      notifications.value = notifications.value.map((item) => ({
        ...item,
        is_read: true,
      }))

      unreadCount.value = 0

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Уведомления отмечены как прочитанные',
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Не удалось отметить уведомления как прочитанные',
      )

      lastError.value = message

      return {
        success: false,
        message,
      }
    } finally {
      isMarkingRead.value = false
    }
  }

  async function refresh() {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(),
    ])
  }

  function reset() {
    notifications.value = []
    unreadCount.value = 0
    isLoading.value = false
    isCountLoading.value = false
    isMarkingRead.value = false
    lastError.value = ''
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    isCountLoading,
    isMarkingRead,
    lastError,
    hasUnread,

    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
    reset,
  }
})
