<script setup>
import { onMounted } from 'vue'

import AppCard from '@/components/ui/AppCard.vue'
import MyScheduleRequestsTable from '@/components/schedules/my/MyScheduleRequestsTable.vue'

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

      <MyScheduleRequestsTable
        v-else
        :requests="scheduleStore.myRequests"
      />
    </AppCard>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.muted-state {
  color: var(--text-muted);
}
</style>
