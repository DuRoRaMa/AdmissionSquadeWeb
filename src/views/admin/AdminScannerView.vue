<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import AppCard from '@/components/ui/AppCard.vue'
import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()

const scanBuffer = ref('')
const lastToken = ref('')
const lastScanAt = ref(0)
const result = ref(null)
const isPageFocused = ref(document.hasFocus())
const selectedDate = ref(getTodayDateString())

let bufferClearTimer = null

const DUPLICATE_SCAN_COOLDOWN_MS = 2000
const BUFFER_CLEAR_DELAY_MS = 500

const scannerStatusText = computed(() => {
  if (scheduleStore.isQrLoading) {
    return 'Обработка скана...'
  }

  if (!isPageFocused.value) {
    return 'Окно сканера не активно'
  }

  return 'Готов к сканированию'
})

const scannerStatusClass = computed(() => {
  if (scheduleStore.isQrLoading) return 'scanner-status--processing'
  if (!isPageFocused.value) return 'scanner-status--warning'

  return 'scanner-status--ready'
})

onMounted(async () => {
  window.addEventListener('keydown', handleScannerKeydown, true)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('blur', handleWindowBlur)

  await Promise.all([
    refreshLogs(),
    refreshAttendanceEntries(),
  ])
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleScannerKeydown, true)
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('blur', handleWindowBlur)

  if (bufferClearTimer) {
    window.clearTimeout(bufferClearTimer)
  }
})

function handleWindowFocus() {
  isPageFocused.value = true
}

function handleWindowBlur() {
  isPageFocused.value = false
}

function handleScannerKeydown(event) {
  if (isInteractiveTarget(event.target)) {
    return
  }

  if (event.ctrlKey || event.altKey || event.metaKey) {
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()

    const token = scanBuffer.value.trim()
    scanBuffer.value = ''

    if (token) {
      submitScannedToken(token)
    }

    return
  }

  if (event.key.length !== 1) {
    return
  }

  scanBuffer.value += event.key
  restartBufferClearTimer()
}

function isInteractiveTarget(target) {
  if (!target) {
    return false
  }

  const tagName = target.tagName?.toLowerCase()

  return (
    tagName === 'input'
    || tagName === 'textarea'
    || tagName === 'select'
    || target.isContentEditable
  )
}

function restartBufferClearTimer() {
  if (bufferClearTimer) {
    window.clearTimeout(bufferClearTimer)
  }

  bufferClearTimer = window.setTimeout(() => {
    scanBuffer.value = ''
  }, BUFFER_CLEAR_DELAY_MS)
}

async function submitScannedToken(token) {
  const now = Date.now()

  if (scheduleStore.isQrLoading) {
    return
  }

  if (token === lastToken.value && now - lastScanAt.value < DUPLICATE_SCAN_COOLDOWN_MS) {
    setResult({
      type: 'warning',
      title: 'Повторный скан проигнорирован',
      message: 'Этот QR-код уже был считан несколько секунд назад.',
    })

    return
  }

  lastToken.value = token
  lastScanAt.value = now

  setResult({
    type: 'processing',
    title: 'Скан получен',
    message: 'Проверяем QR-код...',
  })

  const response = await scheduleStore.scanQr(token)

  if (response.success) {
    setResult({
      type: 'success',
      title: response.message,
      message: buildSuccessDetails(response.data),
    })

    await Promise.all([
      refreshLogs(),
      refreshAttendanceEntries(),
    ])

    return
  }

  setResult({
    type: response.status === 'waiting' ? 'warning' : 'error',
    title: 'Сканирование не выполнено',
    message: response.message,
  })

  await refreshLogs()
}

function setResult(payload) {
  result.value = payload
}

function buildSuccessDetails(data) {
  const entry = data?.entry

  if (!entry) {
    return 'Действие успешно зафиксировано.'
  }

  const parts = [
    entry.member_name,
    formatDate(entry.date),
    entry.work_block_name,
  ].filter(Boolean)

  return parts.join(' · ')
}

async function refreshLogs() {
  await scheduleStore.fetchAttendanceLogs()
}

async function refreshAttendanceEntries() {
  await scheduleStore.fetchAttendanceEntries({
    date: selectedDate.value,
  })
}

async function handleDateChange(event) {
  event?.target?.blur?.()

  await refreshAttendanceEntries()
}

async function handleManualCheckIn(entry) {
  setResult({
    type: 'processing',
    title: 'Ручная отметка',
    message: 'Учитываем приход...',
  })

  const response = await scheduleStore.manualCheckIn(entry.id)

  setResult({
    type: response.success ? 'success' : 'error',
    title: response.success ? response.message : 'Не удалось учесть приход',
    message: response.success ? buildSuccessDetails(response.data) : response.message,
  })

  if (response.success) {
    await Promise.all([
      refreshAttendanceEntries(),
      refreshLogs(),
    ])
  }
}

async function handleManualCheckOut(entry) {
  setResult({
    type: 'processing',
    title: 'Ручная отметка',
    message: 'Учитываем уход...',
  })

  const response = await scheduleStore.manualCheckOut(entry.id)

  setResult({
    type: response.success ? 'success' : 'error',
    title: response.success ? response.message : 'Не удалось учесть уход',
    message: response.success ? buildSuccessDetails(response.data) : response.message,
  })

  if (response.success) {
    await Promise.all([
      refreshAttendanceEntries(),
      refreshLogs(),
    ])
  }
}

function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(value) {
  if (!value) return ''

  return new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  if (!value) return '—'

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(value) {
  if (!value) return ''

  return String(value).slice(0, 5)
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Сканер QR-кодов</template>

      <div class="scanner-panel">
        <div class="scanner-status" :class="scannerStatusClass">
          <div class="scanner-status__dot"></div>

          <div>
            <div class="scanner-status__title">
              {{ scannerStatusText }}
            </div>

            <div class="scanner-status__hint">
              Поднесите QR-код к стационарному сканеру. Поле ввода не отображается.
            </div>
          </div>
        </div>

        <div class="scanner-illustration" aria-hidden="true">
          ⌗
        </div>

        <div
          v-if="result"
          class="result-box"
          :class="`result-box--${result.type}`"
        >
          <div class="result-box__title">
            {{ result.title }}
          </div>

          <div v-if="result.message" class="result-box__message">
            {{ result.message }}
          </div>
        </div>

        <div v-else class="scanner-empty-state">
          Ожидание первого сканирования
        </div>
      </div>
    </AppCard>

    <AppCard>
      <template #header>
        <div class="attendance-header">
          <div>
            <div class="attendance-title">
              Назначенные на смену
            </div>

            <div class="attendance-subtitle">
              Ручная отметка прихода и ухода
            </div>
          </div>

          <input
            v-model="selectedDate"
            type="date"
            class="attendance-date"
            @change="handleDateChange"
          />
        </div>
      </template>

      <div v-if="scheduleStore.isAttendanceEntriesLoading" class="muted-state">
        Загружаем список назначенных участников...
      </div>

      <div v-else-if="!scheduleStore.attendanceEntries.length" class="muted-state">
        На выбранную дату назначений нет.
      </div>

      <div v-else class="attendance-table-wrap">
        <table class="attendance-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Блок работ</th>
              <th>Приход</th>
              <th>Уход</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="entry in scheduleStore.attendanceEntries" :key="entry.id">
              <td>{{ entry.full_name || '—' }}</td>
              <td>{{ entry.work_block_name || '—' }}</td>
              <td>{{ formatDateTime(entry.checked_in_at) }}</td>
              <td>{{ formatDateTime(entry.checked_out_at) }}</td>

              <td>
                <div class="attendance-actions">
                  <button
                    class="small-btn"
                    type="button"
                    :disabled="
                      !entry.can_manual_check_in
                        || scheduleStore.isManualAttendanceProcessing
                    "
                    @click="handleManualCheckIn(entry)"
                  >
                    Учесть приход
                  </button>

                  <button
                    class="small-btn small-btn--secondary"
                    type="button"
                    :disabled="
                      !entry.can_manual_check_out
                        || scheduleStore.isManualAttendanceProcessing
                    "
                    @click="handleManualCheckOut(entry)"
                  >
                    Учесть уход
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppCard>
      <template #header>
        <div class="logs-header">
          <span>Журнал сканирований и ручных отметок</span>

          <button
            class="refresh-btn"
            type="button"
            :disabled="scheduleStore.isAttendanceLogsLoading"
            @click="refreshLogs"
          >
            Обновить
          </button>
        </div>
      </template>

      <div v-if="scheduleStore.isAttendanceLogsLoading" class="muted-state">
        Загружаем журнал...
      </div>

      <div v-else-if="!scheduleStore.attendanceLogs.length" class="muted-state">
        Пока нет записей.
      </div>

      <div v-else class="logs-table-wrap">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Время</th>
              <th>Действие</th>
              <th>Участник</th>
              <th>Смена</th>
              <th>Дата смены</th>
              <th>Отметил</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="log in scheduleStore.attendanceLogs" :key="log.id">
              <td>{{ formatDateTime(log.created_at) }}</td>

              <td>
                <span class="action-pill">
                  {{ log.action_label || log.action }}
                </span>
              </td>

              <td>{{ log.member_name || '—' }}</td>

              <td>
                <div>{{ log.work_block_name || '—' }}</div>

                <div class="table-muted">
                  {{ formatTime(log.starts_at) }}
                  <template v-if="log.starts_at || log.ends_at">
                    —
                  </template>
                  {{ formatTime(log.ends_at) }}
                </div>
              </td>

              <td>{{ formatDate(log.entry_date) }}</td>
              <td>{{ log.scanner_name || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.scanner-panel {
  display: grid;
  gap: 18px;
  justify-items: center;
  text-align: center;
}

.scanner-status {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  border: var(--card-border);
  background: rgba(255, 255, 255, 0.04);
  text-align: left;
}

.scanner-status__dot {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 6px color-mix(in srgb, currentColor 18%, transparent);
}

.scanner-status--ready {
  color: var(--success-color, #198754);
}

.scanner-status--processing {
  color: var(--warning-color, #ffc107);
}

.scanner-status--warning {
  color: var(--danger-color, #dc3545);
}

.scanner-status__title {
  color: var(--text-color);
  font-size: 1.15rem;
  font-weight: 800;
}

.scanner-status__hint {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.94rem;
}

.scanner-illustration {
  width: min(220px, 60vw);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 32px;
  border: 2px dashed color-mix(in srgb, var(--text-muted) 45%, transparent);
  color: var(--text-muted);
  font-size: 6rem;
  font-weight: 900;
  line-height: 1;
  user-select: none;
}

.result-box {
  width: 100%;
  border-radius: 18px;
  padding: 18px;
  text-align: left;
}

.result-box__title {
  color: var(--text-color);
  font-size: 1.2rem;
  font-weight: 800;
}

.result-box__message {
  margin-top: 6px;
  color: var(--text-muted);
}

.result-box--success {
  background: color-mix(in srgb, var(--success-color, #198754) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--success-color, #198754) 42%, transparent);
}

.result-box--error {
  background: color-mix(in srgb, var(--danger-color, #dc3545) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--danger-color, #dc3545) 42%, transparent);
}

.result-box--warning,
.result-box--processing {
  background: color-mix(in srgb, var(--warning-color, #ffc107) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--warning-color, #ffc107) 42%, transparent);
}

.scanner-empty-state,
.muted-state {
  color: var(--text-muted);
}

.attendance-header,
.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.attendance-title {
  color: var(--text-color);
  font-weight: 800;
}

.attendance-subtitle {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.attendance-date {
  border: var(--card-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--input-bg, rgba(255, 255, 255, 0.06));
  color: var(--text-color);
}

.attendance-table-wrap,
.logs-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.attendance-table,
.logs-table {
  width: 100%;
  min-width: 780px;
  border-collapse: collapse;
}

.attendance-table th,
.attendance-table td,
.logs-table th,
.logs-table td {
  padding: 12px;
  border-bottom: var(--card-border);
  text-align: left;
  vertical-align: top;
  color: var(--text-color);
}

.attendance-table th,
.logs-table th {
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.attendance-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.small-btn,
.refresh-btn {
  border: var(--card-border);
  border-radius: 12px;
  padding: 8px 12px;
  background: var(--header-footer-bg);
  color: var(--text-color);
  font-weight: 700;
  cursor: pointer;
}

.small-btn {
  background: var(--accent-gradient, var(--accent-color));
  color: #fff;
}

.small-btn--secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-color);
}

.small-btn:disabled,
.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 10px;
  background: color-mix(in srgb, var(--accent-color, #6c63ff) 18%, transparent);
  color: var(--text-color);
  font-size: 0.86rem;
  font-weight: 800;
}

.table-muted {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 0.86rem;
}

@media (max-width: 720px) {
  .attendance-header,
  .logs-header {
    align-items: stretch;
    flex-direction: column;
  }

  .attendance-date,
  .refresh-btn {
    width: 100%;
  }
}
</style>
