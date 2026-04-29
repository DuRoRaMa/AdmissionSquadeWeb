<template>
  <div class="admin-page schedules-page">
    <AppAlert
      v-if="alert.message"
      :key="alert.id"
      :variant="alert.type"
      dismissible
      auto-close
      :duration="10000"
      @close="clearAlert"
    >
      {{ alert.message }}
    </AppAlert>

    <div class="page-header">
      <div>
        <h1>Настройка графиков</h1>
        <p>
          Создавайте черновики графиков по закрытым формам доступности, задавайте потребности и запускайте генерацию.
        </p>
      </div>
    </div>

    <ScheduleCreateCard
      :squads="squads"
      :availability-forms="availabilityForms"
      :work-blocks="workBlocks"
      :loading="isPageLoading"
      :saving="scheduleStore.isLoading"
      @squad-change="handleSquadChange"
      @create="handleCreateSchedule"
      @validation-error="showAlert('danger', $event)"
    />

    <SchedulesTable
      :schedules="scheduleStore.schedules"
      :squads="squads"
      :loading="scheduleStore.isLoading"
      :generating-id="generatingScheduleId"
      :publishing-id="publishingScheduleId"
      :deleting-id="deletingScheduleId"
      @refresh="loadInitialData"
      @generate="handleGenerateSchedule"
      @publish="handlePublishSchedule"
      @edit="handleEditSchedule"
      @download="handleDownloadSchedule"
      @delete="handleDeleteSchedule"
    />

    <ConfirmModal ref="confirmModalRef" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import apiClient from '@/axios'
import { useScheduleStore } from '@/stores/schedule'
import { useSquadsStore } from '@/stores/squads'

import AppAlert from '@/components/ui/AppAlert.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import ScheduleCreateCard from '@/components/schedules/ScheduleCreateCard.vue'
import SchedulesTable from '@/components/schedules/SchedulesTable.vue'

const router = useRouter()
const scheduleStore = useScheduleStore()
const squadsStore = useSquadsStore()

const confirmModalRef = ref(null)
const availabilityForms = ref([])
const workBlocks = ref([])
const selectedSquadId = ref('')
const isDictionariesLoading = ref(false)
const generatingScheduleId = ref(null)
const publishingScheduleId = ref(null)
const deletingScheduleId = ref(null)
const downloadingScheduleId = ref(null)

const alert = ref({
  id: 0,
  type: 'success',
  message: '',
})

const squads = computed(() => squadsStore.squads || [])
const isPageLoading = computed(() => isDictionariesLoading.value || squadsStore.isLoading)

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}

function showAlert(type, message) {
  alert.value = {
    id: Date.now(),
    type,
    message,
  }
}

function clearAlert() {
  alert.value = {
    id: 0,
    type: 'success',
    message: '',
  }
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (typeof data?.message === 'string') {
    return data.message
  }

  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0]

    if (Array.isArray(firstValue) && firstValue.length) {
      return firstValue.join(' ')
    }

    if (typeof firstValue === 'string') {
      return firstValue
    }
  }

  return fallback
}

function getFileNameFromDisposition(disposition, fallbackName) {
  if (!disposition) {
    return fallbackName
  }

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)

  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1])
  }

  const plainMatch = disposition.match(/filename="?([^";]+)"?/i)

  if (plainMatch?.[1]) {
    return plainMatch[1]
  }

  return fallbackName
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}

async function fetchAvailabilityForms() {
  const response = await apiClient.get('/api/v1/rosters/forms/')
  availabilityForms.value = normalizeListResponse(response.data)
}

async function fetchWorkBlocks(squadId = '') {
  const url = squadId
    ? `/api/v1/rosters/work-blocks/?squad=${squadId}`
    : '/api/v1/rosters/work-blocks/'

  const response = await apiClient.get(url)
  workBlocks.value = normalizeListResponse(response.data)
}

async function loadInitialData() {
  isDictionariesLoading.value = true

  try {
    await Promise.all([
      squadsStore.fetchSquads(),
      fetchAvailabilityForms(),
      fetchWorkBlocks(selectedSquadId.value),
      scheduleStore.fetchSchedules(),
    ])
  } catch (error) {
    showAlert('danger', getErrorMessage(error, 'Не удалось загрузить данные для графиков'))
  } finally {
    isDictionariesLoading.value = false
  }
}

async function handleSquadChange(squadId) {
  selectedSquadId.value = squadId || ''

  try {
    await fetchWorkBlocks(selectedSquadId.value)
  } catch (error) {
    showAlert('danger', getErrorMessage(error, 'Не удалось загрузить блоки работ'))
  }
}

async function handleCreateSchedule(payload) {
  const result = await scheduleStore.createSchedule(payload)

  if (!result.success) {
    showAlert('danger', result.message)
    return
  }

  showAlert('success', result.message)
}

async function handleGenerateSchedule(schedule) {
  generatingScheduleId.value = schedule.id

  const result = await scheduleStore.generateSchedule(schedule.id)

  generatingScheduleId.value = null

  if (!result.success) {
    showAlert('danger', result.message)
    return
  }

  const entriesCount = result.data?.entries_count ?? 0

  if (entriesCount > 0) {
    showAlert('success', `${result.message} Создано смен: ${entriesCount}.`)
    return
  }

  showAlert('warning', 'Черновик сформирован, но смены не созданы. Проверь потребности и ответы доступности.')
}

async function handlePublishSchedule(schedule) {
  publishingScheduleId.value = schedule.id

  const result = await scheduleStore.publishSchedule(schedule.id)

  publishingScheduleId.value = null

  if (!result.success) {
    showAlert('danger', result.message)
    return
  }

  showAlert('success', result.message)
}

async function handleDownloadSchedule(schedule) {
  downloadingScheduleId.value = schedule.id

  try {
    const response = await apiClient.get(`/api/v1/rosters/schedules/${schedule.id}/export/`, {
      responseType: 'blob',
    })

    const fallbackName = `${schedule.title || 'schedule'}.xlsx`
    const fileName = getFileNameFromDisposition(response.headers['content-disposition'], fallbackName)
    const contentType = response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    downloadBlob(new Blob([response.data], { type: contentType }), fileName)
  } catch (error) {
    showAlert('danger', getErrorMessage(error, 'Не удалось скачать график'))
  } finally {
    downloadingScheduleId.value = null
  }
}

async function handleDeleteSchedule(schedule) {
  const confirmed = await confirmModalRef.value.open({
    title: 'Удалить график?',
    message: `График «${schedule.title}» будет удалён без возможности восстановления.`,
  })

  if (!confirmed) return

  deletingScheduleId.value = schedule.id

  const result = await scheduleStore.deleteSchedule(schedule.id)

  deletingScheduleId.value = null

  if (!result.success) {
    showAlert('danger', result.message)
    return
  }

  showAlert('success', result.message)
}

function handleEditSchedule(schedule) {
  router.push({
    name: 'dashboard-schedule-edit',
    params: { id: schedule.id },
  })
}

onMounted(loadInitialData)
</script>

<style scoped>
.schedules-page {
  display: grid;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.page-header h1 {
  margin: 0;
  color: var(--text-color);
}

.page-header p {
  margin: 0.4rem 0 0;
  color: var(--text-muted);
  max-width: 760px;
}
</style>
