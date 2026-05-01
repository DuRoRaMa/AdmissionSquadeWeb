<script setup>
import { onMounted, ref } from 'vue'

import AppAlert from '@/components/ui/AppAlert.vue'
import AppCard from '@/components/ui/AppCard.vue'
import MyScheduleEntryCard from '@/components/schedules/my/MyScheduleEntryCard.vue'

import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()

const toast = ref({
  isShown: false,
  message: '',
  variant: 'info',
  key: 0,
})

onMounted(async () => {
  await scheduleStore.fetchMySchedule()
})

async function submitRequest(payload) {
  const result = await scheduleStore.createChangeRequest(payload)

  showToast({
    message: result.success ? 'Заявка успешно отправлена' : result.message,
    variant: result.success ? 'success' : 'danger',
  })

  if (result.success) {
    await scheduleStore.fetchMySchedule()
  }
}

function showValidationToast(message) {
  showToast({
    message,
    variant: 'warning',
  })
}

function showToast({ message, variant = 'info' }) {
  toast.value = {
    isShown: true,
    message: message || 'Действие выполнено',
    variant,
    key: toast.value.key + 1,
  }
}

function closeToast() {
  toast.value.isShown = false
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

      <div v-else class="my-schedule-list">
        <MyScheduleEntryCard
          v-for="entry in scheduleStore.myEntries"
          :key="entry.id"
          :entry="entry"
          :loading="scheduleStore.isCreatingRequest"
          @submit-request="submitRequest"
          @validation-error="showValidationToast"
        />
      </div>
    </AppCard>

    <AppAlert
      v-if="toast.isShown"
      :key="toast.key"
      :message="toast.message"
      :variant="toast.variant"
      :duration="4000"
      @close="closeToast"
    />
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.my-schedule-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.muted-state {
  color: var(--text-muted);
}
</style>
