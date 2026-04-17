<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppCard from '@/components/AppCard.vue'
import AppSelect from '@/components/AppSelect.vue'
import { useAvailabilityStore } from '@/stores/availability'
import apiClient from '@/axios'

const availabilityStore = useAvailabilityStore()

const squads = ref([])
const isSubmitting = ref(false)
const feedback = ref({
  type: '',
  text: '',
})

const form = ref(createInitialForm())
const dayConfigs = ref([])

function createInitialForm() {
  return {
    squad: '',
    title: '',
    period_start: '',
    period_end: '',
    response_deadline: '',
  }
}

function createPrimaryShift(source = {}) {
  return {
    title: source.title ?? 'Основная смена',
    starts_at: normalizeInputTime(source.starts_at ?? '09:00'),
    ends_at: normalizeInputTime(source.ends_at ?? '15:00'),
  }
}

function createExtraShift(source = {}) {
  return {
    title: source.title ?? 'Дополнительная смена',
    starts_at: normalizeInputTime(source.starts_at ?? '15:00'),
    ends_at: normalizeInputTime(source.ends_at ?? '20:00'),
  }
}

function createDayConfig(date, source = null) {
  return {
    date,
    enabled: source?.enabled ?? true,
    has_extra: source?.has_extra ?? false,
    primary: createPrimaryShift(source?.primary),
    extra: createExtraShift(source?.extra),
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

function rebuildDayConfigs() {
  const dates = buildDateRange(form.value.period_start, form.value.period_end)
  const previousMap = new Map(dayConfigs.value.map((item) => [item.date, item]))
  dayConfigs.value = dates.map((date) => createDayConfig(date, previousMap.get(date)))
}

watch(
  () => [form.value.period_start, form.value.period_end],
  () => {
    rebuildDayConfigs()
  },
)

const squadOptions = computed(() =>
  squads.value.map((item) => ({
    value: item.id,
    label: item.name || `Отряд #${item.id}`,
  })),
)

const enabledDaysCount = computed(() => dayConfigs.value.filter((item) => item.enabled).length)

const totalShiftCount = computed(() =>
  dayConfigs.value.reduce((sum, item) => {
    if (!item.enabled) return sum
    return sum + 1 + (item.has_extra ? 1 : 0)
  }, 0),
)

function formatDayLabel(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date(`${date}T00:00:00`))
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatPeriod(start, end) {
  if (!start || !end) return '—'
  return `${formatShortDate(start)} — ${formatShortDate(end)}`
}

function getStatusLabel(status) {
  const map = {
    draft: 'Черновик',
    open: 'Открыта',
    closed: 'Закрыта',
  }
  return map[status] || status
}

function getStatusClass(status) {
  return {
    'status-pill': true,
    'status-pill--draft': status === 'draft',
    'status-pill--open': status === 'open',
    'status-pill--closed': status === 'closed',
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

function validateForm() {
  if (!form.value.squad) {
    feedback.value = { type: 'error', text: 'Выбери отряд.' }
    return false
  }

  if (!form.value.title.trim()) {
    feedback.value = { type: 'error', text: 'Укажи название формы.' }
    return false
  }

  if (!form.value.period_start || !form.value.period_end) {
    feedback.value = { type: 'error', text: 'Укажи период формы.' }
    return false
  }

  if (dayConfigs.value.length === 0) {
    feedback.value = { type: 'error', text: 'В выбранном периоде нет дней для формы.' }
    return false
  }

  const activeDays = dayConfigs.value.filter((item) => item.enabled)
  if (activeDays.length === 0) {
    feedback.value = { type: 'error', text: 'Включи хотя бы один день в форму.' }
    return false
  }

  for (const day of activeDays) {
    if (!day.primary.starts_at || !day.primary.ends_at) {
      feedback.value = {
        type: 'error',
        text: `Заполни время основной смены для даты ${formatShortDate(day.date)}.`,
      }
      return false
    }

    if (day.has_extra && (!day.extra.starts_at || !day.extra.ends_at)) {
      feedback.value = {
        type: 'error',
        text: `Заполни время дополнительной смены для даты ${formatShortDate(day.date)}.`,
      }
      return false
    }
  }

  return true
}

function buildDaysPayload() {
  return dayConfigs.value
    .filter((item) => item.enabled)
    .map((item) => {
      const shifts = [
        {
          shift_kind: 'primary',
          title: item.primary.title.trim() || 'Основная смена',
          starts_at: normalizeApiTime(item.primary.starts_at),
          ends_at: normalizeApiTime(item.primary.ends_at),
          is_active: true,
        },
      ]

      if (item.has_extra) {
        shifts.push({
          shift_kind: 'extra',
          title: item.extra.title.trim() || 'Дополнительная смена',
          starts_at: normalizeApiTime(item.extra.starts_at),
          ends_at: normalizeApiTime(item.extra.ends_at),
          is_active: true,
        })
      }

      return {
        date: item.date,
        shifts,
      }
    })
}

function resetForm() {
  form.value = createInitialForm()
  dayConfigs.value = []
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
    response_deadline: form.value.response_deadline || null,
    days: buildDaysPayload(),
  }

  const result = await availabilityStore.createForm(payload)

  if (!result.success) {
    feedback.value = {
      type: 'error',
      text: result.message || 'Не удалось создать форму',
    }
    isSubmitting.value = false
    return
  }

  feedback.value = {
    type: 'success',
    text: result.message || 'Форма доступности создана',
  }

  resetForm()
  await availabilityStore.fetchForms()
  isSubmitting.value = false
}

async function openForm(id) {
  const result = await availabilityStore.openForm(id)
  feedback.value = {
    type: result.success ? 'success' : 'error',
    text: result.message,
  }
  await availabilityStore.fetchForms()
}

async function closeForm(id) {
  const result = await availabilityStore.closeForm(id)
  feedback.value = {
    type: result.success ? 'success' : 'error',
    text: result.message,
  }
  await availabilityStore.fetchForms()
}

onMounted(async () => {
  await Promise.all([
    fetchSquads(),
    availabilityStore.fetchForms(),
  ])
})
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">Новая форма доступности</div>
            <div class="card-subtitle">
              Создание формы без JSON: выбери период, затем настрой смены по дням.
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
          <label class="field-label">Название формы</label>
          <input
            v-model="form.title"
            class="text-input"
            type="text"
            placeholder="Например: Доступность на неделю приёмной кампании"
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

        <div class="field field--full">
          <label class="field-label">Дедлайн ответа</label>
          <input
            v-model="form.response_deadline"
            class="text-input"
            type="datetime-local"
          />
        </div>
      </div>

      <div class="summary-row">
        <div class="summary-chip">
          <span class="summary-label">Дней в форме</span>
          <strong>{{ enabledDaysCount }}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">Всего смен</span>
          <strong>{{ totalShiftCount }}</strong>
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
        <div class="card-header">
          <div>
            <div class="card-title">Настройка дней и смен</div>
            <div class="card-subtitle">
              Для каждого дня можно оставить только основную смену или включить дополнительную.
            </div>
          </div>
        </div>
      </template>

      <div v-if="!form.period_start || !form.period_end" class="empty-state">
        Сначала выбери период формы, после этого здесь появятся дни для настройки.
      </div>

      <div v-else-if="dayConfigs.length === 0" class="empty-state">
        Период заполнен некорректно.
      </div>

      <div v-else class="days-list">
        <div
          v-for="day in dayConfigs"
          :key="day.date"
          class="day-card"
        >
          <div class="day-card__top">
            <div>
              <div class="day-card__title">{{ formatDayLabel(day.date) }}</div>
              <div class="day-card__meta">{{ day.date }}</div>
            </div>

            <label class="toggle">
              <input v-model="day.enabled" type="checkbox" />
              <span>Включить день в форму</span>
            </label>
          </div>

          <div v-if="day.enabled" class="day-card__content">
            <div class="shift-grid">
              <div class="shift-card">
                <div class="shift-card__header">
                  <strong>Основная смена</strong>
                </div>

                <div class="shift-fields">
                  <div class="field">
                    <label class="field-label">Название</label>
                    <input
                      v-model="day.primary.title"
                      class="text-input"
                      type="text"
                      placeholder="Основная смена"
                    />
                  </div>

                  <div class="field">
                    <label class="field-label">Начало</label>
                    <input
                      v-model="day.primary.starts_at"
                      class="text-input"
                      type="time"
                    />
                  </div>

                  <div class="field">
                    <label class="field-label">Окончание</label>
                    <input
                      v-model="day.primary.ends_at"
                      class="text-input"
                      type="time"
                    />
                  </div>
                </div>
              </div>

              <div class="shift-card" :class="{ 'shift-card--inactive': !day.has_extra }">
                <div class="shift-card__header shift-card__header--between">
                  <strong>Дополнительная смена</strong>

                  <label class="toggle">
                    <input v-model="day.has_extra" type="checkbox" />
                    <span>Есть дополнительная смена</span>
                  </label>
                </div>

                <div v-if="day.has_extra" class="shift-fields">
                  <div class="field">
                    <label class="field-label">Название</label>
                    <input
                      v-model="day.extra.title"
                      class="text-input"
                      type="text"
                      placeholder="Дополнительная смена"
                    />
                  </div>

                  <div class="field">
                    <label class="field-label">Начало</label>
                    <input
                      v-model="day.extra.starts_at"
                      class="text-input"
                      type="time"
                    />
                  </div>

                  <div class="field">
                    <label class="field-label">Окончание</label>
                    <input
                      v-model="day.extra.ends_at"
                      class="text-input"
                      type="time"
                    />
                  </div>
                </div>

                <div v-else class="shift-placeholder">
                  В этот день пользователю будет показана только основная смена.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions-row">
        <button
          class="btn btn--primary"
          :disabled="isSubmitting || availabilityStore.isLoading"
          @click="submit"
        >
          {{ isSubmitting ? 'Сохранение...' : 'Создать форму' }}
        </button>
      </div>
    </AppCard>

    <AppCard>
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">Список форм</div>
            <div class="card-subtitle">Управление открытием и закрытием форм.</div>
          </div>
        </div>
      </template>

      <div v-if="availabilityStore.isLoading" class="empty-state">
        Загрузка...
      </div>

      <div v-else-if="!availabilityStore.forms.length" class="empty-state">
        Формы ещё не созданы.
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Отряд</th>
              <th>Название</th>
              <th>Период</th>
              <th>Дедлайн</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in availabilityStore.forms" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ formatSquadName(item.squad) }}</td>
              <td>{{ item.title }}</td>
              <td>{{ formatPeriod(item.period_start, item.period_end) }}</td>
              <td>{{ formatDateTime(item.response_deadline) }}</td>
              <td>
                <span :class="getStatusClass(item.status)">
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    class="btn btn--ghost"
                    :disabled="item.status === 'open'"
                    @click="openForm(item.id)"
                  >
                    Открыть
                  </button>

                  <button
                    class="btn btn--ghost"
                    :disabled="item.status === 'closed'"
                    @click="closeForm(item.id)"
                  >
                    Закрыть
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

.field--full {
  grid-column: 1 / -1;
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

.days-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.day-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.day-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  text-transform: capitalize;
}

.day-card__meta {
  margin-top: 4px;
  color: var(--text-muted);
}

.day-card__content {
  padding: 18px;
}

.shift-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.shift-card {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.shift-card--inactive {
  opacity: 0.8;
}

.shift-card__header {
  margin-bottom: 14px;
  color: var(--text-color);
}

.shift-card__header--between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.shift-fields {
  display: grid;
  gap: 14px;
}

.shift-placeholder {
  border-radius: 14px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  line-height: 1.45;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
  cursor: pointer;
}

.toggle input {
  accent-color: #667eea;
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

.status-pill--open {
  background: rgba(76, 175, 80, 0.12);
  color: #9fe0a2;
}

.status-pill--closed {
  background: rgba(244, 67, 54, 0.12);
  color: #ffb4ad;
}

@media (max-width: 980px) {
  .section-grid,
  .shift-grid {
    grid-template-columns: 1fr;
  }

  .day-card__top,
  .shift-card__header--between {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions-row {
    justify-content: stretch;
  }

  .actions-row .btn {
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