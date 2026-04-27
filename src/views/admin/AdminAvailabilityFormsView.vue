<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAvailabilityStore } from '@/stores/availability'
import { useSquadsStore } from '@/stores/squads'
import apiClient from '@/axios'

const availabilityStore = useAvailabilityStore()
const squadsStore = useSquadsStore()

const errorMessage = ref('')
const successMessage = ref('')

const isCreateFormVisible = ref(true)
const responsesModalOpen = ref(false)
const responsesLoading = ref(false)
const responsesError = ref('')
const selectedResponsesForm = ref(null)
const formResponses = ref([])
const responsesFilter = ref('all')

const form = reactive({
  squad: '',
  title: '',
  period_start: '',
  period_end: '',
  response_deadline: '',
  days: [],
})

const defaultShift = {
  shift_kind: 'primary',
  title: 'Основная смена',
  starts_at: '09:00',
  ends_at: '13:00',
  is_active: true,
}

const forms = computed(() => {
  const value = availabilityStore.forms

  if (Array.isArray(value)) {
    return value
  }

  if (Array.isArray(value?.results)) {
    return value.results
  }

  return []
})

const squads = computed(() => {
  const value = squadsStore.squads

  if (Array.isArray(value)) {
    return value
  }

  if (Array.isArray(value?.results)) {
    return value.results
  }

  return []
})

const filteredResponses = computed(() => {
  const sorted = [...(Array.isArray(formResponses.value) ? formResponses.value : [])].sort((a, b) => {
    if (a.has_response !== b.has_response) return a.has_response ? -1 : 1
    return String(a.full_name || '').localeCompare(String(b.full_name || ''), 'ru')
  })
  if (responsesFilter.value === 'answered') return sorted.filter((item) => item.has_response)
  if (responsesFilter.value === 'unanswered') return sorted.filter((item) => !item.has_response)
  return sorted
})

function formatDateSafe(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU')
}

function formatShortDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

function formatDateTimeSafe(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ru-RU')
}

function formatTimeSafe(value) {
  return value ? String(value).slice(0, 5) : '—'
}

function parseLocalDate(dateString) {
  if (!dateString) {
    return null
  }

  const [year, month, day] = dateString.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatDateLocal(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function cloneDefaultShift() {
  return {
    ...defaultShift,
  }
}

function makeDay(date) {
  return {
    date,
    shifts: [cloneDefaultShift()],
  }
}

function rebuildDaysFromPeriod() {
  if (!form.period_start || !form.period_end) {
    form.days.splice(0, form.days.length)
    return
  }

  const start = parseLocalDate(form.period_start)
  const end = parseLocalDate(form.period_end)

  if (!start || !end || end < start) {
    form.days.splice(0, form.days.length)
    return
  }

  const existingDaysByDate = new Map(
    form.days.map((day) => [
      day.date,
      {
        date: day.date,
        shifts: Array.isArray(day.shifts) && day.shifts.length
          ? day.shifts.map((shift) => ({ ...shift }))
          : [cloneDefaultShift()],
      },
    ]),
  )

  const nextDays = []
  const current = new Date(start)

  while (current <= end) {
    const date = formatDateLocal(current)
    nextDays.push(existingDaysByDate.get(date) || makeDay(date))
    current.setDate(current.getDate() + 1)
  }

  form.days.splice(0, form.days.length, ...nextDays)
}

watch(
  () => [form.period_start, form.period_end],
  () => {
    rebuildDaysFromPeriod()
  },
)

function addDay() {
  form.days.push(makeDay(''))
}

function removeDay(dayIndex) {
  form.days.splice(dayIndex, 1)
}

function addShift(dayIndex) {
  form.days[dayIndex].shifts.push(cloneDefaultShift())
}

function removeShift(dayIndex, shiftIndex) {
  form.days[dayIndex].shifts.splice(shiftIndex, 1)

  if (!form.days[dayIndex].shifts.length) {
    form.days[dayIndex].shifts.push(cloneDefaultShift())
  }
}

function resetCreateForm() {
  form.squad = ''
  form.title = ''
  form.period_start = ''
  form.period_end = ''
  form.response_deadline = ''
  form.days.splice(0, form.days.length)
}

function normalizeBackendError(errorData) {
  if (!errorData) {
    return 'Произошла ошибка'
  }

  if (typeof errorData === 'string') {
    return errorData
  }

  if (errorData.detail) {
    return errorData.detail
  }

  if (Array.isArray(errorData)) {
    return errorData.join('\n')
  }

  if (typeof errorData === 'object') {
    return Object.entries(errorData)
      .map(([field, value]) => {
        if (Array.isArray(value)) {
          return `${field}: ${value.join(', ')}`
        }

        if (typeof value === 'object' && value !== null) {
          return `${field}: ${JSON.stringify(value)}`
        }

        return `${field}: ${value}`
      })
      .join('\n')
  }

  return 'Произошла ошибка'
}

function validateCreateForm() {
  if (!form.squad) {
    return 'Выберите отряд'
  }

  if (!form.title.trim()) {
    return 'Введите название формы'
  }

  if (!form.period_start) {
    return 'Выберите дату начала периода'
  }

  if (!form.period_end) {
    return 'Выберите дату окончания периода'
  }

  const start = parseLocalDate(form.period_start)
  const end = parseLocalDate(form.period_end)

  if (!start || !end || end < start) {
    return 'Дата окончания не может быть раньше даты начала'
  }

  if (!form.days.length) {
    return 'Добавьте хотя бы один день'
  }

  const dayWithoutDate = form.days.find((day) => !day.date)

  if (dayWithoutDate) {
    return 'У каждого дня должна быть дата'
  }

  const dayOutsidePeriod = form.days.find((day) => {
    const dayDate = parseLocalDate(day.date)

    return !dayDate || dayDate < start || dayDate > end
  })

  if (dayOutsidePeriod) {
    return `Дата ${dayOutsidePeriod.date} выходит за пределы периода формы`
  }

  const dayWithoutShifts = form.days.find((day) => !Array.isArray(day.shifts) || !day.shifts.length)

  if (dayWithoutShifts) {
    return `Для даты ${dayWithoutShifts.date} добавьте хотя бы одну смену`
  }

  for (const day of form.days) {
    for (const shift of day.shifts) {
      if (!shift.title?.trim()) {
        return `Для даты ${day.date} укажите название смены`
      }

      if (!shift.starts_at || !shift.ends_at) {
        return `Для даты ${day.date} укажите время начала и окончания смены`
      }

      if (shift.ends_at <= shift.starts_at) {
        return `Для даты ${day.date} окончание смены должно быть позже начала`
      }
    }
  }

  return ''
}

function buildCreatePayload() {
  return {
    squad: Number(form.squad),
    title: form.title.trim(),
    period_start: form.period_start,
    period_end: form.period_end,
    response_deadline: form.response_deadline || null,
    days: form.days.map((day) => ({
      date: day.date,
      shifts: day.shifts.map((shift) => ({
        shift_kind: shift.shift_kind || 'primary',
        title: shift.title.trim(),
        starts_at: shift.starts_at,
        ends_at: shift.ends_at,
        is_active: Boolean(shift.is_active),
      })),
    })),
  }
}

async function submitCreateForm() {
  errorMessage.value = ''
  successMessage.value = ''

  const validationError = validateCreateForm()

  if (validationError) {
    errorMessage.value = validationError
    return
  }

  const payload = buildCreatePayload()

  console.log('Availability form payload:', payload)

  const result = await availabilityStore.createForm(payload)

  if (!result.success) {
    errorMessage.value = result.message || normalizeBackendError(result.errors)
    return
  }

  successMessage.value = result.message || 'Форма доступности создана'

  await availabilityStore.fetchForms()
  resetCreateForm()
}

async function handleOpenForm(item) {
  const confirmed = window.confirm(
    `Открыть форму "${item.title}" для заполнения участниками?`,
  )

  if (!confirmed) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  const result = await availabilityStore.openForm(item.id)

  if (!result.success) {
    errorMessage.value = result.message
    return
  }

  successMessage.value = result.message || 'Форма открыта'
  await availabilityStore.fetchForms()
}

async function handleCloseForm(item) {
  const confirmed = window.confirm(
    `Закрыть форму "${item.title}"? После закрытия участники не смогут отправлять ответы.`,
  )

  if (!confirmed) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  const result = await availabilityStore.closeForm(item.id)

  if (!result.success) {
    errorMessage.value = result.message
    return
  }

  successMessage.value = result.message || 'Форма закрыта'
  await availabilityStore.fetchForms()
}

async function openResponses(formItem) {
  responsesModalOpen.value = true
  responsesLoading.value = true
  responsesError.value = ''
  selectedResponsesForm.value = formItem
  formResponses.value = []
  responsesFilter.value = 'all'

  try {
    const { data } = await apiClient.get(`/api/v1/rosters/forms/${formItem.id}/responses/`)
    formResponses.value = Array.isArray(data?.members) ? data.members : []
  } catch (err) {
    responsesError.value = err.response?.data?.detail || 'Не удалось загрузить ответы на форму'
  } finally {
    responsesLoading.value = false
  }
}

function closeResponsesModal() {
  responsesModalOpen.value = false
  selectedResponsesForm.value = null
  formResponses.value = []
  responsesError.value = ''
  responsesFilter.value = 'all'
}

function getStatusLabel(status) {
  const labels = {
    draft: 'Черновик',
    open: 'Открыта',
    closed: 'Закрыта',
  }

  return labels[status] || status
}

function getStatusClass(status) {
  return {
    'status-badge--draft': status === 'draft',
    'status-badge--open': status === 'open',
    'status-badge--closed': status === 'closed',
  }
}

async function loadData() {
  await Promise.all([
    availabilityStore.fetchForms(),
    squadsStore.fetchSquads(),
  ])
}
async function downloadResponsesExport(item) {
  const response = await apiClient.get(
    `/api/v1/rosters/forms/${item.id}/responses/export/`,
    {
      responseType: 'blob',
    },
  )

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${item.title || 'Форма доступности'}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}
onMounted(loadData)
</script>

<template>
  <section class="availability-admin">
    <header class="page-header">
      <div>
        <h1 class="page-title">Формы доступности</h1>
        <p class="page-description">
          Создание и управление формами доступности для последующего формирования графика.
        </p>
      </div>

      <button
        type="button"
        class="primary-button"
        @click="isCreateFormVisible = !isCreateFormVisible"
      >
        {{ isCreateFormVisible ? 'Скрыть создание' : 'Создать форму' }}
      </button>
    </header>

    <div
      v-if="errorMessage"
      class="alert alert--error"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="alert alert--success"
    >
      {{ successMessage }}
    </div>

    <form
      v-if="isCreateFormVisible"
      class="card create-form"
      @submit.prevent="submitCreateForm"
    >
      <div class="card-header">
        <div>
          <h2>Новая форма доступности</h2>
          <p>
            После выбора периода список дней сформируется автоматически.
          </p>
        </div>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Отряд</span>
          <select
            v-model="form.squad"
            required
          >
            <option value="">
              Выберите отряд
            </option>

            <option
              v-for="squad in squads"
              :key="squad.id"
              :value="squad.id"
            >
              {{ squad.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Название формы</span>
          <input
            v-model="form.title"
            type="text"
            placeholder="Например: Доступность на июнь"
            required
          />
        </label>

        <label class="field">
          <span>Дата начала</span>
          <input
            v-model="form.period_start"
            type="date"
            required
          />
        </label>

        <label class="field">
          <span>Дата окончания</span>
          <input
            v-model="form.period_end"
            type="date"
            required
          />
        </label>

        <label class="field">
          <span>Дедлайн ответов</span>
          <input
            v-model="form.response_deadline"
            type="datetime-local"
          />
        </label>
      </div>

      <div class="days-section">
        <div class="section-header">
          <div>
            <h3>Дни и смены</h3>
            <p>
              Сейчас в форму будет отправлено дней: <strong>{{ form.days.length }}</strong>
            </p>
          </div>

          <button
            type="button"
            class="primary-button"
            @click="addDay"
          >
            Добавить день вручную
          </button>
        </div>

        <div
          v-if="!form.days.length"
          class="empty-state"
        >
          Выберите период формы, чтобы сформировать список дней.
        </div>

        <div
          v-for="(day, dayIndex) in form.days"
          :key="`${day.date}-${dayIndex}`"
          class="day-card"
        >
          <div class="day-card__header">
            <label class="field field--date">
              <span>Дата</span>
              <input
                v-model="day.date"
                type="date"
                required
              />
            </label>

            <button
              type="button"
              class="danger-button"
              @click="removeDay(dayIndex)"
            >
              Удалить день
            </button>
          </div>

          <div class="shifts-list">
            <div
              v-for="(shift, shiftIndex) in day.shifts"
              :key="`${day.date}-${shiftIndex}`"
              class="shift-row"
            >
              <label class="field">
                <span>Тип</span>
                <select v-model="shift.shift_kind">
                  <option value="primary">
                    Основная
                  </option>
                  <option value="extra">
                    Дополнительная
                  </option>
                </select>
              </label>

              <label class="field field--wide">
                <span>Название</span>
                <input
                  v-model="shift.title"
                  type="text"
                  required
                />
              </label>

              <label class="field">
                <span>Начало</span>
                <input
                  v-model="shift.starts_at"
                  type="time"
                  required
                />
              </label>

              <label class="field">
                <span>Окончание</span>
                <input
                  v-model="shift.ends_at"
                  type="time"
                  required
                />
              </label>

              <label class="checkbox-field">
                <input
                  v-model="shift.is_active"
                  type="checkbox"
                />
                <span>Активна</span>
              </label>

              <button
                type="button"
                class="danger-button danger-button--small"
                @click="removeShift(dayIndex, shiftIndex)"
              >
                Удалить
              </button>
            </div>
          </div>

          <button
            type="button"
            class="secondary-button secondary-button--small"
            @click="addShift(dayIndex)"
          >
            Добавить смену
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="danger-button"
          @click="resetCreateForm"
        >
          Очистить
        </button>

        <button
          type="submit"
          class="primary-button"
          :disabled="availabilityStore.isLoading"
        >
          {{ availabilityStore.isLoading ? 'Создание...' : 'Создать форму' }}
        </button>
      </div>
    </form>

    <section class="card">
      <div class="card-header">
        <div>
          <h2>Созданные формы</h2>
          <p>Список форм доступности и действия с ними.</p>
        </div>

        <button
          type="button"
          class="primary-button"
          @click="availabilityStore.fetchForms"
        >
          Обновить
        </button>
      </div>

      <div
        v-if="availabilityStore.isLoading"
        class="empty-state"
      >
        Загрузка форм...
      </div>

      <div
        v-else-if="!forms.length"
        class="empty-state"
      >
        Формы доступности пока не созданы.
      </div>

      <div
        v-else
        class="table-wrapper"
      >
        <table class="forms-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Отряд</th>
              <th>Период</th>
              <th>Дедлайн</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in forms"
              :key="item.id"
            >
              <td>
                <strong>{{ item.title }}</strong>
              </td>

              <td>
                {{ item.squad_name || item.squad?.name || item.squad }}
              </td>

              <td>
                {{ formatDateSafe(item.period_start) }} — {{ formatDateSafe(item.period_end) }}
              </td>

              <td>
                {{ formatDateTimeSafe(item.response_deadline) }}
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="getStatusClass(item.status)"
                >
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>

              <td>
                <div class="table-actions">
                  <button
                    type="button"
                    class="secondary-button secondary-button--small"
                    @click="openResponses(item)"
                  >
                    Ответы
                  </button>

                  <button
                    v-if="item.status !== 'open'"
                    type="button"
                    class="primary-button primary-button--small"
                    @click="handleOpenForm(item)"
                  >
                    Открыть
                  </button>

                  <button
                    v-if="item.status === 'open'"
                    type="button"
                    class="danger-button danger-button--small"
                    @click="handleCloseForm(item)"
                  >
                    Закрыть
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    @click="downloadResponsesExport(item)"
                  >
                    Скачать
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="responsesModalOpen" class="modal-overlay" @click.self="closeResponsesModal">
        <div class="responses-modal">
          <div class="responses-modal__header">
            <div>
              <div class="modal-title">Ответы на форму</div>
              <div class="modal-subtitle">{{ selectedResponsesForm?.title || '—' }}</div>
            </div>
            <button type="button" class="danger-button danger-button--small" @click="closeResponsesModal">
              Закрыть
            </button>
          </div>

          <div class="responses-modal__body">
            <div v-if="selectedResponsesForm" class="responses-summary">
              <div class="summary-chip">
                Период: {{ formatDateSafe(selectedResponsesForm.period_start) }} — {{ formatDateSafe(selectedResponsesForm.period_end) }}
              </div>
              <div class="summary-chip">
                Дедлайн: {{ formatDateTimeSafe(selectedResponsesForm.response_deadline) }}
              </div>
            </div>

            <div v-if="!responsesLoading && !responsesError && formResponses.length" class="responses-filters">
              <button type="button" class="filter-chip filter-chip--all" :class="{ 'filter-chip--active': responsesFilter === 'all' }" @click="responsesFilter = 'all'">
                Все
              </button>
              <button type="button" class="filter-chip filter-chip--answered" :class="{ 'filter-chip--active': responsesFilter === 'answered' }" @click="responsesFilter = 'answered'">
                Ответили
              </button>
              <button type="button" class="filter-chip filter-chip--unanswered" :class="{ 'filter-chip--active': responsesFilter === 'unanswered' }" @click="responsesFilter = 'unanswered'">
                Не ответили
              </button>
            </div>

            <div v-if="responsesLoading" class="empty-state">Загружаем ответы...</div>
            <div v-else-if="responsesError" class="alert alert--error">{{ responsesError }}</div>
            <div v-else-if="!formResponses.length" class="empty-state">Нет участников для отображения.</div>

            <div v-else class="responses-list">
              <div v-for="member in filteredResponses" :key="member.membership_id" class="response-card">
                <div class="response-card__top">
                  <div>
                    <div class="response-card__name">{{ member.full_name }}</div>
                    <div class="response-card__meta">{{ member.role_name || 'Без роли' }}</div>
                  </div>
                  <span class="status-badge" :class="member.has_response ? 'status-badge--open' : 'status-badge--closed'">
                    {{ member.has_response ? 'Ответил' : 'Не ответил' }}
                  </span>
                </div>

                <div class="response-stats">
                  <span>Доступен: {{ member.available_count }}</span>
                  <span>Недоступен: {{ member.unavailable_count }}</span>
                  <span>Отправлено: {{ formatDateTimeSafe(member.submitted_at) }}</span>
                </div>

                <details v-if="member.slots?.length" class="response-details">
                  <summary class="response-details__summary">
                    Показать детали по сменам
                    <span class="response-details__count">{{ member.slots.length }}</span>
                  </summary>
                  <div class="response-slots">
                    <div v-for="slot in member.slots" :key="`${member.membership_id}-${slot.shift_id}`" class="response-slot">
                      <div class="response-slot__main">
                        {{ formatShortDate(slot.date) }} · {{ slot.shift_title }}
                        ({{ formatTimeSafe(slot.starts_at) }}–{{ formatTimeSafe(slot.ends_at) }})
                      </div>
                      <div class="response-slot__meta">
                        {{ slot.is_available ? 'Доступен' : 'Недоступен' }}
                        <span v-if="slot.comment"> · {{ slot.comment }}</span>
                      </div>
                    </div>
                  </div>
                </details>

                <div v-else class="response-empty">Ответов по сменам нет.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<style scoped>
.availability-admin {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: var(--card-padding);
}

.page-header,
.card-header,
.section-header,
.day-card__header,
.modal-header,
.modal-footer,
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.page-description,
.card-header p,
.section-header p,
.modal-header p {
  margin: 4px 0 0;
  color: var(--text-muted);
}

.card {
  padding: var(--card-padding);
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.field--wide {
  min-width: 220px;
}

.field--date {
  max-width: 220px;
}

.field input,
.field select {
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  border: var(--input-border);
  border-radius: var(--btn-border-radius);
  background: var(--input-bg);
  font-size: 14px;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: end;
  min-height: 40px;
  font-size: 14px;
  color: var(--text-color);
}

.days-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border: var(--card-border);
  border-radius: 16px;
  background: var(--input-bg);
}

.shifts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shift-row {
  display: grid;
  grid-template-columns: 140px minmax(180px, 1fr) 130px 130px 110px auto;
  gap: 12px;
  align-items: end;
  padding: 12px;
  border: var(--card-border);
  border-radius: 14px;
  background: var(--card-bg);
}

.table-wrapper {
  overflow-x: auto;
}

.forms-table {
  width: 100%;
  border-collapse: collapse;
}

.forms-table th,
.forms-table td {
  padding: 12px;
  border-bottom: var(--input-border);
  text-align: left;
  vertical-align: middle;
}

.forms-table th {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
  background: var(--input-bg);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.primary-button,
.secondary-button,
.danger-button,
.icon-button {
  border: none;
  border-radius: var(--btn-border-radius);
  font-weight: 700;
  cursor: pointer;
  transition: 0.15s ease;
}

.primary-button {
  padding: var(--btn-padding-y) var(--btn-padding-x);
  background: var(--btn-primary-gradient);
  color: #ffffff;
}

.primary-button:hover {
  opacity: 0.9;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.secondary-button {
  padding: var(--btn-padding-y) var(--btn-padding-x);
  background: var(--btn-secondary-gradient);
  color: #fff;
}

.secondary-button:hover {
  opacity: 0.9;
}

.danger-button {
  padding: var(--btn-padding-y) var(--btn-padding-x);
  background: var(--btn-danger-gradient);
  color: #fff;
}

.danger-button:hover {
  opacity: 0.9;
}

.primary-button--small,
.secondary-button--small,
.danger-button--small {
  padding: 8px 12px;
  font-size: 13px;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--btn-secondary-gradient);
  color: var(--text-color);
  font-size: 24px;
  line-height: 1;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge--draft {
  background: var(--btn-secondary-gradient);
  color: #fff;
}

.status-badge--open {
  background: var(--btn-success-gradient);
  color: #fff;
}

.status-badge--closed {
  background: var(--btn-danger-gradient);
  color: #fff;
}

.alert {
  padding: 14px 16px;
  border-radius: 12px;
  font-weight: 600;
  white-space: pre-line;
}

.alert--error {
  background: var(--btn-danger-gradient);
  color: #fff;
}

.alert--success {
  background: var(--btn-success-gradient);
  color: #fff;
}

.empty-state {
  padding: var(--card-padding);
  border: var(--input-border);
  border-radius: 14px;
  color: var(--text-muted);
  text-align: center;
  background: var(--input-bg);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--card-padding);
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
}

.responses-modal {
  width: min(980px, 100%);
  max-height: 88vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.responses-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: var(--input-border);
  background: var(--card-bg);
}

.responses-modal__body {
  overflow-y: auto;
  padding: 20px 24px;
  background: var(--card-bg);
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-color);
}

.modal-subtitle {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.responses-summary,
.responses-filters,
.response-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.responses-summary,
.responses-filters {
  margin-bottom: 18px;
}

.summary-chip,
.filter-chip {
  border: var(--input-border);
  border-radius: 999px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.84rem;
}

.summary-chip {
  padding: 0.4rem 0.8rem;
}

.filter-chip {
  padding: 0.42rem 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.filter-chip:hover {
  opacity: 0.9;
}

.filter-chip--active {
  border-color: transparent;
  background: var(--btn-primary-gradient);
  color: #fff;
  box-shadow: 0 8px 18px rgba(74, 103, 230, 0.22);
}

.filter-chip--answered.filter-chip--active {
  background: var(--btn-success-gradient);
}

.filter-chip--unanswered.filter-chip--active {
  background: var(--btn-danger-gradient);
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.response-card {
  padding: 16px;
  border: var(--card-border);
  border-radius: 18px;
  background: var(--card-bg);
}

.response-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.response-card__name {
  color: var(--text-color);
  font-size: 0.98rem;
  font-weight: 700;
}

.response-card__meta,
.response-stats,
.response-slot__meta,
.response-empty {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.response-card__meta,
.response-slot__meta {
  margin-top: 4px;
}

.response-stats {
  margin-top: 12px;
  gap: 12px;
}

.response-details {
  margin-top: 14px;
  overflow: hidden;
  border: var(--card-border);
  border-radius: 14px;
  background: var(--input-bg);
}

.response-details__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  color: var(--text-color);
  font-weight: 600;
  cursor: pointer;
  list-style: none;
}

.response-details__summary::-webkit-details-marker {
  display: none;
}

.response-details__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  border-radius: 999px;
  background: var(--card-bg);
  font-size: 0.8rem;
  font-weight: 700;
}

.response-slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px 12px;
}

.response-slot {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--card-bg);
}

.response-slot__main {
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 600;
}

.response-empty {
  margin-top: 12px;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .shift-row {
    grid-template-columns: 1fr;
  }

  .page-header,
  .card-header,
  .section-header,
  .day-card__header,
  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>