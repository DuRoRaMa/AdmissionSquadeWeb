import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Отдельный клиент без response-interceptor.
// Иначе ошибка refresh-запроса может запустить новый refresh.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })

  failedQueue = []
}

// Добавляем access-токен в каждый обычный запрос
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Обрабатываем только первую ошибку 401 конкретного запроса
    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    // Если refresh уже выполняется, ставим запрос в очередь
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((accessToken) => {
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        return apiClient(originalRequest)
      })
    }

    const refreshToken = localStorage.getItem('refreshToken')

    if (!refreshToken) {
      const authStore = useAuthStore()
      authStore.logout()

      return Promise.reject(error)
    }

    isRefreshing = true

    try {
      const response = await refreshClient.post(
        '/users/auth/token/refresh/',
        {
          refresh: refreshToken,
        },
      )

      const newAccessToken = response.data.access
      const newRefreshToken = response.data.refresh

      if (!newAccessToken) {
        throw new Error('Сервер не вернул новый access-токен')
      }

      const authStore = useAuthStore()

      // Обновляет и localStorage, и реактивное состояние Pinia
      authStore.setToken(
        newAccessToken,
        newRefreshToken || refreshToken,
      )

      apiClient.defaults.headers.common.Authorization =
        `Bearer ${newAccessToken}`

      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`

      // Возобновляем все запросы, которые ожидали refresh
      processQueue(null, newAccessToken)

      // Повторяем первоначальный запрос
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)

      const authStore = useAuthStore()
      authStore.logout()

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient