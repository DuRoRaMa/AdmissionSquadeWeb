import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/axios'

export const useAvailabilityStore = defineStore('availability', () => {
  const activeForm = ref(null)
  const forms = ref([])
  const isLoading = ref(false)

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
        message: error.response?.data?.detail || 'Не удалось получить активную форму'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function submitForm(formId, slots) {
    isLoading.value = true
    try {
      const response = await apiClient.post(`/api/v1/rosters/forms/${formId}/submit/`, { slots })
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Ошибка отправки формы'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchForms() {
    isLoading.value = true
    try {
      const response = await apiClient.get('/api/v1/rosters/forms/')
      forms.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось загрузить формы'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createForm(payload) {
    isLoading.value = true
    try {
      const response = await apiClient.post('/api/v1/rosters/forms/', payload)
      return { success: true, data: response.data, message: 'Форма создана' }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось создать форму'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function openForm(formId) {
    try {
      const response = await apiClient.post(`/api/v1/rosters/forms/${formId}/open/`)
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось открыть форму'
      }
    }
  }

  async function closeForm(formId) {
    try {
      const response = await apiClient.post(`/api/v1/rosters/forms/${formId}/close/`)
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Не удалось закрыть форму'
      }
    }
  }

  return {
    activeForm,
    forms,
    isLoading,
    fetchActiveForm,
    submitForm,
    fetchForms,
    createForm,
    openForm,
    closeForm
  }
})