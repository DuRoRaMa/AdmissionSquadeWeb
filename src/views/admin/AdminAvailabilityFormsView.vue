<script setup>
import { computed, onMounted, ref } from 'vue'

import AppAlert from '../../components/ui/AppAlert.vue'
import AppButton from '../../components/ui/AppButton.vue'
import ConfirmModal from '../../components/ui/ConfirmModal.vue'
import AvailabilityFormCreateCard from '../../components/availability/AvailabilityFormCreateCard.vue'
import AvailabilityFormsTable from '../../components/availability/AvailabilityFormsTable.vue'
import AvailabilityResponsesModal from '../../components/availability/AvailabilityResponsesModal.vue'
import { useAvailabilityStore } from '../../stores/availability'
import { useSquadsStore } from '../../stores/squads'

const availabilityStore = useAvailabilityStore()
const squadsStore = useSquadsStore()

const confirmModalRef = ref(null)
const alert = ref(null)
const isSubmitting = ref(false)
const downloadingFormId = ref(null)
const responsesForm = ref(null)
const isResponsesModalOpen = ref(false)

const forms = computed(() => availabilityStore.forms)
const squads = computed(() => squadsStore.squads)
const responses = computed(() => availabilityStore.responses)
const isLoading = computed(() => availabilityStore.isLoading || squadsStore.isLoading)
const isResponsesLoading = computed(() => availabilityStore.isResponsesLoading)

onMounted(async () => {
  await Promise.all([
    squadsStore.fetchSquads(),
    availabilityStore.fetchForms(),
  ])
})

async function reloadForms() {
  const result = await availabilityStore.fetchForms()

  if (!result.success) {
    showAlert(result.message, 'danger')
  }
}

async function handleCreate(payload) {
  isSubmitting.value = true

  const result = await availabilityStore.createForm(payload)

  isSubmitting.value = false

  if (!result.success) {
    showAlert(result.message, 'danger')
    return
  }

  showAlert(result.message || 'Форма создана', 'success')
  await reloadForms()
}

async function handleOpen(form) {
  const confirmed = await confirmModalRef.value.open({
    title: 'Открыть форму?',
    message: `Форма «${form.title}» станет доступна для заполнения участниками.`,
  })

  if (!confirmed) return

  const result = await availabilityStore.openForm(form.id)

  if (!result.success) {
    showAlert(result.message, 'danger')
    return
  }

  showAlert(result.message || 'Форма открыта', 'success')
  await reloadForms()
}

async function handleClose(form) {
  const confirmed = await confirmModalRef.value.open({
    title: 'Закрыть форму?',
    message: `После закрытия формы «${form.title}» участники не смогут менять ответы.`,
  })

  if (!confirmed) return

  const result = await availabilityStore.closeForm(form.id)

  if (!result.success) {
    showAlert(result.message, 'danger')
    return
  }

  showAlert(result.message || 'Форма закрыта', 'success')
  await reloadForms()
}

async function handleViewResponses(form) {
  responsesForm.value = form
  isResponsesModalOpen.value = true

  const result = await availabilityStore.fetchFormResponses(form.id)

  if (!result.success) {
    showAlert(result.message, 'danger')
  }
}

async function handleDownload(form) {
  downloadingFormId.value = form.id

  const result = await availabilityStore.downloadFormResponses(form)

  downloadingFormId.value = null

  if (!result.success) {
    showAlert(result.message, 'danger')
  }
}

function closeResponsesModal() {
  isResponsesModalOpen.value = false
  responsesForm.value = null
}

function showAlert(message, variant = 'info') {
  alert.value = {
    id: Date.now(),
    message,
    variant,
  }
}
</script>

<template>
  <section class="admin-availability-page">
    <div class="admin-availability-page__header">
      <div>
        <h1>Формы доступности</h1>
        <p>Создание форм, просмотр ответов и выгрузка данных для графика.</p>
      </div>

      <AppButton variant="primary" :loading="isLoading" @click="reloadForms">
        Обновить
      </AppButton>
    </div>

    <AppAlert
      v-if="alert"
      :key="alert.id"
      :variant="alert.variant"
      dismissible
      auto-close
      :duration="10000"
      @close="alert = null"
    >
      {{ alert.message }}
    </AppAlert>

    <AvailabilityFormCreateCard
      :squads="squads"
      :loading="isSubmitting"
      @create="handleCreate"
    />

    <AvailabilityFormsTable
      :forms="forms"
      :squads="squads"
      :loading="isLoading"
      :downloading-form-id="downloadingFormId"
      @open="handleOpen"
      @close="handleClose"
      @view-responses="handleViewResponses"
      @download="handleDownload"
    />

    <AvailabilityResponsesModal
      :visible="isResponsesModalOpen"
      :form="responsesForm"
      :responses="responses"
      :loading="isResponsesLoading"
      @close="closeResponsesModal"
    />

    <ConfirmModal ref="confirmModalRef" />
  </section>
</template>

<style scoped>
.admin-availability-page {
  display: grid;
  gap: 24px;
}

.admin-availability-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-availability-page__header h1 {
  margin: 0;
  color: var(--text-color);
}

.admin-availability-page__header p {
  margin: 6px 0 0;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .admin-availability-page__header {
    flex-direction: column;
  }
}
</style>
