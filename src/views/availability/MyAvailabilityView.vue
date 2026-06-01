<script setup>
import { computed, onMounted, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

import { useAvailabilityStore } from '@/stores/availability'

const availabilityStore = useAvailabilityStore()

const answers = ref({})
const message = ref('')
const error = ref('')

onMounted(async () => {
  const result = await availabilityStore.fetchActiveForm()

  if (result.success && availabilityStore.activeForm) {
    initAnswers()
  }
})

const activeForm = computed(() => availabilityStore.activeForm)

const hasActiveForm = computed(() => Boolean(activeForm.value))

const isSubmitted = computed(() => {
  return Boolean(activeForm.value?.is_submitted)
})

const workBlockOptions = computed(() => {
  const blocks = activeForm.value?.work_blocks || []

  return blocks.map((block) => ({
    value: block.id,
    label: block.name || block.code || `Блок ${block.id}`,
  }))
})

const canChooseWorkBlock = computed(() => {
  return Boolean(
    activeForm.value?.allow_work_block_choice &&
      workBlockOptions.value.length
  )
})

const preparedSlots = computed(() => {
  return Object.entries(answers.value).map(([shiftId, answer]) => ({
    shift_id: Number(shiftId),
    is_available: Boolean(answer.is_available),
    preferred_work_block:
      answer.is_available && answer.preferred_work_block
        ? Number(answer.preferred_work_block)
        : null,
    comment: answer.comment || '',
  }))
})

function initAnswers() {
  const form = activeForm.value
  const initialAnswers = {}

  form?.days?.forEach((day) => {
    day.shifts?.forEach((shift) => {
      initialAnswers[shift.id] = {
        is_available: false,
        preferred_work_block: '',
        comment: '',
      }
    })
  })

  answers.value = initialAnswers
}

function getAnswer(shiftId) {
  if (!answers.value[shiftId]) {
    answers.value[shiftId] = {
      is_available: false,
      preferred_work_block: '',
      comment: '',
    }
  }

  return answers.value[shiftId]
}

function setAnswer(shiftId, value) {
  const answer = getAnswer(shiftId)

  answer.is_available = value

  if (!value) {
    answer.preferred_work_block = ''
  }
}

function setPreferredWorkBlock(shiftId, value) {
  const answer = getAnswer(shiftId)

  answer.preferred_work_block = value || ''
}

function getShiftTitle(shift) {
  if (shift.title) return shift.title

  return shift.shift_kind === 'primary'
    ? 'Основная смена'
    : 'Дополнительная смена'
}

function getShiftTime(shift) {
  if (!shift.starts_at || !shift.ends_at) return ''

  return `${formatTime(shift.starts_at)} — ${formatTime(shift.ends_at)}`
}

function formatTime(value) {
  if (!value) return ''

  return String(value).slice(0, 5)
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function submit() {
  message.value = ''
  error.value = ''

  if (!activeForm.value || isSubmitted.value) return

  const result = await availabilityStore.submitForm(
    activeForm.value.id,
    preparedSlots.value,
  )

  if (result.success) {
    message.value = result.message || 'Ответ принят.'

    availabilityStore.activeForm = {
      ...availabilityStore.activeForm,
      is_submitted: true,
      submitted_at: new Date().toISOString(),
    }

    return
  }

  error.value = result.message || 'Не удалось отправить форму.'
}
</script>

<template>
  <div class="availability-page">
    <div class="page-header">
      <div>
        <p class="page-kicker">
          Доступность
        </p>

        <h1 class="page-title">
          Моя доступность
        </h1>

        <p class="page-subtitle">
          Здесь можно указать, в какие дни и смены вы готовы выйти на работу.
        </p>
      </div>
    </div>

    <AppCard>
      <div v-if="availabilityStore.isLoading" class="state-box">
        <div class="state-icon">
          ⏳
        </div>

        <h2>Загрузка формы</h2>

        <p>
          Проверяем, есть ли сейчас открытая форма доступности.
        </p>
      </div>

      <div v-else-if="!hasActiveForm" class="state-box">
        <div class="state-icon">
          📭
        </div>

        <h2>Открытой формы сейчас нет</h2>

        <p>
          На данный момент форма доступности не опубликована или уже закрыта по дедлайну.
          Когда командир откроет новую форму, она появится на этой странице.
        </p>
      </div>

      <div v-else-if="isSubmitted" class="state-box state-box--success">
        <div class="state-icon">
          ✅
        </div>

        <h2>Форма доступности заполнена</h2>

        <p>
          Ваш ответ сохранен. Ожидайте публикации графика.
        </p>

        <div class="submitted-details">
          <span v-if="activeForm?.submitted_at">
            Отправлено: {{ formatDateTime(activeForm.submitted_at) }}
          </span>

          <span v-if="activeForm?.response_deadline">
            Дедлайн формы: {{ formatDateTime(activeForm.response_deadline) }}
          </span>
        </div>
      </div>

      <div v-else class="availability-layout">
        <div class="form-summary">
          <div class="summary-main">
            <h2>{{ activeForm.title }}</h2>

            <p v-if="activeForm.squad_name">
              Отряд: {{ activeForm.squad_name }}
            </p>
          </div>

          <div class="summary-grid">
            <div class="summary-item">
              <span>Период работы</span>
              <strong>
                {{ formatDate(activeForm.period_start) }}
                —
                {{ formatDate(activeForm.period_end) }}
              </strong>
            </div>

            <div class="summary-item summary-item--deadline">
              <span>Заполнить до</span>
              <strong>
                {{ formatDateTime(activeForm.response_deadline) }}
              </strong>
            </div>
          </div>

          <div
            v-if="canChooseWorkBlock"
            class="work-block-hint"
          >
            Для выбранных смен можно указать желаемый блок работы.
          </div>
        </div>

        <div
          v-if="error"
          class="inline-message inline-message--error"
        >
          {{ error }}
        </div>

        <div
          v-if="message"
          class="inline-message inline-message--success"
        >
          {{ message }}
        </div>

        <div class="days-list">
          <section
            v-for="day in activeForm.days"
            :key="day.id"
            class="day-block"
          >
            <header class="day-header">
              <div>
                <span class="day-label">День</span>

                <h3>{{ formatDate(day.date) }}</h3>
              </div>
            </header>

            <div class="shift-list">
              <article
                v-for="shift in day.shifts"
                :key="shift.id"
                class="shift-card"
                :class="{ 'shift-card--selected': getAnswer(shift.id).is_available }"
              >
                <label class="shift-row">
                  <input
                    type="checkbox"
                    :checked="getAnswer(shift.id).is_available"
                    @change="setAnswer(shift.id, $event.target.checked)"
                  />

                  <span class="shift-info">
                    <span class="shift-title">
                      {{ getShiftTitle(shift) }}
                    </span>

                    <span
                      v-if="getShiftTime(shift)"
                      class="shift-time"
                    >
                      {{ getShiftTime(shift) }}
                    </span>
                  </span>
                </label>

                <div
                  v-if="canChooseWorkBlock && getAnswer(shift.id).is_available"
                  class="work-block-select"
                >
                  <span class="work-block-select__label">
                    Желаемый блок работы
                  </span>

                  <AppSelect
                    :model-value="getAnswer(shift.id).preferred_work_block || ''"
                    :options="workBlockOptions"
                    placeholder="Выберите блок работы"
                    @update:model-value="setPreferredWorkBlock(shift.id, $event)"
                  />
                </div>
              </article>
            </div>
          </section>
        </div>

        <div class="actions">
          <AppButton
            type="button"
            variant="primary"
            :loading="availabilityStore.isLoading"
            @click="submit"
          >
            Отправить доступность
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.availability-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.page-kicker {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-title {
  margin: 0;
  color: var(--text-color);
  font-size: clamp(1.7rem, 4vw, 2.4rem);
  line-height: 1.1;
}

.page-subtitle {
  margin: 10px 0 0;
  color: var(--text-muted);
  max-width: 640px;
  line-height: 1.5;
}

.availability-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.state-box {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 40px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px dashed rgba(148, 163, 184, 0.35);
}

.state-box h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.35rem;
}

.state-box p {
  margin: 0;
  color: var(--text-muted);
  max-width: 560px;
  line-height: 1.6;
}

.state-box--success {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.08);
}

.state-icon {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.08);
}

.submitted-details {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.form-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 22px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.12),
    rgba(118, 75, 162, 0.08)
  );
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.summary-main h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.35rem;
}

.summary-main p {
  margin: 6px 0 0;
  color: var(--text-muted);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.summary-item span {
  display: block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.summary-item strong {
  display: block;
  color: var(--text-color);
  line-height: 1.35;
}

.summary-item--deadline {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.08);
}

.work-block-hint {
  padding: 12px 14px;
  border-radius: 14px;
  color: var(--text-color);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.18);
  font-size: 0.95rem;
}

.inline-message {
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 600;
}

.inline-message--error {
  color: #991b1b;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.inline-message--success {
  color: #166534;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.days-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-block {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.day-label {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.day-header h3 {
  margin: 4px 0 0;
  color: var(--text-color);
  font-size: 1.1rem;
}

.shift-list {
  display: grid;
  gap: 10px;
}

.shift-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.045);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.shift-card:hover {
  transform: translateY(-1px);
}

.shift-card--selected {
  border-color: rgba(102, 126, 234, 0.45);
  background: rgba(102, 126, 234, 0.1);
}

.shift-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: var(--text-color);
  cursor: pointer;
}

.shift-row input {
  width: 17px;
  height: 17px;
  margin-top: 4px;
  flex-shrink: 0;
}

.shift-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shift-title {
  font-weight: 700;
}

.shift-time {
  color: var(--text-muted);
  font-size: 0.92rem;
}

.work-block-select {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-width: 360px;
  padding-left: 29px;
}

.work-block-select__label {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.actions {
  display: flex;
  justify-content: flex-start;
  padding-top: 4px;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .day-block {
    padding: 14px;
  }

  .work-block-select {
    max-width: 100%;
    padding-left: 0;
  }

  .actions {
    justify-content: stretch;
  }

  .actions :deep(.btn) {
    width: 100%;
  }
}
</style>
