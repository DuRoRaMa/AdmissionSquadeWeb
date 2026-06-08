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
  return `/rosters/schedules/${scheduleId}/edit-data/`
}

function getScheduleAssignmentsUrl(scheduleId) {
  return `/rosters/schedules/${scheduleId}/assignments/`
}

function getScheduleNeedsUrl(scheduleId) {
  return `/rosters/schedules/${scheduleId}/needs/`
}

function getEntryDateTime(entry, timeValue = '00:00') {
  const date = entry?.date

  if (!date) {
    return null
  }

  const value = new Date(`${date}T${timeValue}`)

  if (Number.isNaN(value.getTime())) {
    return null
  }

  return value
}

function getEntryStartDateTime(entry) {
  return getEntryDateTime(entry, entry?.starts_at || entry?.start_time || '00:00')
}

function getEntryEndDateTime(entry) {
  return getEntryDateTime(entry, entry?.ends_at || entry?.end_time || '23:59:59')
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

function normalizeParams(params) {
  if (!params) {
    return {}
  }

  if (typeof params === 'string') {
    return params ? { date: params } : {}
  }

  return params
}

function pickDefined(...values) {
  return values.find((value) => value !== undefined)
}

const QR_BLOCKED_STATUSES = new Set([
  'completed',
  'attended',
  'visited',
  'cancelled',
  'missed',
  'absent',
])

function getEntryStatus(entry) {
  return entry?.attendance_status || entry?.status || 'planned'
}

function canEntryHaveQr(entry) {
  const status = getEntryStatus(entry)

  return !QR_BLOCKED_STATUSES.has(status)
}

function extractEntryIdFromAttendanceResponse(data) {
  return data?.entry?.id || data?.entry_id || data?.id || null
}

function mergeEntryAttendanceData(entry, data) {
  const responseEntry = data?.entry || data || {}
  const record = data?.record || data?.attendance_record || {}
  const entryId = extractEntryIdFromAttendanceResponse(data)

  if (!entryId || String(entry?.id) !== String(entryId)) {
    return entry
  }

  const nextEntry = {
    ...entry,
  }

  const status = pickDefined(
    responseEntry.attendance_status,
    responseEntry.status,
    data?.attendance_status,
    data?.status,
  )

  const statusLabel = pickDefined(
    responseEntry.attendance_status_label,
    responseEntry.status_label,
    data?.attendance_status_label,
    data?.status_label,
  )

  const checkedInAt = pickDefined(
    record.checked_in_at,
    responseEntry.checked_in_at,
    data?.checked_in_at,
  )

  const checkedOutAt = pickDefined(
    record.checked_out_at,
    responseEntry.checked_out_at,
    data?.checked_out_at,
  )

  if (status !== undefined) {
    nextEntry.status = status
    nextEntry.attendance_status = status
  }

  if (statusLabel !== undefined) {
    nextEntry.status_label = statusLabel
    nextEntry.attendance_status_label = statusLabel
  }

  if (checkedInAt !== undefined) {
    nextEntry.checked_in_at = checkedInAt
  }

  if (checkedOutAt !== undefined) {
    nextEntry.checked_out_at = checkedOutAt
  }

  const hasCheckIn = Boolean(nextEntry.checked_in_at)
  const hasCheckOut = Boolean(nextEntry.checked_out_at)

  nextEntry.can_manual_check_in = !hasCheckIn
  nextEntry.can_manual_check_out = hasCheckIn && !hasCheckOut

  return nextEntry
}

function updateEntryListAttendance(list, data) {
  const entryId = extractEntryIdFromAttendanceResponse(data)

  if (!entryId || !Array.isArray(list)) {
    return list
  }

  return list.map((entry) => mergeEntryAttendanceData(entry, data))
}

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref([])
  const entries = ref([])
  const editData = ref(null)

  const myEntries = ref([])
  const myRequests = ref([])
  const adminRequests = ref([])

  const attendanceEntries = ref([])
  const attendanceLogs = ref([])

  const isLoading = ref(false)
  const isGenerating = ref(false)
  const isPublishing = ref(false)
  const isDeleting = ref(false)
  const isSavingAssignments = ref(false)
  const isSavingNeeds = ref(false)
  const isCreatingRequest = ref(false)
  const isProcessingRequest = ref(false)
  const isQrLoading = ref(false)
  const isAttendanceEntriesLoading = ref(false)
  const isAttendanceLogsLoading = ref(false)
  const isManualAttendanceProcessing = ref(false)
  const replacementCandidatesByEntry = ref({})
  const replacementCandidatesLoadingEntryId = ref(null)

  const nearestEntry = computed(() => {
    if (!Array.isArray(myEntries.value) || !myEntries.value.length) {
      return null
    }

    const now = new Date()

    const suitableEntries = myEntries.value
      .filter(canEntryHaveQr)
      .map((entry) => ({
        entry,
        startsAt: getEntryStartDateTime(entry),
        endsAt: getEntryEndDateTime(entry),
      }))
      .filter((item) => item.endsAt && item.endsAt >= now)
      .sort((first, second) => {
        if (!first.startsAt && !second.startsAt) return 0
        if (!first.startsAt) return 1
        if (!second.startsAt) return -1

        return first.startsAt - second.startsAt
      })

    return suitableEntries[0]?.entry || null
  })
  async function fetchReplacementCandidates(entryId) {
    replacementCandidatesLoadingEntryId.value = entryId

    try {
      const response = await apiClient.get(
        `/rosters/entries/${entryId}/replacement-candidates/`,
      )

      const candidates = normalizeListResponse(response.data)

      replacementCandidatesByEntry.value = {
        ...replacementCandidatesByEntry.value,
        [entryId]: candidates,
      }

      return {
        success: true,
        data: candidates,
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Не удалось загрузить участников на замену',
      )

      replacementCandidatesByEntry.value = {
        ...replacementCandidatesByEntry.value,
        [entryId]: [],
      }

      return {
        success: false,
        message,
        data: [],
      }
    } finally {
      replacementCandidatesLoadingEntryId.value = null
    }
  }
  function syncAttendanceFromResponse(data) {
    const entryId = extractEntryIdFromAttendanceResponse(data)

    if (!entryId) {
      return
    }

    myEntries.value = updateEntryListAttendance(myEntries.value, data)
    entries.value = updateEntryListAttendance(entries.value, data)
    attendanceEntries.value = updateEntryListAttendance(attendanceEntries.value, data)

    if (editData.value?.entries && Array.isArray(editData.value.entries)) {
      editData.value = {
        ...editData.value,
        entries: updateEntryListAttendance(editData.value.entries, data),
      }
    }

    if (editData.value?.assignments && Array.isArray(editData.value.assignments)) {
      editData.value = {
        ...editData.value,
        assignments: updateEntryListAttendance(editData.value.assignments, data),
      }
    }
  }

  async function fetchMySchedule() {
    isLoading.value = true

    try {
      const response = await apiClient.get('/rosters/my-schedule/')

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
      const response = await apiClient.get('/rosters/my-change-requests/')

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
      const response = await apiClient.get('/rosters/change-requests/')

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
      const response = await apiClient.post('/rosters/change-requests/create/', payload)

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
        `/rosters/change-requests/${requestId}/approve/`,
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
        `/rosters/change-requests/${requestId}/reject/`,
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
      const response = await apiClient.post(`/rosters/entries/${entryId}/qr/`)

      return {
        success: true,
        data: response.data,
        token: response.data?.token,
        action: response.data?.action,
        actionLabel: response.data?.action_label,
        expiresAt: response.data?.expires_at,
        message: response.data?.message || 'QR-код создан',
      }
    } catch (error) {
      const data = error?.response?.data

      return {
        success: false,
        data,
        status: data?.status,
        availableAt: data?.available_at,
        secondsLeft: data?.seconds_left,
        message: getErrorMessage(error, 'Не удалось создать QR-код'),
      }
    } finally {
      isQrLoading.value = false
    }
  }

  async function createQrToken(entryId) {
    return createQr(entryId)
  }

  async function scanQr(tokenOrPayload) {
    isQrLoading.value = true

    const payload =
      typeof tokenOrPayload === 'string'
        ? { token: tokenOrPayload }
        : tokenOrPayload

    try {
      const response = await apiClient.post('/rosters/scan-qr/', payload)

      syncAttendanceFromResponse(response.data)

      return {
        success: true,
        data: response.data,
        action: response.data?.action,
        entry: response.data?.entry,
        record: response.data?.record,
        message: response.data?.message || 'Посещение отмечено',
      }
    } catch (error) {
      const data = error?.response?.data

      return {
        success: false,
        data,
        status: data?.status,
        availableAt: data?.available_at,
        secondsLeft: data?.seconds_left,
        message: getErrorMessage(error, 'Не удалось отметить посещение'),
      }
    } finally {
      isQrLoading.value = false
    }
  }

  async function fetchAttendanceEntries(params = {}) {
    isAttendanceEntriesLoading.value = true

    try {
      const response = await apiClient.get('/rosters/attendance-entries/', {
        params: normalizeParams(params),
      })

      attendanceEntries.value = normalizeListResponse(response.data)

      return {
        success: true,
        data: attendanceEntries.value,
      }
    } catch (error) {
      attendanceEntries.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить список назначенных участников'),
      }
    } finally {
      isAttendanceEntriesLoading.value = false
    }
  }

  async function manualCheckIn(entryId) {
    isManualAttendanceProcessing.value = true

    try {
      const response = await apiClient.post(`/rosters/entries/${entryId}/manual-check-in/`)

      syncAttendanceFromResponse(response.data)

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Приход учтён вручную',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось учесть приход вручную'),
      }
    } finally {
      isManualAttendanceProcessing.value = false
    }
  }

  async function manualCheckOut(entryId) {
    isManualAttendanceProcessing.value = true

    try {
      const response = await apiClient.post(`/rosters/entries/${entryId}/manual-check-out/`)

      syncAttendanceFromResponse(response.data)

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Уход учтён вручную',
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось учесть уход вручную'),
      }
    } finally {
      isManualAttendanceProcessing.value = false
    }
  }

  async function fetchAttendanceLogs(params = {}) {
    isAttendanceLogsLoading.value = true

    try {
      const response = await apiClient.get('/rosters/attendance-logs/', {
        params: normalizeParams(params),
      })

      attendanceLogs.value = normalizeListResponse(response.data)

      return {
        success: true,
        data: attendanceLogs.value,
      }
    } catch (error) {
      attendanceLogs.value = []

      return {
        success: false,
        message: getErrorMessage(error, 'Не удалось загрузить журнал сканирований'),
      }
    } finally {
      isAttendanceLogsLoading.value = false
    }
  }

  async function fetchSchedules() {
    isLoading.value = true

    try {
      const response = await apiClient.get('/rosters/schedules/')

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
      const response = await apiClient.post('/rosters/schedules/', payload)

      await fetchSchedules()

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Черновик графика создан',
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
      const response = await apiClient.post(`/rosters/schedules/${scheduleId}/generate/`)

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
      const response = await apiClient.post(`/rosters/schedules/${scheduleId}/publish/`)

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
      await apiClient.delete(`/rosters/schedules/${scheduleId}/`)

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
      const response = await apiClient.get(`/rosters/schedules/${scheduleId}/entries/`)

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
      const response = await apiClient.get(`/rosters/schedules/${scheduleId}/export/`, {
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
    attendanceEntries,
    attendanceLogs,

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
    isAttendanceEntriesLoading,
    isAttendanceLogsLoading,
    isManualAttendanceProcessing,

    fetchMySchedule,
    fetchMyRequests,
    fetchAdminRequests,
    createChangeRequest,
    approveChangeRequest,
    rejectChangeRequest,

    createQr,
    createQrToken,
    scanQr,
    fetchAttendanceEntries,
    manualCheckIn,
    manualCheckOut,
    fetchAttendanceLogs,

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

    getEntryStartDateTime,
    getEntryEndDateTime,
    canEntryHaveQr,
    syncAttendanceFromResponse,
    replacementCandidatesByEntry,
    replacementCandidatesLoadingEntryId,
    fetchReplacementCandidates,
  }
})
