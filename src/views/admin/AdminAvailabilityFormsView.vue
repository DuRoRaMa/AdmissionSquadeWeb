<template>
  <section class="page-shell">
    <div class="page-header">
      <div>
        <h1 class="page-title">Формы доступности</h1>
        <p class="page-subtitle">
          Создавай формы, открывай и закрывай сбор, а также просматривай ответы участников.
        </p>
      </div>

      <button class="btn btn--primary" @click="openCreateModal">
        Создать форму
      </button>
    </div>

    <div v-if="loading" class="state-card">
      Загружаем формы...
    </div>

    <div v-else-if="error" class="feedback feedback--error">
      {{ error }}
    </div>

    <div v-else-if="!forms.length" class="state-card">
      Форм пока нет.
    </div>

    <div v-else class="table-card">
      <div class="table-scroll">
        <table class="forms-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Отряд</th>
              <th>Период</th>
              <th>Дедлайн</th>
              <th>Статус</th>
              <th class="actions-col">Действия</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in forms" :key="item.id">
              <td>
                <div class="primary-cell">
                  <div class="primary-title">{{ item.title }}</div>
                  <div class="primary-subtitle">
                    Создана: {{ formatDateTimeSafe(item.created_at) }}
                  </div>
                </div>
              </td>

              <td>
                {{ getSquadName(item) }}
              </td>

              <td>
                {{ formatDateSafe(item.period_start) }} — {{ formatDateSafe(item.period_end) }}
              </td>

              <td>
                {{ formatDateTimeSafe(item.response_deadline) }}
              </td>

              <td>
                <span
                  :class="[
                    'status-pill',
                    item.status === 'open'
                      ? 'status-pill--open'
                      : item.status === 'closed'
                        ? 'status-pill--closed'
                        : 'status-pill--draft'
                  ]"
                >
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>

              <td class="actions-col">
                <div class="row-actions">
                  <button class="btn btn--ghost" @click="openResponses(item)">
                    Ответы
                  </button>

                  <button
                    class="btn btn--ghost"
                    :disabled="item.status === 'open' || actionLoadingId === item.id"
                    @click="openForm(item.id)"
                  >
                    Открыть
                  </button>

                  <button
                    class="btn btn--ghost"
                    :disabled="item.status === 'closed' || actionLoadingId === item.id"
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
    </div>

    <!-- Модалка создания формы -->
    <Teleport to="body">
      <div
        v-if="createModalOpen"
        class="modal-overlay"
        @click.self="closeCreateModal"
      >
        <div class="modal-card">
          <div class="modal-card__header">
            <div>
              <div class="modal-title">Создание формы доступности</div>
              <div class="modal-subtitle">
                Заполни основные данные формы.
              </div>
            </div>

            <button class="btn btn--ghost" @click="closeCreateModal">
              Закрыть
            </button>
          </div>

          <div class="modal-card__body">
            <div v-if="createError" class="feedback feedback--error">
              {{ createError }}
            </div>

            <div class="form-grid">
              <label class="field">
                <span class="field__label">Название</span>
                <input
                  v-model="createForm.title"
                  class="field__input"
                  type="text"
                  placeholder="Например, Доступность на 1–7 июля"
                />
              </label>

              <label class="field">
                <span class="field__label">Отряд</span>
                <select v-model="createForm.squad" class="field__input">
                  <option value="">Выбери отряд</option>
                  <option
                    v-for="squad in squadOptions"
                    :key="squad.id"
                    :value="squad.id"
                  >
                    {{ squad.name }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span class="field__label">Начало периода</span>
                <input
                  v-model="createForm.period_start"
                  class="field__input"
                  type="date"
                />
              </label>

              <label class="field">
                <span class="field__label">Конец периода</span>
                <input
                  v-model="createForm.period_end"
                  class="field__input"
                  type="date"
                />
              </label>

              <label class="field field--full">
                <span class="field__label">Дедлайн ответа</span>
                <input
                  v-model="createForm.response_deadline"
                  class="field__input"
                  type="datetime-local"
                />
              </label>
            </div>
          </div>

          <div class="modal-card__footer">
            <button class="btn btn--ghost" @click="closeCreateModal">
              Отмена
            </button>
            <button
              class="btn btn--primary"
              :disabled="createLoading"
              @click="submitCreate"
            >
              {{ createLoading ? 'Создание...' : 'Создать форму' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Модалка ответов -->
    <Teleport to="body">
      <div
        v-if="responsesModalOpen"
        class="modal-overlay"
        @click.self="closeResponsesModal"
      >
        <div class="responses-modal">
          <div class="responses-modal__header">
            <div>
              <div class="modal-title">Ответы на форму</div>
              <div class="modal-subtitle">
                {{ selectedResponsesForm?.title || '—' }}
              </div>
            </div>

            <button class="btn btn--ghost" @click="closeResponsesModal">
              Закрыть
            </button>
          </div>

          <div class="responses-modal__body">
            <div class="responses-summary" v-if="selectedResponsesForm">
              <div class="summary-chip">
                Период: {{ formatDateSafe(selectedResponsesForm.period_start) }} — {{ formatDateSafe(selectedResponsesForm.period_end) }}
              </div>
              <div class="summary-chip">
                Дедлайн: {{ formatDateTimeSafe(selectedResponsesForm.response_deadline) }}
              </div>
            </div>
            <div
              v-if="!responsesLoading && !responsesError && formResponses.length"
              class="responses-filters"
            >
              <button
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip--active': responsesFilter === 'all' }"
                @click="responsesFilter = 'all'"
              >
                Все
              </button>

              <button
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip--active': responsesFilter === 'answered' }"
                @click="responsesFilter = 'answered'"
              >
                Ответили
              </button>

              <button
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip--active': responsesFilter === 'unanswered' }"
                @click="responsesFilter = 'unanswered'"
              >
                Не ответили
              </button>
            </div>
            <div v-if="responsesLoading" class="state-card">
              Загружаем ответы...
            </div>

            <div v-else-if="responsesError" class="feedback feedback--error">
              {{ responsesError }}
            </div>

            <div v-else-if="!formResponses.length" class="state-card">
              Нет участников для отображения.
            </div>

            <div v-else class="responses-list">
              <div
                v-for="member in filteredResponses"
                :key="member.membership_id"
                class="response-card"
              >
                <div class="response-card__top">
                  <div>
                    <div class="response-card__name">{{ member.full_name }}</div>
                    <div class="response-card__meta">
                      {{ member.role_name || 'Без роли' }}
                    </div>
                  </div>

                  <span
                    :class="[
                      'status-pill',
                      member.has_response ? 'status-pill--open' : 'status-pill--draft',
                    ]"
                  >
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
                    <span class="response-details__count">
                      {{ member.slots.length }}
                    </span>
                  </summary>

                  <div class="response-slots">
                    <div
                      v-for="slot in member.slots"
                      :key="`${member.membership_id}-${slot.shift_id}`"
                      class="response-slot"
                    >
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

                <div v-else class="response-empty">
                  Ответов по сменам нет.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import apiClient from '@/axios'

const loading = ref(false)
const error = ref('')
const forms = ref([])
const squads = ref([])
const actionLoadingId = ref(null)

const createModalOpen = ref(false)
const createLoading = ref(false)
const createError = ref('')
const createForm = ref({
  title: '',
  squad: '',
  period_start: '',
  period_end: '',
  response_deadline: '',
})

const responsesModalOpen = ref(false)
const responsesLoading = ref(false)
const responsesError = ref('')
const selectedResponsesForm = ref(null)
const formResponses = ref([])

const responsesFilter = ref('all')
const squadOptions = computed(() => squads.value)

function getStatusLabel(status) {
  switch (status) {
    case 'draft':
      return 'Черновик'
    case 'open':
      return 'Открыта'
    case 'closed':
      return 'Закрыта'
    default:
      return status || '—'
  }
}

const filteredResponses = computed(() => {
  const items = Array.isArray(formResponses.value) ? [...formResponses.value] : []

  const sorted = items.sort((a, b) => {
    if (a.has_response !== b.has_response) {
      return a.has_response ? -1 : 1
    }

    return String(a.full_name || '').localeCompare(String(b.full_name || ''), 'ru')
  })

  if (responsesFilter.value === 'answered') {
    return sorted.filter((item) => item.has_response)
  }

  if (responsesFilter.value === 'unanswered') {
    return sorted.filter((item) => !item.has_response)
  }

  return sorted
})

function getSquadName(item) {
  return item?.squad_detail?.name || item?.squad_name || item?.squad || '—'
}

function formatDateSafe(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ru-RU')
}

function formatShortDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })
}

function formatDateTimeSafe(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('ru-RU')
}

function formatTimeSafe(value) {
  if (!value) return '—'
  return String(value).slice(0, 5)
}

function normalizeList(data) {
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data)) return data
  return []
}

async function fetchForms() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await apiClient.get('/api/v1/rosters/forms/')
    forms.value = normalizeList(data)
  } catch (err) {
    error.value =
      err.response?.data?.detail || 'Не удалось загрузить формы доступности'
  } finally {
    loading.value = false
  }
}

async function fetchSquads() {
  try {
    const { data } = await apiClient.get('/api/v1/squads/')
    squads.value = normalizeList(data)
  } catch {
    squads.value = []
  }
}

function resetCreateForm() {
  createForm.value = {
    title: '',
    squad: '',
    period_start: '',
    period_end: '',
    response_deadline: '',
  }
  createError.value = ''
}

function openCreateModal() {
  resetCreateForm()
  createModalOpen.value = true
}

function closeCreateModal() {
  createModalOpen.value = false
}

async function submitCreate() {
  createLoading.value = true
  createError.value = ''

  try {
    await apiClient.post('/api/v1/rosters/forms/', {
      title: createForm.value.title,
      squad: createForm.value.squad,
      period_start: createForm.value.period_start,
      period_end: createForm.value.period_end,
      response_deadline: createForm.value.response_deadline || null,
    })

    closeCreateModal()
    await fetchForms()
  } catch (err) {
    createError.value =
      err.response?.data?.detail ||
      err.response?.data?.non_field_errors?.[0] ||
      'Не удалось создать форму'
  } finally {
    createLoading.value = false
  }
}

async function openForm(id) {
  actionLoadingId.value = id
  try {
    await apiClient.post(`/api/v1/rosters/forms/${id}/open/`)
    await fetchForms()
  } catch (err) {
    error.value =
      err.response?.data?.detail || 'Не удалось открыть форму'
  } finally {
    actionLoadingId.value = null
  }
}

async function closeForm(id) {
  actionLoadingId.value = id
  try {
    await apiClient.post(`/api/v1/rosters/forms/${id}/close/`)
    await fetchForms()
  } catch (err) {
    error.value =
      err.response?.data?.detail || 'Не удалось закрыть форму'
  } finally {
    actionLoadingId.value = null
  }
}

async function openResponses(formItem) {
  responsesModalOpen.value = true
  responsesLoading.value = true
  responsesError.value = ''
  selectedResponsesForm.value = formItem
  formResponses.value = []

  try {
    const { data } = await apiClient.get(`/api/v1/rosters/forms/${formItem.id}/responses/`)
    formResponses.value = Array.isArray(data?.members) ? data.members : []
  } catch (err) {
    responsesError.value =
      err.response?.data?.detail || 'Не удалось загрузить ответы на форму'
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

onMounted(async () => {
  await Promise.all([fetchForms(), fetchSquads()])
})
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-color);
}

.page-subtitle {
  margin: 8px 0 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.table-card,
.state-card {
  border: 1px solid var(--card-border);
  border-radius: 24px;
  background: var(--card-bg, #fff);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.state-card {
  padding: 20px 24px;
  color: var(--text-muted);
}

.table-scroll {
  overflow-x: auto;
}

.forms-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.forms-table th,
.forms-table td {
  padding: 16px 18px;
  text-align: left;
  border-bottom: 1px solid var(--card-border);
  vertical-align: top;
}

.forms-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  background: rgba(148, 163, 184, 0.06);
}

.actions-col {
  width: 260px;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-title {
  font-weight: 700;
  color: var(--text-color);
}

.primary-subtitle {
  color: var(--text-muted);
  font-size: 0.84rem;
}

.row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.62rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s ease;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--btn-primary-gradient, linear-gradient(135deg, #4f46e5, #2563eb));
  color: #fff;
}

.btn--ghost {
  background: rgba(148, 163, 184, 0.09);
  color: var(--text-color);
  border-color: rgba(148, 163, 184, 0.16);
}

.btn--ghost:hover:not(:disabled),
.btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.3rem 0.72rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-pill--draft {
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-muted);
}

.status-pill--open {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.status-pill--closed {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.feedback {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid transparent;
}

.feedback--error {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.18);
  color: #b91c1c;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal-card {
  width: min(760px, 100%);
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-card__header,
.modal-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--card-border);
}

.modal-card__footer {
  border-bottom: none;
  border-top: 1px solid var(--card-border);
  justify-content: flex-end;
}

.modal-card__body {
  padding: 20px 24px;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--full {
  grid-column: 1 / -1;
}

.field__label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-color);
}

.field__input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--card-border);
  background: rgba(148, 163, 184, 0.06);
  padding: 0.78rem 0.92rem;
  color: var(--text-color);
}

.responses-modal {
  width: min(980px, 100%);
  max-height: 88vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--card-bg-solid, #ffffff);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
}

.responses-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--card-border);
  background: rgba(148, 163, 184, 0.06);
}

.responses-modal__body {
  padding: 20px 24px;
  overflow-y: auto;
  background: var(--card-bg-solid, #ffffff);
}

.responses-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.summary-chip {
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  background: rgba(79, 70, 229, 0.08);
  border: 1px solid rgba(79, 70, 229, 0.16);
  color: var(--text-color);
  font-size: 0.84rem;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.response-card {
  border: 1px solid var(--card-border);
  border-radius: 18px;
  padding: 16px;
  background: var(--card-bg-solid, #ffffff);
}

.responses-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.filter-chip {
  border: 1px solid var(--card-border);
  background: rgba(148, 163, 184, 0.08);
  color: var(--text-color);
  border-radius: 999px;
  padding: 0.42rem 0.85rem;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.filter-chip:hover {
  background: rgba(148, 163, 184, 0.14);
}

.filter-chip--active {
  background: rgba(79, 70, 229, 0.1);
  border-color: rgba(79, 70, 229, 0.24);
  color: var(--text-color);
}

.response-details {
  margin-top: 14px;
  border: 1px solid var(--card-border);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.06);
}

.response-details__summary {
  list-style: none;
  cursor: pointer;
  padding: 12px 14px;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  background: rgba(79, 70, 229, 0.1);
  font-size: 0.8rem;
  font-weight: 700;
}

.response-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.response-card__name {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text-color);
}

.response-card__meta {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.response-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 0.88rem;
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
  background: #f8fafc;
}

.response-slot__main {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.response-slot__meta {
  margin-top: 4px;
  font-size: 0.84rem;
  color: var(--text-muted);
}

.response-empty {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .responses-modal,
  .modal-card {
    width: 100%;
    max-height: 92vh;
  }
}
</style>