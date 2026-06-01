<script setup>
import { computed, onMounted, ref } from 'vue'

import AppCard from '@/components/ui/AppCard.vue'
import { useAvailabilityStore } from '@/stores/availability'

const availabilityStore = useAvailabilityStore()

const answers = ref({})
const submittedSlots = ref([])
const submitMessage = ref('')
const errorMessage = ref('')

const activeForm = computed(() => availabilityStore.activeForm)

const canChooseWorkBlock = computed(() => Boolean(activeForm.value?.allow_work_block_choice))

const workBlocks = computed(() => activeForm.value?.work_blocks || [])

const allShiftItems = computed(() => {
  return (activeForm.value?.days || []).flatMap((day) => {
    return (day.shifts || []).map((shift) => ({
      ...shift,
      date: day.date,
      dayId: day.id,
    }))
  })
})

const isSubmitted = computed(() => submittedSlots.value.length > 0)

const selectedCount = computed(() => {
  return allShiftItems.value.filter((shift) => getAnswer(shift.id).is_available).length
})

const totalShiftsCount = computed(() => allShiftItems.value.length)

const preparedSlots = computed(() => {
  return allShiftItems.value.map((shift) => {
    const answer = getAnswer(shift.id)

    return {
      shift_id: Number(shift.id),
      is_available: Boolean(answer.is_available),
      preferred_work_block:
        canChooseWorkBlock.value && answer.is_available
          ? answer.preferred_work_block
          : null,
      comment: '',
    }
  })
})

const submittedDays = computed(() => {
  const slotsByShiftId = new Map(
    submittedSlots.value.map((slot) => [String(slot.shift_id), slot]),
  )

  return (activeForm.value?.days || []).map((day) => ({
    ...day,
    shifts: (day.shifts || []).map((shift) => ({
      ...shift,
      result: slotsByShiftId.get(String(shift.id)) || null,
    })),
  }))
})

onMounted(async () => {
  await availabilityStore.fetchActiveForm()
  hydrateSavedResponse()
})

function hydrateSavedResponse() {
  const savedSlots = extractSavedSlots(activeForm.value)

  if (!savedSlots.length) return

  submittedSlots.value = savedSlots.map(normalizeSavedSlot)

  for (const slot of submittedSlots.value) {
    answers.value[slot.shift_id] = {
      is_available: slot.is_available,
      preferred_work_block: slot.preferred_work_block,
    }
  }
}

function extractSavedSlots(form) {
  if (!form) return []

  const candidates = [
    form.my_response?.slots,
    form.current_user_response?.slots,
    form.user_response?.slots,
    form.response?.slots,
    form.my_slots,
    form.current_user_slots,
    form.submitted_slots,
  ]

  return candidates.find((value) => Array.isArray(value)) || []
}

function normalizeSavedSlot(slot) {
  const preferredBlock = getPreferredWorkBlockId(slot)

  return {
    ...slot,
    shift_id: Number(slot.shift_id || slot.shift?.id || slot.id),
    is_available: normalizeBoolean(slot.is_available ?? slot.available ?? slot.isAvailable),
    preferred_work_block: preferredBlock,
    preferred_work_block_name: getPreferredWorkBlockName(slot, preferredBlock),
  }
}

function getAnswer(shiftId) {
  if (!answers.value[shiftId]) {
    answers.value[shiftId] = {
      is_available: false,
      preferred_work_block: null,
    }
  }

  return answers.value[shiftId]
}

function setAnswer(shiftId, value) {
  if (isSubmitted.value) return

  const answer = getAnswer(shiftId)
  answer.is_available = value

  if (!value) {
    answer.preferred_work_block = null
  }
}

function toggleShift(shiftId) {
  const answer = getAnswer(shiftId)
  setAnswer(shiftId, !answer.is_available)
}

function setPreferredWorkBlock(shiftId, value) {
  if (isSubmitted.value) return

  const answer = getAnswer(shiftId)
  answer.preferred_work_block = value ? Number(value) : null
}

async function submit() {
  if (!activeForm.value || isSubmitted.value) return

  errorMessage.value = ''
  submitMessage.value = ''

  const result = await availabilityStore.submitForm(
    activeForm.value.id,
    preparedSlots.value,
  )

  if (!result.success) {
    errorMessage.value = result.message || 'Не удалось отправить форму.'
    return
  }

  submittedSlots.value = preparedSlots.value.map((slot) => ({
    ...slot,
    preferred_work_block_name: getWorkBlockNameById(slot.preferred_work_block),
  }))

  submitMessage.value = result.message || 'Ответ сохранён.'
}

function getShiftLabel(shift) {
  return shift.title || getShiftKindLabel(shift.shift_kind)
}

function getShiftKindLabel(value) {
  const labels = {
    primary: 'Основная смена',
    extra: 'Дополнительная смена',
  }

  return labels[value] || 'Смена'
}

function getShiftTime(shift) {
  const start = formatTime(shift.starts_at)
  const end = formatTime(shift.ends_at)

  if (!start && !end) return ''

  return `${start || '—'}–${end || '—'}`
}

function getPreferredWorkBlockId(slot) {
  const value =
    slot.preferred_work_block ||
    slot.preferred_work_block_id ||
    slot.work_block ||
    slot.work_block_id ||
    slot.preferredWorkBlock

  if (!value || typeof value === 'object') return value?.id || null

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function getPreferredWorkBlockName(slot, blockId = null) {
  return (
    slot.preferred_work_block_name ||
    slot.work_block_name ||
    slot.preferred_work_block?.name ||
    slot.work_block?.name ||
    getWorkBlockNameById(blockId) ||
    ''
  )
}

function getWorkBlockNameById(id) {
  if (!id) return ''

  const block = workBlocks.value.find((item) => String(item.id) === String(id))
  return block?.name || ''
}

function getResultForShift(shift) {
  const result = shift.result

  if (!result) {
    return {
      text: 'Не указано',
      className: 'result-badge--muted',
      blockName: '',
    }
  }

  if (!result.is_available) {
    return {
      text: 'Не могу выйти',
      className: 'result-badge--danger',
      blockName: '',
    }
  }

  const blockName = getPreferredWorkBlockName(result, result.preferred_work_block)

  return {
    text: 'Могу выйти',
    className: 'result-badge--success',
    blockName: blockName || 'Блок не выбран',
  }
}

function normalizeBoolean(value) {
  if (value === true || value === false) return value

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()

    if (['true', '1', 'yes', 'available', 'доступен', 'доступна'].includes(normalizedValue)) {
      return true
    }

    if (['false', '0', 'no', 'unavailable', 'недоступен', 'недоступна'].includes(normalizedValue)) {
      return false
    }
  }

  if (typeof value === 'number') return value === 1

  return false
}

function formatDate(value) {
  if (!value) return '—'

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}.${month}.${year}`
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU')
}

function formatTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Моя доступность</template>

      <div v-if="availabilityStore.isLoading" class="muted-state">
        Загрузка формы...
      </div>

      <div v-else-if="!activeForm" class="empty-state">
        <div class="empty-state__icon">📭</div>
        <h3>Нет открытой формы</h3>
        <p>Сейчас нет формы доступности, которую нужно заполнить.</p>
      </div>

      <div v-else class="availability-layout">
        <section class="hero-card" :class="{ 'hero-card--submitted': isSubmitted }">
          <div>
            <p class="hero-card__eyebrow">
              {{ isSubmitted ? 'Ответ уже отправлен' : 'Форма доступности' }}
            </p>
            <h2>{{ activeForm.title }}</h2>
            <p>
              Период работы: {{ formatDate(activeForm.period_start) }} — {{ formatDate(activeForm.period_end) }}
            </p>
          </div>

          <div class="hero-card__stats">
            <div>
              <strong>{{ selectedCount }}</strong>
              <span>выбрано</span>
            </div>
            <div>
              <strong>{{ totalShiftsCount }}</strong>
              <span>смен всего</span>
            </div>
          </div>
        </section>

        <p v-if="canChooseWorkBlock && !isSubmitted" class="info-banner">
          Для выбранных смен можно указать предпочитаемый блок работы. Если предпочтения нет, оставь поле «Без предпочтения».
        </p>

        <p v-if="submitMessage" class="success-banner">
          {{ submitMessage }} Теперь форма доступна только для просмотра.
        </p>

        <p v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </p>

        <template v-if="!isSubmitted">
          <section
            v-for="day in activeForm.days"
            :key="day.id || day.date"
            class="day-card"
          >
            <div class="day-card__header">
              <div>
                <span class="day-card__label">День</span>
                <h3>{{ formatDate(day.date) }}</h3>
              </div>
              <span class="day-card__count">
                {{ (day.shifts || []).filter((shift) => getAnswer(shift.id).is_available).length }} / {{ (day.shifts || []).length }}
              </span>
            </div>

            <div class="shift-grid">
              <article
                v-for="shift in day.shifts"
                :key="shift.id"
                class="shift-card"
                :class="{ 'shift-card--selected': getAnswer(shift.id).is_available }"
              >
                <button
                  type="button"
                  class="shift-card__main"
                  @click="toggleShift(shift.id)"
                >
                  <span class="shift-card__check">
                    {{ getAnswer(shift.id).is_available ? '✓' : '+' }}
                  </span>

                  <span class="shift-card__content">
                    <strong>{{ getShiftLabel(shift) }}</strong>
                    <small v-if="getShiftTime(shift)">{{ getShiftTime(shift) }}</small>
                  </span>
                </button>

                <div
                  v-if="canChooseWorkBlock && getAnswer(shift.id).is_available"
                  class="work-block-choice"
                >
                  <label :for="`work-block-${shift.id}`">Блок работы</label>
                  <select
                    :id="`work-block-${shift.id}`"
                    :value="getAnswer(shift.id).preferred_work_block || ''"
                    @change="setPreferredWorkBlock(shift.id, $event.target.value)"
                  >
                    <option value="">Без предпочтения</option>
                    <option
                      v-for="block in workBlocks"
                      :key="block.id"
                      :value="block.id"
                    >
                      {{ block.name }}
                    </option>
                  </select>
                </div>
              </article>
            </div>
          </section>

          <div class="form-actions">
            <button
              class="submit-btn"
              type="button"
              :disabled="availabilityStore.isLoading"
              @click="submit"
            >
              {{ availabilityStore.isLoading ? 'Отправка...' : 'Сохранить доступность' }}
            </button>
          </div>
        </template>

        <template v-else>
          <section class="result-card">
            <div class="result-card__header">
              <div>
                <p class="result-card__eyebrow">Результат заполнения</p>
                <h3>Твой ответ сохранён</h3>
              </div>
              <span class="result-card__lock">Редактирование закрыто</span>
            </div>

            <div
              v-for="day in submittedDays"
              :key="day.id || day.date"
              class="result-day"
            >
              <h4>{{ formatDate(day.date) }}</h4>

              <div class="result-shifts">
                <div
                  v-for="shift in day.shifts"
                  :key="shift.id"
                  class="result-shift"
                >
                  <div>
                    <strong>{{ getShiftLabel(shift) }}</strong>
                    <span v-if="getShiftTime(shift)">{{ getShiftTime(shift) }}</span>
                  </div>

                  <div class="result-shift__meta">
                    <span
                      class="result-badge"
                      :class="getResultForShift(shift).className"
                    >
                      {{ getResultForShift(shift).text }}
                    </span>
                    <span
                      v-if="canChooseWorkBlock && getResultForShift(shift).blockName"
                      class="result-block"
                    >
                      {{ getResultForShift(shift).blockName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>
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

.availability-layout {
  display: grid;
  gap: 18px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 22px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(13, 110, 253, 0.18), transparent 34%),
    rgba(255, 255, 255, 0.04);
  border: var(--card-border);
}

.hero-card--submitted {
  background:
    radial-gradient(circle at top left, rgba(25, 135, 84, 0.18), transparent 34%),
    rgba(255, 255, 255, 0.04);
}

.hero-card__eyebrow,
.result-card__eyebrow,
.day-card__label {
  margin: 0 0 6px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-card h2,
.result-card h3,
.day-card h3 {
  margin: 0;
  color: var(--text-color);
}

.hero-card p {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.hero-card__stats {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.hero-card__stats div {
  min-width: 96px;
  display: grid;
  place-items: center;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-card__stats strong {
  color: var(--text-color);
  font-size: 1.6rem;
  line-height: 1;
}

.hero-card__stats span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.info-banner,
.success-banner,
.error-banner {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  font-weight: 500;
}

.info-banner {
  color: var(--text-muted);
  background: rgba(13, 110, 253, 0.08);
  border: 1px solid rgba(13, 110, 253, 0.18);
}

.success-banner {
  color: #75d19b;
  background: rgba(25, 135, 84, 0.1);
  border: 1px solid rgba(25, 135, 84, 0.22);
}

.error-banner {
  color: #ff8a8a;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.22);
}

.day-card,
.result-card {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: var(--card-border);
}

.day-card__header,
.result-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.day-card__count,
.result-card__lock {
  padding: 6px 10px;
  border-radius: 999px;
  color: var(--text-color);
  background: rgba(255, 255, 255, 0.06);
  font-size: 0.82rem;
  font-weight: 700;
}

.shift-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.shift-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.shift-card--selected {
  background: rgba(25, 135, 84, 0.1);
  border-color: rgba(25, 135, 84, 0.35);
}

.shift-card__main {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-color);
  text-align: left;
  cursor: pointer;
}

.shift-card__check {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 800;
}

.shift-card--selected .shift-card__check {
  background: rgba(25, 135, 84, 0.3);
}

.shift-card__content {
  display: grid;
  gap: 2px;
}

.shift-card__content small,
.result-shift span {
  color: var(--text-muted);
}

.work-block-choice {
  display: grid;
  gap: 6px;
}

.work-block-choice label {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.work-block-choice select {
  width: 100%;
  min-height: 38px;
  border-radius: 12px;
  border: var(--input-border, 1px solid rgba(255, 255, 255, 0.16));
  background: var(--input-bg, rgba(255, 255, 255, 0.04));
  color: var(--text-color);
  padding: 0 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  background: var(--accent-gradient, linear-gradient(135deg, #0d6efd, #6f42c1));
  color: white;
  font-weight: 700;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.result-day {
  display: grid;
  gap: 10px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.result-day h4 {
  margin: 0;
  color: var(--text-color);
}

.result-shifts {
  display: grid;
  gap: 8px;
}

.result-shift {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
}

.result-shift > div:first-child {
  display: grid;
  gap: 2px;
}

.result-shift__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.result-badge,
.result-block {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.result-badge--success {
  color: #75d19b;
  background: rgba(25, 135, 84, 0.14);
}

.result-badge--danger {
  color: #ff8a8a;
  background: rgba(220, 53, 69, 0.14);
}

.result-badge--muted,
.result-block {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.06);
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--text-muted);
  text-align: center;
}

.empty-state h3 {
  margin: 0;
  color: var(--text-color);
}

.empty-state p {
  margin: 0;
}

.empty-state__icon {
  font-size: 2rem;
}

.muted-state {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .hero-card,
  .result-shift {
    flex-direction: column;
  }

  .hero-card__stats {
    width: 100%;
  }

  .hero-card__stats div {
    flex: 1;
  }

  .form-actions {
    justify-content: stretch;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
