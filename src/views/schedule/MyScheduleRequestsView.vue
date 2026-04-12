<script setup>
import { onMounted } from 'vue'
import AppCard from '@/components/AppCard.vue'
import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()

onMounted(async () => {
  await scheduleStore.fetchMyRequests()
})
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Мои заявки</template>

      <div v-if="scheduleStore.isLoading">Загрузка...</div>

      <div v-else-if="!scheduleStore.myRequests.length" class="muted-state">
        У вас пока нет заявок.
      </div>

      <div v-else class="table-wrap">
        <table class="app-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Причина</th>
              <th>Статус</th>
              <th>Создана</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in scheduleStore.myRequests" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.request_type }}</td>
              <td>{{ item.reason }}</td>
              <td>{{ item.status }}</td>
              <td>{{ item.created_at }}</td>
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

.table-wrap {
  overflow-x: auto;
}

.app-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-color);
}

.app-table th,
.app-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  vertical-align: top;
}

.app-table th {
  color: var(--text-muted);
  font-weight: 700;
}

.muted-state {
  color: var(--text-muted);
}
</style>