<script setup>
import { onMounted } from 'vue'
import AppCard from '@/components/AppCard.vue'
import UserQrCard from '@/components/UserQrCard.vue'
import { useScheduleStore } from '@/stores/schedule'
import { useAvailabilityStore } from '@/stores/availability'

const scheduleStore = useScheduleStore()
const availabilityStore = useAvailabilityStore()

onMounted(async () => {
  await scheduleStore.fetchMySchedule()
  await availabilityStore.fetchActiveForm()
})
</script>

<template>
  <div class="home-dashboard">
    <div class="dashboard-grid">
      <AppCard>
        <template #header>Ближайшая смена</template>

        <div v-if="scheduleStore.nearestEntry" class="info-list">
          <div><strong>Дата:</strong> {{ scheduleStore.nearestEntry.date }}</div>
          <div>
            <strong>Время:</strong>
            {{ scheduleStore.nearestEntry.starts_at }} — {{ scheduleStore.nearestEntry.ends_at }}
          </div>
          <div>
            <strong>Блок:</strong>
            {{ scheduleStore.nearestEntry.work_block_code }} — {{ scheduleStore.nearestEntry.work_block_name }}
          </div>
          <div><strong>Статус:</strong> {{ scheduleStore.nearestEntry.status }}</div>
        </div>

        <div v-else class="muted-state">
          У вас пока нет назначенных смен.
        </div>
      </AppCard>

      <UserQrCard
        :entry-id="scheduleStore.nearestEntry?.id || null"
        title="QR для отметки"
        subtitle="Быстрый доступ к коду для ближайшей смены"
      />

      <AppCard>
        <template #header>Форма доступности</template>

        <div v-if="availabilityStore.activeForm" class="info-list">
          <div><strong>Название:</strong> {{ availabilityStore.activeForm.title }}</div>
          <div>
            <strong>Период:</strong>
            {{ availabilityStore.activeForm.period_start }} — {{ availabilityStore.activeForm.period_end }}
          </div>
          <router-link to="/availability" class="action-link">
            Перейти к заполнению
          </router-link>
        </div>

        <div v-else class="muted-state">
          Сейчас нет открытой формы доступности.
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.home-dashboard {
  width: 100%;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--text-color);
}

.muted-state {
  color: var(--text-muted);
}

.action-link {
  margin-top: 8px;
  display: inline-block;
  color: var(--link-color, var(--text-color));
  font-weight: 600;
  text-decoration: none;
}

.action-link:hover {
  opacity: 0.85;
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>