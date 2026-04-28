<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import apiClient from '@/axios'

const route = useRoute()
const router = useRouter()

const editData = ref(null)
const isLoading = ref(false)
const errorText = ref('')
const pageFeedback = ref('')
const selectedDate = ref('')
const blockFilter = ref('')
const addNeedId = ref('')
const addMembershipId = ref('')

const schedule = computed(() => editData.value?.schedule || null)
const days = computed(() => editData.value?.days || [])
const needs = computed(() => editData.value?.needs || [])
const isDraft = computed(() => schedule.value?.status === 'draft')

const dayOptions = computed(() => (
  days.value.map((day) => ({
    value: day,
    label: formatShortDate(day),
  }))
))

const selectedDateModel = computed({
  get: () => selectedDate.value,
  set: (day) => selectDate(day),
})

const blockOptions = computed(() => {
  const map = new Map()

  needs.value.forEach((need) => {
    const value = String(need.work_block || need.id)

    if (!map.has(value)) {
      map.set(value, need.work_block_name || 'Блок работ')
    }
  })

  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

const blockFilterOptions = computed(() => [
  { value: '', label: 'Все блоки' },
  ...blockOptions.value,
])

const filteredNeeds = computed(() => {
  if (!blockFilter.value) {
    return needs.value
  }

  return needs.value.filter((need) => String(need.work_block || need.id) === blockFilter.value)
})

const addNeedOptions = computed(() => (
  filteredNeeds.value.map((need) => ({
    value: String(need.id),
    label: `${need.work_block_name || 'Блок работ'} · ${formatTime(need.starts_at)} — ${formatTime(need.ends_at)}`,
  }))
))

const selectedAddNeed = computed(() => (
  needs.value.find((need) => String(need.id) === String(addNeedId.value)) || null
))

const availableCandidates = computed(() => {
  const candidates = selectedAddNeed.value?.candidates || []

  return candidates.filter((candidate) => !candidate.is_assigned && !candidate.is_busy)
})

const availableCandidateOptions = computed(() => (
  availableCandidates.value.map((candidate) => ({
    value: String(candidate.membership),
    label: candidate.member_name,
  }))
))

const addButtonDisabled = computed(() => (
  !isDraft.value || !addNeedId.value || !addMembershipId.value || isLoading.value
))

async function fetchEditData(date = selectedDate.value) {
  const scheduleId = route.params.id

  if (!scheduleId) {
    errorText.value = 'Не найден идентификатор графика.'
    return
  }

  isLoading.value = true
  errorText.value = ''
  pageFeedback.value = ''

  try {
    const params = {}

    if (date) {
      params.date = date
    }

    const response = await apiClient.get(
      `/api/v1/rosters/schedules/${scheduleId}/edit-data/`,
      { params },
    )

    editData.value = response.data
    selectedDate.value = response.data.selected_date
    resetControls(response.data.needs || [])
  } catch (error) {
    errorText.value =
      error.response?.data?.detail ||
      error.response?.data?.date?.[0] ||
      'Не удалось загрузить данные графика.'
  } finally {
    isLoading.value = false
  }
}

function resetControls(items = needs.value) {
  blockFilter.value = ''
  addNeedId.value = items[0]?.id ? String(items[0].id) : ''
  addMembershipId.value = ''
}

function selectDate(day) {
  if (!day || day === selectedDate.value) {
    return
  }

  selectedDate.value = day

  router.replace({
    name: 'dashboard-schedule-edit',
    params: { id: route.params.id },
    query: { ...route.query, date: day },
  })
}

function goBack() {
  router.push({ name: 'dashboard-schedules' })
}

function handleAddAssignment() {
  pageFeedback.value = 'Добавление участника подключим следующим шагом после endpoint’а создания назначения.'
}

function formatShortDate(date) {
  if (!date) return '—'

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsedDate)
}

function formatDayTab(date) {
  if (!date) return '—'

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(parsedDate)
}

function formatPeriod(start, end) {
  if (!start || !end) return '—'
  return `${formatShortDate(start)} — ${formatShortDate(end)}`
}

function formatTime(value) {
  if (!value) return '—'
  return String(value).slice(0, 5)
}

function getStatusLabel(status) {
  const map = {
    draft: 'Черновик',
    published: 'Опубликован',
    archived: 'Архив',
  }

  return map[status] || status || '—'
}

function getNeedStatusClass(need) {
  return {
    'need-count': true,
    'need-count--ok': need.shortage === 0,
    'need-count--shortage': need.shortage > 0,
  }
}

watch(
  () => route.query.date,
  (date) => {
    if (date && date !== selectedDate.value) {
      fetchEditData(date)
    }
  },
)

watch(blockFilter, () => {
  const firstNeed = filteredNeeds.value[0]
  addNeedId.value = firstNeed?.id ? String(firstNeed.id) : ''
  addMembershipId.value = ''
})

watch(addNeedId, () => {
  addMembershipId.value = ''
})

onMounted(() => {
  fetchEditData(route.query.date || '')
})
</script>

<template>
  <div class="schedule-edit-page">
    <AppCard>
      <template #header>
        <div class="page-header">
          <div>
            <AppButton
              class="back-link"
              variant="link"
              type="button"
              @click="goBack"
            >
              ← К списку графиков
            </AppButton>

            <div class="card-title">
              Редактирование графика
            </div>

            <div
              v-if="schedule"
              class="card-subtitle"
            >
              {{ schedule.title }} · {{ schedule.squad_name }} ·
              {{ formatPeriod(schedule.period_start, schedule.period_end) }}
            </div>
          </div>

          <span
            v-if="schedule"
            class="status-pill"
            :class="`status-pill--${schedule.status}`"
          >
            {{ getStatusLabel(schedule.status) }}
          </span>
        </div>
      </template>

      <div
        v-if="isLoading && !editData"
        class="empty-state"
      >
        Загрузка графика...
      </div>

      <div
        v-else-if="errorText"
        class="feedback feedback--error"
      >
        {{ errorText }}
      </div>

      <template v-else-if="editData">
        <div
          v-if="!isDraft"
          class="feedback feedback--warning"
        >
          Сейчас график не в статусе черновика. Редактирование опубликованного графика пока лучше не разрешать.
        </div>

        <div class="edit-toolbar">
          <div class="field field--select">
            <label class="field-label">День</label>

            <AppSelect
              v-model="selectedDateModel"
              :options="dayOptions"
              placeholder="Выберите день"
            />
          </div>

          <div class="field field--select">
            <label class="field-label">Блок работ</label>

            <AppSelect
              v-model="blockFilter"
              :options="blockFilterOptions"
              placeholder="Все блоки"
            />
          </div>
        </div>
      </template>
    </AppCard>

    <div
      v-if="isLoading && editData"
      class="inline-loader"
    >
      Обновляем выбранный день...
    </div>

    <AppCard v-if="editData && !isLoading">
      <template #header>
        <div class="section-header">
          <div>
            <div class="card-title">
              День {{ formatShortDate(selectedDate) }}
            </div>

            <div class="card-subtitle">
              Список потребностей и назначений по выбранному дню и блоку работ.
            </div>
          </div>
        </div>
      </template>

      <div
        v-if="pageFeedback"
        class="feedback feedback--info"
      >
        {{ pageFeedback }}
      </div>

      <div
        v-if="!filteredNeeds.length"
        class="empty-state"
      >
        На выбранный день нет потребностей по этому блоку.
      </div>

      <div
        v-else
        class="needs-simple-list"
      >
        <article
          v-for="need in filteredNeeds"
          :key="need.id"
          class="need-simple-card"
        >
          <div class="need-simple-card__main">
            <div>
              <div class="need-simple-card__title">
                {{ need.work_block_name || 'Блок работ' }}
              </div>

              <div class="need-simple-card__subtitle">
                {{ formatTime(need.starts_at) }} — {{ formatTime(need.ends_at) }}
              </div>
            </div>

            <div class="need-simple-card__stats">
              <span>Нужно: {{ need.required_people }}</span>
              <span>Назначено: {{ need.assigned_count }}</span>
              <span :class="getNeedStatusClass(need)">
                Не хватает: {{ need.shortage }}
              </span>
            </div>
          </div>

          <div class="assigned-block">
            <div class="assigned-block__label">
              Назначенные
            </div>

            <div
              v-if="!need.entries.length"
              class="assigned-empty"
            >
              Пока никто не назначен.
            </div>

            <div
              v-else
              class="assigned-chips"
            >
              <span
                v-for="entry in need.entries"
                :key="entry.id"
                class="assigned-chip"
              >
                {{ entry.member_name }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <div class="add-panel">
        <div>
          <div class="add-panel__title">
            Добавить участника
          </div>

          <div class="add-panel__subtitle">
            Выберите блок работ и пользователя из доступных по форме.
          </div>
        </div>

        <div class="add-panel__controls">
          <div class="field field--select">
            <label class="field-label">Блок работы</label>

            <AppSelect
              v-model="addNeedId"
              :options="addNeedOptions"
              :disabled="!addNeedOptions.length"
              placeholder="Выберите блок"
            />
          </div>

          <div class="field field--select">
            <label class="field-label">Пользователь</label>

            <AppSelect
              v-model="addMembershipId"
              :options="availableCandidateOptions"
              :disabled="!availableCandidates.length"
              placeholder="Выберите пользователя"
            />
          </div>

          <AppButton
            class="add-button"
            variant="primary"
            type="button"
            :disabled="addButtonDisabled"
            @click="handleAddAssignment"
          >
            Добавить
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.schedule-edit-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header,
.section-header,
.need-simple-card__main,
.add-panel,
.add-panel__controls {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-title,
.need-simple-card__title,
.add-panel__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.card-subtitle,
.need-simple-card__subtitle,
.add-panel__subtitle {
  margin-top: 4px;
  color: var(--text-muted);
  line-height: 1.45;
}

.back-link {
  margin: 0 0 10px;
  font-weight: 700;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-pill--draft {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.status-pill--published {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.status-pill--archived {
  background: rgba(148, 163, 184, 0.18);
  color: var(--text-muted);
}

.feedback {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  line-height: 1.45;
}

.feedback--error {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.feedback--warning {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.feedback--info {
  background: rgba(59, 130, 246, 0.12);
  color: var(--accent-color);
}

.empty-state,
.inline-loader,
.assigned-empty {
  padding: 22px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  text-align: center;
}

.inline-loader {
  padding: 12px 16px;
}

.edit-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(240px, 360px);
  gap: 16px;
  margin-top: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  color: var(--text-muted);
  font-size: 0.86rem;
  font-weight: 700;
}

.field--select :deep(.custom-select) {
  max-width: none;
  width: 100%;
}

.field--select :deep(.select-trigger) {
  min-height: 44px;
  border-radius: 14px;
  padding: 0 14px;
}

.text-input {
  min-height: 44px;
  width: 100%;
  border: var(--input-border);
  border-radius: 14px;
  padding: 0 14px;
  background: var(--input-bg);
  color: var(--text-color);
  outline: none;
}

.needs-simple-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.need-simple-card {
  padding: 16px;
  border: var(--card-border);
  border-radius: 18px;
  background: var(--input-bg);
}

.need-simple-card__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  color: var(--text-muted);
  font-weight: 700;
}

.need-simple-card__stats span {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--card-bg);
}

.need-count--shortage {
  color: #dc2626;
}

.need-count--ok {
  color: #15803d;
}

.assigned-block {
  margin-top: 14px;
}

.assigned-block__label {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: 0.86rem;
  font-weight: 700;
}

.assigned-empty {
  padding: 14px 16px;
}

.assigned-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.assigned-chip {
  display: inline-flex;
  align-items: center;
  padding: 7px 10px;
  border: var(--card-border);
  border-radius: 999px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 600;
}

.add-panel {
  margin-top: 20px;
  padding-top: 18px;
  border-top: var(--card-border);
}

.add-panel__controls {
  align-items: flex-end;
  flex: 1;
}

.add-panel__controls .field {
  min-width: 220px;
  flex: 1;
}

.add-button {
  min-height: 44px;
  white-space: nowrap;
}

@media (max-width: 980px) {
  .add-panel,
  .add-panel__controls {
    flex-direction: column;
  }

  .add-panel__controls {
    width: 100%;
    align-items: stretch;
  }

  .add-panel__controls .field {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .page-header,
  .section-header,
  .need-simple-card__main {
    flex-direction: column;
  }

  .need-simple-card__stats {
    justify-content: flex-start;
  }

  .edit-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
