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

const TOKEN_REFRESH_MS = 3 * 60 * 1000
const SAFETY_REFRESH_MS = 10 * 1000
const TEMP_SECURITY_HIDE_MS = 3000

const scheduleStore = useScheduleStore()

const canvasRef = ref(null)
const token = ref('')
const expiresAt = ref('')
const secondsLeft = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const isHiddenForSecurity = ref(false)

let refreshTimerId = null
let countdownTimerId = null
let securityTimerId = null

const expiresLabel = computed(() => {
  if (!secondsLeft.value) {
    return 'обновляется'
  }

  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

watch(
  () => props.entryId,
  async () => {
    resetQrState()

    if (props.entryId) {
      await refreshQr()
      startRefreshTimer()
      startCountdown()
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
    startRefreshTimer()
    startCountdown()
  }
})

onBeforeUnmount(() => {
  stopRefreshTimer()
  stopCountdown()
  stopSecurityTimer()

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

  isLoading.value = true
  errorMessage.value = ''

  const result = await scheduleStore.createQr(props.entryId)

  if (!result.success) {
    token.value = ''
    expiresAt.value = ''
    secondsLeft.value = 0
    errorMessage.value = result.message
    clearCanvas()
    isLoading.value = false
    return
  }

  token.value = result.data?.token || ''
  expiresAt.value = result.data?.expires_at || ''
  updateSecondsLeft()

  await nextTick()
  await renderQr()

  isLoading.value = false
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

function startRefreshTimer() {
  stopRefreshTimer()

  refreshTimerId = window.setInterval(() => {
    refreshQr()
  }, TOKEN_REFRESH_MS - SAFETY_REFRESH_MS)
}

function stopRefreshTimer() {
  if (refreshTimerId) {
    window.clearInterval(refreshTimerId)
    refreshTimerId = null
  }
}

function startCountdown() {
  stopCountdown()

  countdownTimerId = window.setInterval(() => {
    updateSecondsLeft()
  }, 1000)
}

function stopCountdown() {
  if (countdownTimerId) {
    window.clearInterval(countdownTimerId)
    countdownTimerId = null
  }
}

function stopSecurityTimer() {
  if (securityTimerId) {
    window.clearTimeout(securityTimerId)
    securityTimerId = null
  }
}

function updateSecondsLeft() {
  if (!expiresAt.value) {
    secondsLeft.value = 0
    return
  }

  const diffMs = new Date(expiresAt.value).getTime() - Date.now()
  secondsLeft.value = Math.max(0, Math.ceil(diffMs / 1000))

  if (secondsLeft.value <= 0 && !isLoading.value) {
    refreshQr()
  }
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
  isHiddenForSecurity.value = true
  clearCanvas()
}

async function restoreQrAfterFocus() {
  if (document.hidden) {
    return
  }

  isHiddenForSecurity.value = false

  await nextTick()

  if (!token.value || secondsLeft.value <= 15) {
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

function resetQrState() {
  stopRefreshTimer()
  stopCountdown()
  stopSecurityTimer()

  token.value = ''
  expiresAt.value = ''
  secondsLeft.value = 0
  errorMessage.value = ''
  isLoading.value = false
  isHiddenForSecurity.value = false

  clearCanvas()
}
</script>

<template>
  <AppCard class="user-qr-card">
    <template #header>
      <div class="qr-header">
        <div>
          <div class="qr-title">{{ title }}</div>
          <div v-if="subtitle" class="qr-subtitle">{{ subtitle }}</div>
        </div>

        <span class="qr-badge">QR</span>
      </div>
    </template>

    <div class="qr-content">
      <div v-if="!entryId" class="empty-state">
        QR-код появится, когда у вас будет ближайшая назначенная смена.
      </div>

      <template v-else>
        <div class="qr-frame">
          <canvas
            ref="canvasRef"
            v-show="token && !isHiddenForSecurity && !errorMessage"
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

        <div class="qr-footer">
          <div class="qr-timer">
            Действует: {{ expiresLabel }}
          </div>

          <button
            type="button"
            class="qr-refresh"
            :disabled="isLoading"
            @click="refreshQr"
          >
            {{ isLoading ? 'Обновление...' : 'Обновить' }}
          </button>
        </div>

        <div class="qr-note">
          Код автоматически обновляется каждые 3 минуты.
        </div>
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
  justify-content: space-between;
  gap: 12px;
}

.qr-timer {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.qr-refresh {
  border: var(--card-border);
  border-radius: 999px;
  padding: 7px 12px;
  color: var(--text-color);
  background: transparent;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.qr-refresh:disabled {
  cursor: default;
  opacity: 0.6;
}

.qr-note {
  color: var(--text-muted);
  font-size: 0.8rem;
}

@media print {
  .user-qr-card {
    display: none !important;
  }
}
</style>
