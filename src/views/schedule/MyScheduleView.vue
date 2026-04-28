<script setup>
import { onMounted, ref } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()

const form = ref({
  entry: null,
  request_type: 'cancel',
  reason: '',
  target_membership: null
})

onMounted(async () => {
  await scheduleStore.fetchMySchedule()
})

async function submitRequest(entryId) {
  form.value.entry = entryId
  const result = await scheduleStore.createChangeRequest(form.value)
  alert(result.success ? 'Заявка создана' : result.message)

  form.value = {
    entry: null,
    request_type: 'cancel',
    reason: '',
    target_membership: null
  }
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Мой график</template>

      <div v-if="scheduleStore.isLoading">Загрузка...</div>

      <div v-else-if="!scheduleStore.myEntries.length" class="muted-state">
        У вас пока нет назначенных смен.
      </div>

      <div v-else class="entries-list">
        <div
          v-for="entry in scheduleStore.myEntries"
          :key="entry.id"
          class="entry-card"
        >
          <div class="entry-main">
            <div class="entry-title">{{ entry.date }}</div>
            <div><strong>Время:</strong> {{ entry.starts_at }} — {{ entry.ends_at }}</div>
            <div><strong>Блок:</strong> {{ entry.work_block_code }} — {{ entry.work_block_name }}</div>
            <div><strong>Статус:</strong> {{ entry.status }}</div>
          </div>

          <div class="entry-form">
            <select v-model="form.request_type" class="app-field">
              <option value="cancel">Не могу выйти</option>
              <option value="swap">Прошу замену</option>
              <option value="time_change">Изменение времени</option>
            </select>

            <textarea
              v-model="form.reason"
              class="app-field app-textarea"
              rows="3"
              placeholder="Укажите причину"
            />

            <button class="submit-btn" @click="submitRequest(entry.id)">
              Отправить заявку
            </button>
          </div>
        </div>
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

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entry-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: var(--card-border);
}

.entry-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 10px;
}

.entry-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-color);
}

.entry-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app-field {
  width: 100%;
  border-radius: 14px;
  border: var(--card-border);
  background: var(--header-footer-bg);
  color: var(--text-color);
  padding: 12px 14px;
}

.app-textarea {
  resize: vertical;
}

.submit-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  background: var(--accent-gradient);
  color: white;
  font-weight: 600;
}

.muted-state {
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .entry-card {
    grid-template-columns: 1fr;
  }
}
</style>