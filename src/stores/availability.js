import { defineStore } from 'pinia'
import { ref } from 'vue'

import apiClient from '../axios'

export const useAvailabilityStore = defineStore('availability', () => {
  const activeForm = ref(null)
  const forms = ref([])
  const responses = ref([])
  const isLoading = ref(false)
  const isResponsesLoading = ref(false)

  async function fetchActiveForm() {
    isLoading.value = true

    try {
      const response = await apiClient.get('/api/v1/rosters/forms/active/')
      activeForm.value = response.data

      return { success: true, data: response.data }
    } catch (error) {
      activeForm.value = null

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось получить активную форму'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function submitForm(formId, slots) {
    isLoading.value = true

    try {
      const response = await apiClient.post(`/api/v1/rosters/forms/${formId}/submit/`, { slots })

      return {
        success: true,
        message: response.data.message || 'Ответы отправлены',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Ошибка отправки формы'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchForms() {
    isLoading.value = true

    try {
      const response = await apiClient.get('/api/v1/rosters/forms/')
      forms.value = normalizeListResponse(response.data)

      return { success: true, data: forms.value }
    } catch (error) {
      forms.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить формы'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createForm(payload) {
    isLoading.value = true

    try {
      const response = await apiClient.post('/api/v1/rosters/forms/', payload)

      return {
        success: true,
        data: response.data,
        message: 'Форма создана',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось создать форму'),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function openForm(formId) {
    try {
      const response = await apiClient.post(`/api/v1/rosters/forms/${formId}/open/`)

      return {
        success: true,
        message: response.data.message || 'Форма открыта',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось открыть форму'),
      }
    }
  }

  async function closeForm(formId) {
    try {
      const response = await apiClient.post(`/api/v1/rosters/forms/${formId}/close/`)

      return {
        success: true,
        message: response.data.message || 'Форма закрыта',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось закрыть форму'),
      }
    }
  }

  async function fetchFormResponses(formId) {
    isResponsesLoading.value = true

    try {
      const response = await apiClient.get(`/api/v1/rosters/forms/${formId}/responses/`)
      responses.value = normalizeResponsesResponse(response.data)

      return { success: true, data: responses.value }
    } catch (error) {
      responses.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить ответы на форму'),
      }
    } finally {
      isResponsesLoading.value = false
    }
  }

  async function downloadFormResponses(form) {
    const formId = typeof form === 'object' ? form.id : form
    const fallbackName = buildFallbackExportName(form)

    try {
      const response = await apiClient.get(`/api/v1/rosters/forms/${formId}/responses/export/`, {
        responseType: 'blob',
      })

      const fileName = getFileNameFromDisposition(response.headers?.['content-disposition']) || fallbackName
      const blob = new Blob([response.data], {
        type: response.headers?.['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: await getBlobErrorMessage(error, 'Не удалось скачать файл с ответами'),
      }
    }
  }

  function normalizeListResponse(data) {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
  }

  function normalizeResponsesResponse(data) {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.members)) return data.members
    if (Array.isArray(data?.responses)) return data.responses
    if (Array.isArray(data?.results)) return data.results
    return []
  }

  function getErrorMessage(error, fallback) {
    const data = error.response?.data

    if (!data) return fallback
    if (typeof data === 'string') return data
    if (data.detail) return data.detail
    if (data.message) return data.message

    const values = Object.values(data)
    const firstValue = values[0]

    if (Array.isArray(firstValue)) return firstValue[0] || fallback
    if (typeof firstValue === 'string') return firstValue

    return fallback
  }

  async function getBlobErrorMessage(error, fallback) {
    const data = error.response?.data

    if (data instanceof Blob) {
      try {
        const text = await data.text()
        const json = JSON.parse(text)

        return json.detail || json.message || fallback
      } catch {
        return fallback
      }
    }

    return getErrorMessage(error, fallback)
  }

  function getFileNameFromDisposition(disposition) {
    if (!disposition) return null

    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1])

    const regularMatch = disposition.match(/filename="?([^";]+)"?/i)
    if (regularMatch?.[1]) return regularMatch[1]

    return null
  }

  function buildFallbackExportName(form) {
    if (!form || typeof form !== 'object') return 'availability_responses.xlsx'

    const safeTitle = String(form.title || 'availability_responses')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .trim()

    return `${safeTitle || 'availability_responses'}_${form.id}.xlsx`
  }

  return {
    activeForm,
    forms,
    responses,
    isLoading,
    isResponsesLoading,
    fetchActiveForm,
    submitForm,
    fetchForms,
    createForm,
    openForm,
    closeForm,
    fetchFormResponses,
    downloadFormResponses,
  }
})
