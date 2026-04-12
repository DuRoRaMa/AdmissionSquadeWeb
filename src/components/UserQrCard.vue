<script setup>
import { ref } from 'vue'
import AppCard from '@/components/AppCard.vue'
import { useScheduleStore } from '@/stores/schedule'

const props = defineProps({
  entryId: {
    type: Number,
    default: null
  },
  title: {
    type: String,
    default: 'QR для отметки'
  },
  subtitle: {
    type: String,
    default: ''
  }
})

const scheduleStore = useScheduleStore()

const qrData = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

async function loadQr() {
  if (!props.entryId) {
    errorMessage.value = 'Нет активной смены для получения QR-кода.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  const result = await scheduleStore.createQr(props.entryId)

  if (result.success) {
    qrData.value = result.data
  } else {
    errorMessage.value = result.message
  }

  isLoading.value = false
}
</script>

<template>
  <AppCard>
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
        Сейчас нет смены, для которой можно показать QR-код.
      </div>

      <div v-else>
        <button class="qr-button" @click="loadQr" :disabled="isLoading">
          {{ isLoading ? 'Загрузка...' : 'Показать QR-код' }}
        </button>

        <div v-if="errorMessage" class="qr-error">
          {{ errorMessage }}
        </div>

        <div v-if="qrData" class="qr-result">
          <div class="qr-placeholder">
            <div class="qr-placeholder-title">QR placeholder</div>
            <div class="qr-token">{{ qrData.token }}</div>
          </div>

          <div class="qr-meta">
            <div><strong>Токен:</strong> {{ qrData.token }}</div>
            <div><strong>Действует до:</strong> {{ qrData.expires_at }}</div>
          </div>
        </div>
      </div>
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
  gap: 16px;
}

.empty-state {
  color: var(--text-muted);
}

.qr-button {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 12px 16px;
  background: var(--accent-gradient);
  color: white;
  font-weight: 600;
}

.qr-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.qr-error {
  border-radius: 12px;
  padding: 12px;
  background: rgba(220, 53, 69, 0.12);
  color: #ff8f9b;
}

.qr-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qr-placeholder {
  border-radius: 18px;
  padding: 24px 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.06);
  border: var(--card-border);
}

.qr-placeholder-title {
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--text-color);
}

.qr-token {
  word-break: break-all;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.qr-meta {
  font-size: 0.9rem;
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>