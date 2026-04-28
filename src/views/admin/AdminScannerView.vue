<script setup>
import { ref } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()
const token = ref('')
const resultMessage = ref('')
const resultType = ref('neutral')

async function submit() {
  const result = await scheduleStore.scanQr(token.value)
  resultMessage.value = result.message
  resultType.value = result.success ? 'success' : 'error'

  if (result.success) {
    token.value = ''
  }
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Сканер QR</template>

      <div class="scanner-layout">
        <input
          v-model="token"
          class="app-field"
          placeholder="Вставьте значение токена"
        />

        <button class="submit-btn" @click="submit">Отправить</button>

        <div v-if="resultMessage" class="result-box" :class="resultType">
          {{ resultMessage }}
        </div>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.page-stack { display: flex; flex-direction: column; gap: 24px; }
.scanner-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.app-field {
  width: 100%;
  border-radius: 14px;
  border: var(--card-border);
  background: var(--header-footer-bg);
  color: var(--text-color);
  padding: 12px 14px;
}
.submit-btn {
  width: fit-content;
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  background: var(--accent-gradient);
  color: white;
  font-weight: 600;
}
.result-box {
  border-radius: 14px;
  padding: 14px 16px;
}
.result-box.success {
  background: rgba(25, 135, 84, 0.15);
  color: #8be3b4;
}
.result-box.error {
  background: rgba(220, 53, 69, 0.15);
  color: #ff9aa5;
}
</style>