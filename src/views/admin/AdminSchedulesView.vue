<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import apiClient from '@/axios'
import ScheduleCreateCard from '@/components/schedules/ScheduleCreateCard.vue'
import ScheduleNeedsEditor from '@/components/schedules/ScheduleNeedsEditor.vue'
import SchedulesTable from '@/components/schedules/SchedulesTable.vue'

const scheduleStore = useScheduleStore()
const router = useRouter()

const squads = ref([])
const workBlocks = ref([])
const needRows = ref([])
const availabilityForms = ref([])
const isSubmitting = ref(false)
const feedback = ref({
  type: '',
  text: '',
})

const form = ref(createInitialForm())

function createInitialForm() {
  return {
    squad: '',
    availability_form: '',
    title: '',
    period_start: '',
    period_end: '',
  }
}

function createNeedRow(source = {}) {
  return {
    local_id: source.local_id ?? `${Date.now()}-${Math.random()}`,
    work_block: source.work_block ?? '',
    starts_at: normalizeInputTime(source.starts_at ?? '09:00'),
    ends_at: normalizeInputTime(source.ends_at ?? '15:00'),
    required_people: source.required_people ?? 1,

    new_block_open: false,
    new_block_code: '',
    new_block_name: '',
    is_creating_block: false,
  }
}

function normalizeInputTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

function normalizeApiTime(value) {
  if (!value) return ''
  const stringValue = String(value)
  return stringValue.length === 5 ? `${stringValue}:00` : stringValue
}

function buildDateRange(start, end) {
  if (!start || !end) return []

  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    return []
  }

  const result = []
  const cursor = new Date(startDate)

  while (cursor <= endDate) {
    const year = cursor.getFullYear()
    const month = String(cursor.getMonth() + 1).padStart(2, '0')
    const day = String(cursor.getDate()).padStart(2, '0')
    result.push(`${year}-${month}-${day}`)
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

const squadOptions = computed(() =>
  squads.value.map((item) => ({
    value: item.id,
    label: item.name || `Отряд #${item.id}`,
  })),
)

const closedAvailabilityForms = computed(() => {
  return availabilityForms.value.filter((item) => {
    const sameSquad = Number(item.squad) === Number(form.value.squad)
    const isClosed = item.status === 'closed'

    return sameSquad && isClosed
  })
})

const availabilityFormOptions = computed(() =>
  closedAvailabilityForms.value.map((item) => ({
    value: item.id,
    label: `${item.title} — ${formatPeriod(item.period_start, item.period_end)}`,
  })),
)

const selectedAvailabilityForm = computed(() => {
  return availabilityForms.value.find(
    (item) => Number(item.id) === Number(form.value.availability_form),
  )
})

const workBlockOptions = computed(() =>
  workBlocks.value.map((item) => ({
    value: item.id,
    label: item.code ? `${item.code} — ${item.name}` : item.name,
  })),
)

const totalRequiredPeople = computed(() =>
  needRows.value.reduce((sum, row) => sum + Number(row.required_people || 0), 0),
)

const totalRequiredPeopleForPeriod = computed(() => {
  const daysCount = buildDateRange(form.value.period_start, form.value.period_end).length
  return totalRequiredPeople.value * daysCount
})

function formatShortDate(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function formatPeriod(start, end) {
  if (!start || !end) return '—'
  return `${formatShortDate(start)} — ${formatShortDate(end)}`
}

async function fetchAvailabilityForms() {
  try {
    const response = await apiClient.get('/api/v1/rosters/forms/')
    availabilityForms.value = Array.isArray(response.data)
      ? response.data
      : response.data?.results || []
  } catch (error) {
    availabilityForms.value = []

    feedback.value = {
      type: 'error',
      text: error.response?.data?.detail || 'Не удалось загрузить формы доступности',
    }
  }
}

async function fetchSquads() {
  try {
    const response = await apiClient.get('/api/v1/squads/')
    const items = Array.isArray(response.data) ? response.data : (response.data?.results || [])
    squads.value = items
  } catch (error) {
    feedback.value = {
      type: 'error',
      text: error.response?.data?.detail || 'Не удалось загрузить список отрядов',
    }
  }
}

async function fetchWorkBlocks(squadId) {
  if (!squadId) {
    workBlocks.value = []
    return
  }

  try {
    const response = await apiClient.get('/api/v1/rosters/work-blocks/', {
      params: { squad: squadId },
    })

    const items = Array.isArray(response.data) ? response.data : (response.data?.results || [])
    workBlocks.value = items
  } catch (error) {
    workBlocks.value = []
    feedback.value = {
      type: 'error',
      text: error.response?.data?.detail || 'Не удалось загрузить блоки работ',
    }
  }
}

watch(
  () => form.value.squad,
  async (newSquad, oldSquad) => {
    if (newSquad !== oldSquad) {
      form.value.availability_form = ''
      form.value.period_start = ''
      form.value.period_end = ''

      needRows.value = needRows.value.map((row) => ({
        ...row,
        work_block: '',
      }))
    }

    await fetchWorkBlocks(newSquad)
  },
)

watch(
  () => form.value.availability_form,
  () => {
    const selectedForm = selectedAvailabilityForm.value

    if (!selectedForm) {
      form.value.period_start = ''
      form.value.period_end = ''
      needRows.value = []
      return
    }

    form.value.period_start = selectedForm.period_start
    form.value.period_end = selectedForm.period_end
  },
)

function addNeedRow() {
  if (!form.value.availability_form || !form.value.period_start || !form.value.period_end) {
    feedback.value = {
      type: 'error',
      text: 'Сначала выбери закрытую форму доступности, затем добавляй потребности.',
    }

    return
  }

  needRows.value.push(createNeedRow())
}

function removeNeedRow(localId) {
  needRows.value = needRows.value.filter((row) => row.local_id !== localId)
}

function validateForm() {
  if (!form.value.squad) {
    feedback.value = { type: 'error', text: 'Выбери отряд.' }
    return false
  }
  if (!form.value.availability_form) {
    feedback.value = {
      type: 'error',
      text: 'Выбери закрытую форму доступности.',
    }

    return false
  }
  if (!form.value.title.trim()) {
    feedback.value = { type: 'error', text: 'Укажи название графика.' }
    return false
  }

  if (!form.value.period_start || !form.value.period_end) {
    feedback.value = {
      type: 'error',
      text: 'Период графика не определён. Проверь выбранную форму доступности.',
    }
    return false
  }

  for (const row of needRows.value) {
    if (!row.work_block) {
      feedback.value = {
        type: 'error',
        text: 'У каждой потребности должен быть выбран блок работ.',
      }

      return false
    }

    if (!row.starts_at || !row.ends_at) {
      feedback.value = {
        type: 'error',
        text: 'Укажи время начала и окончания для всех потребностей.',
      }

      return false
    }

    if (row.ends_at <= row.starts_at) {
      feedback.value = {
        type: 'error',
        text: 'Время окончания потребности должно быть позже времени начала.',
      }

      return false
    }

    if (!Number(row.required_people) || Number(row.required_people) < 1) {
      feedback.value = {
        type: 'error',
        text: 'Количество людей в потребности должно быть не меньше 1.',
      }

      return false
    }
  }

  return true
}

function buildNeedsPayload() {
  const dates = buildDateRange(form.value.period_start, form.value.period_end)

  return dates.flatMap((date) =>
    needRows.value.map((row) => ({
      work_block: Number(row.work_block),
      date,
      starts_at: normalizeApiTime(row.starts_at),
      ends_at: normalizeApiTime(row.ends_at),
      required_people: Number(row.required_people),
    })),
  )
}

function toggleNewWorkBlock(row) {
  row.new_block_open = !row.new_block_open

  if (!row.new_block_open) {
    row.new_block_code = ''
    row.new_block_name = ''
  }
}

async function createWorkBlockForRow(row) {
  if (!form.value.squad) {
    feedback.value = {
      type: 'error',
      text: 'Сначала выбери отряд.',
    }

    return
  }

  if (!row.new_block_code.trim()) {
    feedback.value = {
      type: 'error',
      text: 'Укажи код блока работ.',
    }

    return
  }

  if (!row.new_block_name.trim()) {
    feedback.value = {
      type: 'error',
      text: 'Укажи название блока работ.',
    }

    return
  }

  row.is_creating_block = true

  try {
    const response = await apiClient.post('/api/v1/rosters/work-blocks/', {
      squad: Number(form.value.squad),
      code: row.new_block_code.trim(),
      name: row.new_block_name.trim(),
      is_active: true,
    })

    await fetchWorkBlocks(form.value.squad)

    row.work_block = response.data.id
    row.new_block_open = false
    row.new_block_code = ''
    row.new_block_name = ''

    feedback.value = {
      type: 'success',
      text: 'Блок работ создан и выбран в потребности.',
    }
  } catch (error) {
    feedback.value = {
      type: 'error',
      text:
        error.response?.data?.detail ||
        error.response?.data?.code?.[0] ||
        error.response?.data?.name?.[0] ||
        'Не удалось создать блок работ.',
    }
  } finally {
    row.is_creating_block = false
  }
}

function resetForm() {
  form.value = createInitialForm()
  needRows.value = []
  workBlocks.value = []
}

async function submit() {
  feedback.value = { type: '', text: '' }

  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  const payload = {
    squad: Number(form.value.squad),
    availability_form: Number(form.value.availability_form),
    title: form.value.title.trim(),
    needs: buildNeedsPayload(),
  }

  const result = await scheduleStore.createSchedule(payload)

  if (!result.success) {
    feedback.value = {
      type: 'error',
      text: result.message || 'Не удалось создать график',
    }
    isSubmitting.value = false
    return
  }

  feedback.value = {
    type: 'success',
    text: result.message || 'График создан',
  }

  resetForm()
  await scheduleStore.fetchSchedules()
  isSubmitting.value = false
}

async function generateSchedule(scheduleId) {
  const confirmed = window.confirm('Сгенерировать черновик графика?')

  if (!confirmed) {
    return
  }

  const result = await scheduleStore.generateSchedule(scheduleId)

  if (!result.success) {
    feedback.value = {
      type: 'error',
      text: result.message || 'Не удалось сгенерировать график.',
    }
    return
  }

  feedback.value = {
    type: 'success',
    text: result.message || 'Черновик графика успешно сформирован.',
  }

  await scheduleStore.fetchSchedules()
}

async function publishSchedule(scheduleId) {
  const confirmed = window.confirm('Опубликовать график? После публикации он станет доступен участникам.')

  if (!confirmed) {
    return
  }

  try {
    const result = await scheduleStore.publishSchedule(scheduleId)

    feedback.value = {
      type: 'success',
      text: result?.message || 'График опубликован.',
    }

    await scheduleStore.fetchSchedules()
  } catch (error) {
    feedback.value = {
      type: 'error',
      text:
        error?.response?.data?.detail ||
        'Не удалось опубликовать график.',
    }
  }
}

function downloadSchedule() {
  // Пока без реализации.
}

function editSchedule(item) {
  router.push({
    name: 'dashboard-schedule-edit',
    params: { id: item.id },
  })
}

onMounted(async () => {
  await Promise.all([
    fetchSquads(),
    fetchAvailabilityForms(),
    scheduleStore.fetchSchedules(),
  ])
})
</script>

<template>
  <div class="page-stack">
    <ScheduleCreateCard
      :form="form"
      :squad-options="squadOptions"
      :availability-form-options="availabilityFormOptions"
      :selected-availability-form="selectedAvailabilityForm"
      :need-rows="needRows"
      :total-required-people="totalRequiredPeople"
      :total-required-people-for-period="totalRequiredPeopleForPeriod"
      :feedback="feedback"
    />

    <ScheduleNeedsEditor
      :form="form"
      :selected-availability-form="selectedAvailabilityForm"
      :need-rows="needRows"
      :work-block-options="workBlockOptions"
      :is-submitting="isSubmitting"
      :is-loading="scheduleStore.isLoading"
      @add-need="addNeedRow"
      @remove-need="removeNeedRow"
      @toggle-new-work-block="toggleNewWorkBlock"
      @create-work-block="createWorkBlockForRow"
      @submit="submit"
    />

    <SchedulesTable
      :schedules="scheduleStore.schedules"
      :squads="squads"
      :is-loading="scheduleStore.isLoading"
      @generate="generateSchedule"
      @publish="publishSchedule"
      @download="downloadSchedule"
      @edit="editSchedule"
    />
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
