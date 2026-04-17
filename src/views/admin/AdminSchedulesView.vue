<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppCard from '@/components/AppCard.vue'
import AppSelect from '@/components/AppSelect.vue'
import { useScheduleStore } from '@/stores/schedule'
import apiClient from '@/axios'

const scheduleStore = useScheduleStore()

const squads = ref([])
const workBlocks = ref([])
const needRows = ref([])
const isSubmitting = ref(false)
const feedback = ref({
  type: '',
  text: '',
})

const form = ref(createInitialForm())

function createInitialForm() {
  return {
    squad: '',
    title: '',
    period_start: '',
    period_end: '',
  }
}

function createNeedRow(source = {}) {
  return {
    local_id: source.local_id ?? `${Date.now()}-${Math.random()}`,
    date: source.date ?? '',
    work_block: source.work_block ?? '',
    starts_at: normalizeInputTime(source.starts_at ?? '09:00'),
    ends_at: normalizeInputTime(source.ends_at ?? '15:00'),
    required_people: source.required_people ?? 1,
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

const dateOptions = computed(() =>
  buildDateRange(form.value.period_start, form.value.period_end).map((date) => ({
    value: date,
    label: formatDayLabel(date),
  })),
)

const workBlockOptions = computed(() =>
  workBlocks.value.map((item) => ({
    value: item.id,
    label: item.code ? `${item.code} — ${item.name}` : item.name,
  })),
)

const totalRequiredPeople = computed(() =>
  needRows.value.reduce((sum, row) => sum + Number(row.required_people || 0), 0),
)

function formatDayLabel(date) {
  const label = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

  return label.charAt(0).toUpperCase() + label.slice(1)
}

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

function getStatusLabel(status) {
  const map = {
    draft: 'Черновик',
    published: 'Опубликован',
  }
  return map[status] || status
}

function getStatusClass(status) {
  return {
    'status-pill': true,
    'status-pill--draft': status === 'draft',
    'status-pill--published': status === 'published',
  }
}

function formatSquadName(squadId) {
  const squad = squads.value.find((item) => item.id === squadId)
  return squad?.name || `Отряд #${squadId}`
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
      needRows.value = needRows.value.map((row) => ({
        ...row,
        work_block: '',
      }))
    }

    await fetchWorkBlocks(newSquad)
  },
)

watch(
  () => [form.value.period_start, form.value.period_end],
  () => {
    const validDates = new Set(buildDateRange(form.value.period_start, form.value.period_end))
    needRows.value = needRows.value.map((row) => ({
      ...row,
      date: validDates.has(row.date) ? row.date : '',
    }))
  },
)

function addNeedRow() {
  if (!form.value.period_start || !form.value.period_end) {
    feedback.value = {
      type: 'error',
      text: 'Сначала выбери период графика, затем добавляй потребности.',
    }
    return
  }

  needRows.value.push(
    createNeedRow({
      date: dateOptions.value[0]?.value || '',
    }),
  )
}

function removeNeedRow(localId) {
  needRows.value = needRows.value.filter((row) => row.local_id !== localId)
}

function validateForm() {
  if (!form.value.squad) {
    feedback.value = { type: 'error', text: 'Выбери отряд.' }
    return false
  }

  if (!form.value.title.trim()) {
    feedback.value = { type: 'error', text: 'Укажи название графика.' }
    return false
  }

  if (!form.value.period_start || !form.value.period_end) {
    feedback.value = { type: 'error', text: 'Укажи период графика.' }
    return false
  }

  for (const row of needRows.value) {
    if (!row.date) {
      feedback.value = { type: 'error', text: 'У каждой потребности должна быть указана дата.' }
      return false
    }

    if (!row.work_block) {
      feedback.value = { type: 'error', text: 'У каждой потребности должен быть выбран блок работ.' }
      return false
    }

    if (!row.starts_at || !row.ends_at) {
      feedback.value = { type: 'error', text: 'Укажи время начала и окончания для всех потребностей.' }
      return false
    }

    if (!Number(row.required_people) || Number(row.required_people) < 1) {
      feedback.value = { type: 'error', text: 'Количество людей в потребности должно быть не меньше 1.' }
      return false
    }
  }

  return true
}

function buildNeedsPayload() {
  return needRows.value.map((row) => ({
    work_block: Number(row.work_block),
    date: row.date,
    starts_at: normalizeApiTime(row.starts_at),
    ends_at: normalizeApiTime(row.ends_at),
    required_people: Number(row.required_people),
  }))
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
    title: form.value.title.trim(),
    period_start: form.value.period_start,
    period_end: form.value.period_end,
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

async function generateSchedule(id) {
  const result = await scheduleStore.generateSchedule(id)
  feedback.value = {
    type: result.success ? 'success' : 'error',
    text: result.message,
  }
  await scheduleStore.fetchSchedules()
}

async function publishSchedule(id) {
  const result = await scheduleStore.publishSchedule(id)
  feedback.value = {
    type: result.success ? 'success' : 'error',
    text: result.message,
  }
  await scheduleStore.fetchSchedules()
}

onMounted(async () => {
  await Promise.all([
    fetchSquads(),
    scheduleStore.fetchSchedules(),
  ])
})
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">Новый график</div>
            <div class="card-subtitle">
              Создание графика в обычной форме: период, потребности, блоки работ и количество человек.
            </div>
          </div>
        </div>
      </template>

      <div class="section-grid">
        <div class="field field--select">
          <label class="field-label">Отряд</label>
          <AppSelect
            v-model="form.squad"
            :options="squadOptions"
            placeholder="Выберите отряд"
          />
        </div>

        <div class="field">
          <label class="field-label">Название графика</label>
          <input
            v-model="form.title"
            class="text-input"
            type="text"
            placeholder="Например: График работы на 1 неделю августа"
          />
        </div>

        <div class="field">
          <label class="field-label">Дата начала</label>
          <input
            v-model="form.period_start"
            class="text-input"
            type="date"
          />
        </div>

        <div class="field">
          <label class="field-label">Дата окончания</label>
          <input
            v-model="form.period_end"
            class="text-input"
            type="date"
          />
        </div>
      </div>

      <div class="summary-row">
        <div class="summary-chip">
          <span class="summary-label">Потребностей</span>
          <strong>{{ needRows.length }}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">Всего мест</span>
          <strong>{{ totalRequiredPeople }}</strong>
        </div>
      </div>

      <div
        v-if="feedback.text"
        :class="['feedback', `feedback--${feedback.type || 'info'}`]"
      >
        {{ feedback.text }}
      </div>
    </AppCard>

    <AppCard>
      <template #header>
        <div class="card-header card-header--actions">
          <div>
            <div class="card-title">Потребности графика</div>
            <div class="card-subtitle">
              Здесь задаётся, сколько людей нужно в конкретный день и на какой блок работ.
            </div>
          </div>

          <button class="btn btn--primary" @click="addNeedRow">
            Добавить потребность
          </button>
        </div>
      </template>

      <div v-if="!form.period_start || !form.period_end" class="empty-state">
        Сначала выбери период графика, затем добавляй строки потребностей.
      </div>

      <div v-else-if="!needRows.length" class="empty-state">
        Пока нет ни одной потребности. Нажми «Добавить потребность».
      </div>

      <div v-else class="needs-list">
        <div
          v-for="(row, index) in needRows"
          :key="row.local_id"
          class="need-card"
        >
          <div class="need-card__top">
            <div class="need-card__title">
              Потребность #{{ index + 1 }}
            </div>

            <button
              class="btn btn--ghost"
              @click="removeNeedRow(row.local_id)"
            >
              Удалить
            </button>
          </div>

          <div class="need-grid">
            <div class="field field--select">
              <label class="field-label">Дата</label>
              <AppSelect
                v-model="row.date"
                :options="dateOptions"
                placeholder="Выберите дату"
              />
            </div>

            <div class="field field--select">
              <label class="field-label">Блок работ</label>
              <AppSelect
                v-model="row.work_block"
                :options="workBlockOptions"
                placeholder="Выберите блок работ"
              />
            </div>

            <div class="field">
              <label class="field-label">Начало</label>
              <input
                v-model="row.starts_at"
                class="text-input"
                type="time"
              />
            </div>

            <div class="field">
              <label class="field-label">Окончание</label>
              <input
                v-model="row.ends_at"
                class="text-input"
                type="time"
              />
            </div>

            <div class="field">
              <label class="field-label">Сколько человек нужно</label>
              <input
                v-model="row.required_people"
                class="text-input"
                type="number"
                min="1"
                step="1"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="actions-row">
        <button
          class="btn btn--primary"
          :disabled="isSubmitting || scheduleStore.isLoading"
          @click="submit"
        >
          {{ isSubmitting ? 'Сохранение...' : 'Создать график' }}
        </button>
      </div>
    </AppCard>

    <AppCard>
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">Список графиков</div>
            <div class="card-subtitle">Черновики можно сгенерировать, затем опубликовать.</div>
          </div>
        </div>
      </template>

      <div v-if="scheduleStore.isLoading" class="empty-state">
        Загрузка...
      </div>

      <div v-else-if="!scheduleStore.schedules.length" class="empty-state">
        Графики ещё не созданы.
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Отряд</th>
              <th>Название</th>
              <th>Период</th>
              <th>Потребностей</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in scheduleStore.schedules" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ formatSquadName(item.squad) }}</td>
              <td>{{ item.title }}</td>
              <td>{{ formatPeriod(item.period_start, item.period_end) }}</td>
              <td>{{ item.needs?.length || 0 }}</td>
              <td>
                <span :class="getStatusClass(item.status)">
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    class="btn btn--ghost"
                    :disabled="item.status !== 'draft'"
                    @click="generateSchedule(item.id)"
                  >
                    Сгенерировать
                  </button>

                  <button
                    class="btn btn--ghost"
                    :disabled="item.status !== 'draft'"
                    @click="publishSchedule(item.id)"
                  >
                    Опубликовать
                  </button>
                </div>
              </td>
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

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-header--actions {
  align-items: center;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.card-subtitle {
  margin-top: 4px;
  color: var(--text-muted);
  line-height: 1.45;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: var(--text-color);
  font-weight: 600;
  font-size: 0.95rem;
}

.text-input {
  width: 100%;
  min-height: 46px;
  padding: 0.8rem 0.95rem;
  border-radius: 14px;
  border: var(--card-border);
  background: var(--header-footer-bg);
  color: var(--text-color);
  outline: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.text-input:focus {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.16);
}

.field--select :deep(.custom-select) {
  max-width: none;
}

.field--select :deep(.select-trigger) {
  min-height: 46px;
  padding: 0.8rem 0.95rem;
  border-radius: 14px;
  background: var(--header-footer-bg);
  border: var(--card-border);
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-color);
}

.summary-label {
  color: var(--text-muted);
}

.feedback {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 14px;
  line-height: 1.45;
}

.feedback--success {
  background: rgba(76, 175, 80, 0.12);
  color: #9fe0a2;
}

.feedback--error {
  background: rgba(244, 67, 54, 0.12);
  color: #ffb4ad;
}

.feedback--info {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-color);
}

.empty-state {
  padding: 22px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  text-align: center;
}

.needs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.need-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  padding: 18px;
}

.need-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.need-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.need-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.btn--primary {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: var(--card-shadow);
}

.btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn--ghost {
  background: transparent;
  color: var(--text-color);
  border: var(--card-border);
}

.btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-color);
}

.data-table th,
.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  color: var(--text-muted);
  font-weight: 600;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.status-pill--draft {
  background: rgba(255, 193, 7, 0.12);
  color: #ffd76a;
}

.status-pill--published {
  background: rgba(76, 175, 80, 0.12);
  color: #9fe0a2;
}

@media (max-width: 980px) {
  .section-grid,
  .need-grid {
    grid-template-columns: 1fr;
  }

  .card-header,
  .card-header--actions,
  .need-card__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions-row {
    justify-content: stretch;
  }

  .actions-row .btn,
  .card-header--actions .btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .summary-row {
    flex-direction: column;
  }

  .summary-chip {
    justify-content: space-between;
  }
}
</style>