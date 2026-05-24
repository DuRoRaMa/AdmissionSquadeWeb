<script setup>
import { onMounted, ref } from 'vue'

import AppAlert from '@/components/ui/AppAlert.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AdminChangeRequestCard from '@/components/schedules/admin/change-requests/AdminChangeRequestCard.vue'

import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()

const toast = ref({
  isShown: false,
  message: '',
  variant: 'info',
  key: 0,
})

onMounted(async () => {
  await scheduleStore.fetchAdminRequests()
})

async function approve(id) {
  const result = await scheduleStore.approveChangeRequest(id)

  showToast({
    message: result.success ? 'Заявка одобрена' : result.message,
    variant: result.success ? 'success' : 'danger',
  })

  await scheduleStore.fetchAdminRequests()
}

async function reject({ id, reviewComment }) {
  const result = await scheduleStore.rejectChangeRequest(id, {
    review_comment: reviewComment,
  })

  showToast({
    message: result.success ? 'Заявка отклонена' : result.message,
    variant: result.success ? 'success' : 'danger',
  })

  await scheduleStore.fetchAdminRequests()
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
      <template #header>Заявки на изменения</template>

      <div v-if="scheduleStore.isLoading">Загрузка...</div>

      <div v-else-if="!scheduleStore.adminRequests.length" class="muted-state">
        Заявок пока нет.
      </div>

      <div v-else class="admin-requests-list">
        <AdminChangeRequestCard
          v-for="item in scheduleStore.adminRequests"
          :key="item.id"
          :request="item"
          :loading="scheduleStore.isProcessingRequest"
          @approve="approve"
          @reject="reject"
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

.admin-requests-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.muted-state {
  color: var(--text-muted);
}
</style>
