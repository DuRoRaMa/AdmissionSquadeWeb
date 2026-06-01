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

const submittedSlots = computed(() => {
  return activeForm.value?.user_slots || []
})

const deadlineExpired = computed(() => {
  if (typeof activeForm.value?.deadline_expired === 'boolean') {
    return activeForm.value.deadline_expired
  }

  if (!activeForm.value?.response_deadline) {
    return false
  }

  const deadline = new Date(activeForm.value.response_deadline)

  if (Number.isNaN(deadline.getTime())) {
    return false
  }

  return new Date() > deadline
})

const canEdit = computed(() => {
  if (typeof activeForm.value?.can_edit === 'boolean') {
    return activeForm.value.can_edit
  }

  return activeForm.value?.status === 'open' && !deadlineExpired.value
})

const isReadonly = computed(() => {
  if (typeof activeForm.value?.is_readonly === 'boolean') {
    return activeForm.value.is_readonly
  }

  return !canEdit.value
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

const selectedCount = computed(() => {
  return Object.values(answers.value).filter((answer) => answer.is_available).length
})

const preparedSlots = computed(() => {
  return Object.entries(answers.value).map(([shiftId, answer]) => ({
    shift_id: Number(shiftId),
    is_available: Boolean(answer.is_available),
    preferred_work_block:
      answer.is_available && answer.preferred_work_block
        ? Number(answer.preferred_work_block)
        : null,
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
      }
    })
  })

  submittedSlots.value.forEach((slot) => {
    const shiftId = slot.shift?.id || slot.shift_id

    if (!shiftId) return

    initialAnswers[shiftId] = {
      is_available: Boolean(slot.is_available),
      preferred_work_block: getWorkBlockId(slot.preferred_work_block),
    }
  })

  answers.value = initialAnswers
}

function getWorkBlockId(workBlock) {
  if (!workBlock) return ''

  if (typeof workBlock === 'object') {
    return workBlock.id || ''
  }

  return workBlock
}

function getAnswer(shiftId) {
  if (!answers.value[shiftId]) {
    answers.value[shiftId] = {
      is_available: false,
      preferred_work_block: '',
    }
  }

  return answers.value[shiftId]
}

function setAnswer(shiftId, value) {
  if (!canEdit.value) return

  const answer = getAnswer(shiftId)

  answer.is_available = value

  if (!value) {
    answer.preferred_work_block = ''
  }
}

function setPreferredWorkBlock(shiftId, value) {
  if (!canEdit.value) return

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

function getSelectedWorkBlockLabel(shiftId) {
  const answer = getAnswer(shiftId)

  if (!answer.preferred_work_block) return ''

  const option = workBlockOptions.value.find((item) => {
    return Number(item.value) === Number(answer.preferred_work_block)
  })

  return option?.label || ''
}

function formatTime(value) {
  if (!value) return ''

  return String(value).slice(0, 5)
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateShort(value) {
  if (!value) return '—'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

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

  if (!activeForm.value || !canEdit.value) return

  const result = await availabilityStore.submitForm(
    activeForm.value.id,
    preparedSlots.value,
  )

  if (!result.success) {
    error.value = result.message || 'Не удалось отправить форму.'
    return
  }

  message.value = isSubmitted.value
    ? 'Изменения сохранены.'
    : result.message || 'Ответ принят.'

  const fetchResult = await availabilityStore.fetchActiveForm()

  if (fetchResult.success && availabilityStore.activeForm) {
    initAnswers()
  }
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>
        Моя доступность
      </template>

      <div v-if="availabilityStore.isLoading && !hasActiveForm" class="empty-state">
        <div class="empty-state__icon">
          ⏳
        </div>

        <h2>Загрузка формы</h2>

        <p>
          Проверяем, есть ли сейчас открытая форма доступности.
        </p>
      </div>

      <div v-else-if="!hasActiveForm" class="empty-state">
        <div class="empty-state__icon">
          📭
        </div>

        <h2>Открытой формы сейчас нет</h2>

        <p>
          На данный момент форма доступности не опубликована.
          Когда командир откроет новую форму, она появится на этой странице.
        </p>
      </div>

      <div v-else class="page-stack">
        <p class="page-description">
          Здесь можно указать, в какие дни и смены вы готовы выйти на работу.
          До дедлайна ответ можно изменить, после дедлайна он доступен только для просмотра.
        </p>

        <div class="form-info">
          <div>
            <h2>{{ activeForm.title }}</h2>

            <p v-if="activeForm.squad_name">
              Отряд: {{ activeForm.squad_name }}
            </p>
          </div>

          <div class="form-info__grid">
            <div>
              <span>Период работы</span>

              <strong>
                {{ formatDateShort(activeForm.period_start) }}
                —
                {{ formatDateShort(activeForm.period_end) }}
              </strong>
            </div>

            <div>
              <span>Заполнить до</span>

              <strong>
                {{ formatDateTime(activeForm.response_deadline) }}
              </strong>
            </div>

            <div>
              <span>Статус ответа</span>

              <strong>
                {{ isSubmitted ? 'Ответ отправлен' : 'Ответ еще не отправлен' }}
              </strong>
            </div>

            <div>
              <span>Режим</span>

              <strong>
                {{ canEdit ? 'Можно редактировать' : 'Только просмотр' }}
              </strong>
            </div>
          </div>
        </div>

        <div
          v-if="canChooseWorkBlock && canEdit"
          class="notice"
        >
          Для выбранных смен можно указать желаемый блок работы.
        </div>

        <div
          v-if="isReadonly && isSubmitted"
          class="notice"
        >
          Ответ сохранён. Изменения недоступны, так как форма закрыта или срок заполнения истёк.
        </div>

        <div
          v-if="error"
          class="notice notice--error"
        >
          {{ error }}
        </div>

        <div
          v-if="message"
          class="notice notice--success"
        >
          {{ message }}
        </div>

        <div
          v-if="isReadonly && !isSubmitted"
          class="empty-state"
        >
          <div class="empty-state__icon">
            ⏰
          </div>

          <h2>Форма больше недоступна для заполнения</h2>

          <p>
            Дедлайн уже прошёл или форма была закрыта командиром.
            Дождитесь следующей формы доступности.
          </p>
        </div>

        <form
          v-else
          class="page-stack"
          @submit.prevent="submit"
        >
          <div
            v-if="isSubmitted && canEdit"
            class="notice"
          >
            Вы уже отправляли ответ. До дедлайна можно изменить выбранные смены
            и сохранить обновлённый вариант.
          </div>

          <section
            v-for="day in activeForm.days"
            :key="day.id"
            class="day-block"
          >
            <h3>{{ formatDate(day.date) }}</h3>

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
                    :disabled="isReadonly"
                    @change="setAnswer(shift.id, $event.target.checked)"
                  />

                  <span>
                    <strong>{{ getShiftTitle(shift) }}</strong>

                    <small v-if="getShiftTime(shift)">
                      {{ getShiftTime(shift) }}
                    </small>
                  </span>
                </label>

                <div
                  v-if="canChooseWorkBlock && getAnswer(shift.id).is_available && canEdit"
                  class="work-block-select"
                >
                  <AppSelect
                    :model-value="getAnswer(shift.id).preferred_work_block || ''"
                    :options="workBlockOptions"
                    :disabled="isReadonly"
                    placeholder="Выберите блок работы"
                    @update:model-value="setPreferredWorkBlock(shift.id, $event)"
                  />
                </div>

                <div
                  v-if="isReadonly && getAnswer(shift.id).is_available && getSelectedWorkBlockLabel(shift.id)"
                  class="shift-detail"
                >
                  Блок работы: {{ getSelectedWorkBlockLabel(shift.id) }}
                </div>
              </article>
            </div>
          </section>

          <div
            v-if="canEdit"
            class="actions"
          >
            <span class="selected-count">
              Выбрано смен: <strong>{{ selectedCount }}</strong>
            </span>

            <AppButton
              type="submit"
              variant="primary"
              :loading="availabilityStore.isLoading"
              :disabled="availabilityStore.isLoading"
            >
              {{ isSubmitted ? 'Сохранить изменения' : 'Отправить доступность' }}
            </AppButton>
          </div>
        </form>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-description {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.empty-state {
  min-height: 260px;
  display: grid;
  place-items: center;
  gap: 12px;
  text-align: center;
  padding: 32px 16px;
  color: var(--text-muted);
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

.empty-state h2 {
  color: var(--text-color);
}

.empty-state__icon {
  font-size: 2rem;
}

.form-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
}

.form-info h2,
.form-info p {
  margin: 0;
}

.form-info p {
  margin-top: 4px;
  color: var(--text-muted);
}

.form-info__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.form-info__grid div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-info__grid span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.form-info__grid strong {
  color: var(--text-color);
}

.notice {
  padding: 12px 14px;
  border-radius: 12px;
  color: var(--text-color);
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
}

.notice--error {
  color: #991b1b;
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.24);
}

.notice--success {
  color: #166534;
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.24);
}

.day-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
}

.day-block h3 {
  margin: 0;
  color: var(--text-color);
  text-transform: capitalize;
}

.shift-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shift-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}

.shift-card--selected {
  border-color: var(--primary-color);
}

.shift-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: var(--text-color);
  cursor: pointer;
}

.shift-row input {
  margin-top: 3px;
}

.shift-row span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.shift-row small,
.shift-detail,
.selected-count {
  color: var(--text-muted);
}

.work-block-select {
  max-width: 360px;
  padding-left: 26px;
}

.shift-detail {
  padding-left: 26px;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

@media (max-width: 900px) {
  .form-info__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .form-info__grid {
    grid-template-columns: 1fr;
  }

  .actions {
    align-items: stretch;
    flex-direction: column;
  }

  .work-block-select,
  .shift-detail {
    max-width: none;
    padding-left: 0;
  }
}
</style>
