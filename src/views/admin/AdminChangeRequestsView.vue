<script setup>
import { onMounted, ref } from 'vue'
import AppCard from '@/components/AppCard.vue'
import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()
const reviewComment = ref('')

onMounted(async () => {
  await scheduleStore.fetchAdminRequests()
})

async function approve(id) {
  const result = await scheduleStore.approveChangeRequest(id)
  alert(result.message)
  await scheduleStore.fetchAdminRequests()
}

async function reject(id) {
  const result = await scheduleStore.rejectChangeRequest(id, reviewComment.value)
  alert(result.message)
  await scheduleStore.fetchAdminRequests()
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Заявки на изменения</template>

      <div v-if="scheduleStore.isLoading">Загрузка...</div>

      <div v-else-if="!scheduleStore.adminRequests.length" class="muted-state">
        Заявок пока нет.
      </div>

      <div v-else class="requests-list">
        <div
          v-for="item in scheduleStore.adminRequests"
          :key="item.id"
          class="request-card"
        >
          <div class="request-main">
            <div><strong>ID:</strong> {{ item.id }}</div>
            <div><strong>Тип:</strong> {{ item.request_type }}</div>
            <div><strong>Статус:</strong> {{ item.status }}</div>
            <div><strong>Причина:</strong> {{ item.reason }}</div>
          </div>

          <div class="request-actions">
            <textarea
              v-model="reviewComment"
              class="app-field app-textarea"
              rows="3"
              placeholder="Комментарий при отклонении"
            ></textarea>

            <div class="action-row">
              <button class="ghost-btn" @click="approve(item.id)">Одобрить</button>
              <button class="ghost-btn danger" @click="reject(item.id)">Отклонить</button>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.page-stack { display: flex; flex-direction: column; gap: 24px; }
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.request-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255,255,255,0.04);
  border: var(--card-border);
}
.request-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-color);
}
.request-actions {
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
.app-textarea { resize: vertical; }
.action-row {
  display: flex;
  gap: 10px;
}
.ghost-btn {
  flex: 1;
  border: var(--card-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: transparent;
  color: var(--text-color);
}
.ghost-btn.danger {
  color: #ff9aa5;
}
.muted-state { color: var(--text-muted); }
@media (max-width: 900px) {
  .request-card { grid-template-columns: 1fr; }
}
</style>