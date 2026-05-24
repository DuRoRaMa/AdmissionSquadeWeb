<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'

import AppCard from '@/components/ui/AppCard.vue'
import { useScheduleStore } from '@/stores/schedule'

const props = defineProps({
  entryId: {
    type: Number,
    default: null,
  },
  title: {
    type: String,
    default: 'QR для отметки',
  },
  subtitle: {
    type: String,
    default: '',
  },
})

const SAFETY_REFRESH_MS = 10 * 1000
const TEMP_SECURITY_HIDE_MS = 3000

const ACTION_LABELS = {
  check_in: 'Приход',
  check_out: 'Уход',
}

const scheduleStore = useScheduleStore()

const canvasRef = ref(null)

const token = ref('')
const expiresAt = ref('')
const qrAction = ref('')
const qrActionLabel = ref('')

const availableAt = ref('')
const availableSecondsLeft = ref(0)

const qrSecondsLeft = ref(0)

const isLoading = ref(false)
const errorMessage = ref('')
const waitingMessage = ref('')
const isHiddenForSecurity = ref(false)

let refreshTimerId = null
let qrCountdownTimerId = null
let availableCountdownTimerId = null
let securityTimerId = null

const hasEntry = computed(() => Boolean(props.entryId))
const hasQr = computed(() => Boolean(token.value && !errorMessage.value))
const isWaitingCheckout = computed(() => Boolean(availableAt.value || availableSecondsLeft.value > 0))

const cardTitle = computed(() => {
  if (qrAction.value === 'check_in') {
    return 'QR-код для прихода'
  }

  if (qrAction.value === 'check_out') {
    return 'QR-код для ухода'
  }

  return props.title
})

const cardSubtitle = computed(() => {
  if (props.subtitle) {
    return props.subtitle
  }

  if (qrAction.value === 'check_in') {
    return 'Покажите QR-код администратору для фиксации прихода.'
  }

  if (qrAction.value === 'check_out') {
    return 'Покажите QR-код администратору для фиксации ухода.'
  }

  if (isWaitingCheckout.value) {
    return 'После прихода QR-код для ухода станет доступен позже.'
  }

  return ''
})

const actionBadgeLabel = computed(() => {
  if (qrActionLabel.value) {
    return qrActionLabel.value
  }

  return ACTION_LABELS[qrAction.value] || 'QR'
})

const expiresLabel = computed(() => {
  if (!expiresAt.value || !qrSecondsLeft.value) {
    return 'обновляется'
  }

  return formatDuration(qrSecondsLeft.value)
})

const availableLabel = computed(() => {
  if (!availableSecondsLeft.value) {
    return 'скоро'
  }

  return formatDuration(availableSecondsLeft.value)
})

const waitingAvailableTimeLabel = computed(() => {
  if (!availableAt.value) {
    return ''
  }

  return formatDateTime(availableAt.value)
})

watch(
  () => props.entryId,
  async () => {
    resetQrState()

    if (props.entryId) {
      await refreshQr()
    }
  },
)

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  document.addEventListener('contextmenu', temporarilyHideQrForSecurity)
  document.addEventListener('copy', temporarilyHideQrForSecurity)

  window.addEventListener('blur', hideQrForSecurity)
  window.addEventListener('focus', restoreQrAfterFocus)
  window.addEventListener('beforeprint', hideQrForSecurity)
  window.addEventListener('afterprint', restoreQrAfterFocus)
  window.addEventListener('keydown', handleSecurityKeydown)

  if (props.entryId) {
    await refreshQr()
  }
})

onBeforeUnmount(() => {
  stopAllTimers()

  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('contextmenu', temporarilyHideQrForSecurity)
  document.removeEventListener('copy', temporarilyHideQrForSecurity)

  window.removeEventListener('blur', hideQrForSecurity)
  window.removeEventListener('focus', restoreQrAfterFocus)
  window.removeEventListener('beforeprint', hideQrForSecurity)
  window.removeEventListener('afterprint', restoreQrAfterFocus)
  window.removeEventListener('keydown', handleSecurityKeydown)
})

async function refreshQr() {
  if (!props.entryId) {
    resetQrState()
    return
  }

  if (isLoading.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  waitingMessage.value = ''

  const result = await scheduleStore.createQr(props.entryId)

  if (!result.success) {
    handleQrError(result)
    isLoading.value = false
    return
  }

  handleQrSuccess(result)
  isLoading.value = false
}

function handleQrSuccess(result) {
  stopQrTimers()
  stopAvailableCountdown()

  token.value = result.token || result.data?.token || ''
  expiresAt.value = result.expiresAt || result.data?.expires_at || ''
  qrAction.value = result.action || result.data?.action || ''
  qrActionLabel.value = result.actionLabel || result.data?.action_label || ''

  availableAt.value = ''
  availableSecondsLeft.value = 0
  errorMessage.value = ''
  waitingMessage.value = ''

  updateQrSecondsLeft()
  startQrCountdown()
  scheduleQrRefresh()

  nextTick(() => {
    renderQr()
  })
}

function handleQrError(result) {
  stopQrTimers()

  token.value = ''
  expiresAt.value = ''
  qrAction.value = ''
  qrActionLabel.value = ''
  qrSecondsLeft.value = 0

  clearCanvas()

  const nextAvailableAt = result.availableAt || result.data?.available_at || ''
  const nextSecondsLeft = Number(result.secondsLeft || result.data?.seconds_left || 0)

  if (nextAvailableAt || nextSecondsLeft > 0) {
    availableAt.value = nextAvailableAt
    availableSecondsLeft.value = getAvailableSecondsLeft(nextAvailableAt, nextSecondsLeft)
    waitingMessage.value = result.message || 'QR-код для ухода пока недоступен.'
    errorMessage.value = ''

    startAvailableCountdown()
    return
  }

  availableAt.value = ''
  availableSecondsLeft.value = 0
  waitingMessage.value = ''
  errorMessage.value = result.message || 'Не удалось создать QR-код.'
}

async function renderQr() {
  if (!canvasRef.value || !token.value || isHiddenForSecurity.value) {
    return
  }

  await QRCode.toCanvas(canvasRef.value, token.value, {
    width: 190,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

function scheduleQrRefresh() {
  stopRefreshTimer()

  if (!expiresAt.value) {
    return
  }

  const expiresMs = new Date(expiresAt.value).getTime()
  const diffMs = expiresMs - Date.now()
  const refreshAfterMs = Math.max(1000, diffMs - SAFETY_REFRESH_MS)

  refreshTimerId = window.setTimeout(() => {
    refreshQr()
  }, refreshAfterMs)
}

function startQrCountdown() {
  stopQrCountdown()

  qrCountdownTimerId = window.setInterval(() => {
    updateQrSecondsLeft()
  }, 1000)
}

function updateQrSecondsLeft() {
  if (!expiresAt.value) {
    qrSecondsLeft.value = 0
    return
  }

  const diffMs = new Date(expiresAt.value).getTime() - Date.now()
  qrSecondsLeft.value = Math.max(0, Math.ceil(diffMs / 1000))

  if (qrSecondsLeft.value <= 0 && !isLoading.value) {
    refreshQr()
  }
}

function startAvailableCountdown() {
  stopAvailableCountdown()

  availableCountdownTimerId = window.setInterval(() => {
    updateAvailableSecondsLeft()
  }, 1000)
}

function updateAvailableSecondsLeft() {
  availableSecondsLeft.value = getAvailableSecondsLeft(availableAt.value, availableSecondsLeft.value)

  if (availableSecondsLeft.value <= 0 && !isLoading.value) {
    stopAvailableCountdown()
    refreshQr()
  }
}

function getAvailableSecondsLeft(dateValue, fallbackSeconds) {
  if (dateValue) {
    const diffMs = new Date(dateValue).getTime() - Date.now()
    return Math.max(0, Math.ceil(diffMs / 1000))
  }

  return Math.max(0, Number(fallbackSeconds || 0))
}

function stopRefreshTimer() {
  if (refreshTimerId) {
    window.clearTimeout(refreshTimerId)
    refreshTimerId = null
  }
}

function stopQrCountdown() {
  if (qrCountdownTimerId) {
    window.clearInterval(qrCountdownTimerId)
    qrCountdownTimerId = null
  }
}

function stopQrTimers() {
  stopRefreshTimer()
  stopQrCountdown()
}

function stopAvailableCountdown() {
  if (availableCountdownTimerId) {
    window.clearInterval(availableCountdownTimerId)
    availableCountdownTimerId = null
  }
}

function stopSecurityTimer() {
  if (securityTimerId) {
    window.clearTimeout(securityTimerId)
    securityTimerId = null
  }
}

function stopAllTimers() {
  stopQrTimers()
  stopAvailableCountdown()
  stopSecurityTimer()
}

function resetQrState() {
  stopAllTimers()

  token.value = ''
  expiresAt.value = ''
  qrAction.value = ''
  qrActionLabel.value = ''

  availableAt.value = ''
  availableSecondsLeft.value = 0
  qrSecondsLeft.value = 0

  errorMessage.value = ''
  waitingMessage.value = ''
  isLoading.value = false
  isHiddenForSecurity.value = false

  clearCanvas()
}

function clearCanvas() {
  if (!canvasRef.value) {
    return
  }

  const context = canvasRef.value.getContext('2d')

  if (!context) {
    return
  }

  context.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

function handleVisibilityChange() {
  if (document.hidden) {
    hideQrForSecurity()
    return
  }

  restoreQrAfterFocus()
}

function handleSecurityKeydown(event) {
  const key = String(event.key || '').toLowerCase()

  const isPrintScreen = key === 'printscreen'
  const isScreenshotShortcut =
    (event.metaKey && event.shiftKey && key === 's') ||
    (event.ctrlKey && event.shiftKey && key === 's')

  if (isPrintScreen || isScreenshotShortcut) {
    temporarilyHideQrForSecurity()
  }
}

function hideQrForSecurity() {
  if (!token.value) {
    return
  }

  isHiddenForSecurity.value = true
  clearCanvas()
}

async function restoreQrAfterFocus() {
  if (document.hidden || !token.value) {
    return
  }

  isHiddenForSecurity.value = false

  await nextTick()

  if (qrSecondsLeft.value <= 15) {
    await refreshQr()
    return
  }

  await renderQr()
}

function temporarilyHideQrForSecurity() {
  hideQrForSecurity()
  stopSecurityTimer()

  securityTimerId = window.setTimeout(() => {
    restoreQrAfterFocus()
  }, TEMP_SECURITY_HIDE_MS)
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const restSeconds = seconds % 60

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`
  }

  if (minutes > 0) {
    return `${minutes} мин ${String(restSeconds).padStart(2, '0')} сек`
  }

  return `${restSeconds} сек`
}

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <AppCard class="user-qr-card">
    <template #header>
      <div class="qr-header">
        <div>
          <div class="qr-title">{{ cardTitle }}</div>
          <div v-if="cardSubtitle" class="qr-subtitle">
            {{ cardSubtitle }}
          </div>
        </div>

        <span class="qr-badge">
          {{ actionBadgeLabel }}
        </span>
      </div>
    </template>

    <div class="qr-content">
      <div v-if="!hasEntry" class="empty-state">
        QR-код появится, когда у вас будет ближайшая назначенная смена.
      </div>

      <template v-else>
        <div v-if="isWaitingCheckout" class="checkout-wait">
          <div class="checkout-wait__title">
            QR-код для ухода пока недоступен
          </div>

          <div class="checkout-wait__timer">
            {{ availableLabel }}
          </div>

          <div class="checkout-wait__text">
            {{ waitingMessage || 'Уход можно будет отметить позже.' }}
          </div>

          <div v-if="waitingAvailableTimeLabel" class="checkout-wait__date">
            Доступен с {{ waitingAvailableTimeLabel }}
          </div>
        </div>

        <template v-else>
          <div class="qr-frame">
            <canvas
              ref="canvasRef"
              v-show="hasQr && !isHiddenForSecurity"
              class="qr-canvas"
              aria-label="QR-код для отметки на смене"
            />

            <div v-if="isHiddenForSecurity" class="qr-placeholder qr-placeholder--protected">
              QR скрыт для защиты
            </div>

            <div v-else-if="isLoading && !token" class="qr-placeholder">
              Генерация QR...
            </div>

            <div v-else-if="errorMessage" class="qr-placeholder qr-placeholder--error">
              {{ errorMessage }}
            </div>
          </div>

          <div v-if="hasQr" class="qr-footer">
            <div class="qr-timer">
              Действует: {{ expiresLabel }}
            </div>
          </div>

          <div class="qr-note">
            Код обновляется автоматически. После прихода QR-код для ухода появится только после разрешённого времени.
          </div>
        </template>
      </template>
    </div>
  </AppCard>
</template>

<style scoped>
.qr-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.qr-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.qr-subtitle {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.qr-badge {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-color);
  font-size: 0.75rem;
  font-weight: 600;
}

.qr-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.qr-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.qr-canvas {
  width: 190px;
  height: 190px;
  padding: 10px;
  border-radius: 18px;
  background: #ffffff;
}

.qr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 190px;
  min-height: 190px;
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed color-mix(in srgb, var(--text-muted) 45%, transparent);
  color: var(--text-muted);
  text-align: center;
  font-size: 0.9rem;
}

.qr-placeholder--protected {
  color: var(--warning-color, #ffc107);
}

.qr-placeholder--error {
  color: var(--danger-color, #dc3545);
}

.qr-footer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-timer {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.qr-note {
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}

.checkout-wait {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 16px;
  border-radius: 18px;
  border: 1px dashed color-mix(in srgb, var(--text-muted) 35%, transparent);
  text-align: center;
}

.checkout-wait__title {
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 700;
}

.checkout-wait__timer {
  color: var(--text-color);
  font-size: 1.55rem;
  font-weight: 800;
}

.checkout-wait__text {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

.checkout-wait__date {
  color: var(--text-muted);
  font-size: 0.8rem;
}

@media print {
  .user-qr-card {
    display: none !important;
  }
}
</style>
