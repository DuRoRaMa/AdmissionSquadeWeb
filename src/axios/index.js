import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Например, если токен протух (статус 401) – можно разлогинить пользователя
    if (error.response && error.response.status === 401) {
      // Здесь нужно вызвать logout, но чтобы не было циклических зависимостей,
      // можно использовать событие или импортировать store напрямую (осторожно)
      // Пока просто вернём ошибку, а логику разлогина добавим позже.
    }
    return Promise.reject(error)
  }
)

export default apiClient
