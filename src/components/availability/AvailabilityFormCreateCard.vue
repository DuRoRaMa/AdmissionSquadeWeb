<script setup>
import { computed, reactive, ref, watch } from 'vue'

import AppButton from '../ui/AppButton.vue'
import AppCard from '../ui/AppCard.vue'
import AppInput from '../ui/AppInput.vue'
import AppSelect from '../ui/AppSelect.vue'
import AvailabilityDaysEditor from './AvailabilityDaysEditor.vue'

const SHIFT_PRESETS = {
  primary: {
    shift_kind: 'primary',
    title: 'Основная смена',
    starts_at: '09:00',
    ends_at: '18:00',
    is_active: true,
  },
  extra: {
    shift_kind: 'extra',
    title: 'Дополнительная смена',
    starts_at: '18:00',
    ends_at: '21:00',
    is_active: true,
  },
}

const props = defineProps({
  squads: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
})

const emit = defineEmits(['create'])

const error = ref('')

const form = reactive({
  title: '',
  squad: '',
  period_start: '',
  period_end: '',
  response_deadline: '',
  days: [],
})

const squadOptions = computed(() => props.squads.map((squad) => ({
  value: squad.id,
  label: squad.name,
})))

watch(
  () => [form.period_start, form.period_end],
  () => {
    syncDaysWithPeriod()
  },
)

function syncDaysWithPeriod() {
  error.value = ''

  if (!form.period_start || !form.period_end) {
    form.days = []
    return
  }

  if (form.period_end < form.period_start) {
    form.days = []
    error.value = 'Дата окончания периода не может быть раньше даты начала.'
    return
  }

  const existingDaysByDate = new Map(form.days.map((day) => [day.date, day]))
  const dates = getDatesBetween(form.period_start, form.period_end)

  form.days = dates.map((date) => {
    const existingDay = existingDaysByDate.get(date)

    return {
      date,
      primary: existingDay?.primary ?? true,
      extra: existingDay?.extra ?? false,
    }
  })
}

function submit() {
  error.value = ''

  if (!form.title.trim()) {
    error.value = 'Введите название формы.'
    return
  }

  if (!form.squad) {
    error.value = 'Выберите отряд.'
    return
  }

  if (!form.period_start || !form.period_end) {
    error.value = 'Укажите дату начала и дату окончания периода работы.'
    return
  }

  if (form.period_end < form.period_start) {
    error.value = 'Дата окончания периода не может быть раньше даты начала.'
    return
  }

  const validDays = form.days
    .filter((day) => day.date && (day.primary || day.extra))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!validDays.length) {
    error.value = 'В периоде должен остаться хотя бы один день с выбранной сменой.'
    return
  }

  emit('create', {
    title: form.title.trim(),
    squad: form.squad,
    period_start: form.period_start,
    period_end: form.period_end,
    response_deadline: form.response_deadline || null,
    days: validDays.map((day) => ({
      date: day.date,
      shifts: buildDayShifts(day),
    })),
  })

  resetForm()
}

function buildDayShifts(day) {
  const shifts = []

  if (day.primary) shifts.push({ ...SHIFT_PRESETS.primary })
  if (day.extra) shifts.push({ ...SHIFT_PRESETS.extra })

  return shifts
}

function getDatesBetween(startDate, endDate) {
  const dates = []
  const current = parseDate(startDate)
  const end = parseDate(endDate)

  while (current <= end) {
    dates.push(formatDateValue(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function resetForm() {
  form.title = ''
  form.squad = ''
  form.period_start = ''
  form.period_end = ''
  form.response_deadline = ''
  form.days = []
}
</script>

<template>
  <AppCard class="availability-create-card">
    <template #header>
      Создание формы доступности
    </template>

    <form class="availability-create-form" @submit.prevent="submit">
      <p v-if="error" class="availability-create-form__error">
        {{ error }}
      </p>

      <div class="availability-create-form__grid availability-create-form__grid--main">
        <AppInput
          v-model="form.title"
          label="Название формы"
          placeholder="Например: Доступность на май"
          required
        />

        <div class="availability-create-form__field">
          <label>Отряд <span>*</span></label>
          <AppSelect
            v-model="form.squad"
            :options="squadOptions"
            placeholder="Выберите отряд"
          />
        </div>

        <AppInput
          v-model="form.response_deadline"
          label="Дедлайн ответов"
          type="datetime-local"
        />
      </div>

      <div class="availability-create-form__grid availability-create-form__grid--period">
        <AppInput
          v-model="form.period_start"
          label="Дата начала периода работы"
          type="date"
          required
        />

        <AppInput
          v-model="form.period_end"
          label="Дата окончания периода работы"
          type="date"
          required
        />
      </div>

      <AvailabilityDaysEditor
        v-model="form.days"
        :period-start="form.period_start"
        :period-end="form.period_end"
      />

      <div class="availability-create-form__actions">
        <AppButton type="submit" variant="primary" :loading="loading">
          Создать форму
        </AppButton>
      </div>
    </form>
  </AppCard>
</template>

<style scoped>
.availability-create-card {
  --availability-control-height: 36px;
}

.availability-create-form {
  display: grid;
  gap: 18px;
}

.availability-create-form__grid {
  display: grid;
  gap: 14px;
}

.availability-create-form__grid--main {
  grid-template-columns: 2fr 1fr 1fr;
}

.availability-create-form__grid--period {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.availability-create-form__field {
  display: grid;
  gap: 8px;
  align-content: start;
}

.availability-create-form__field label {
  color: var(--label-color);
  font-size: var(--label-font-size);
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.availability-create-form__field span {
  color: var(--input-error-color, #dc3545);
}

.availability-create-form__error {
  margin: 0;
  color: var(--input-error-color, #dc3545);
  font-weight: 600;
}

.availability-create-form__actions {
  display: flex;
  justify-content: flex-end;
}

.availability-create-card :deep(.mb-3) {
  margin-bottom: 0 !important;
}

.availability-create-card :deep(.custom-select) {
  max-width: none;
}

.availability-create-card :deep(.form-control),
.availability-create-card :deep(.select-trigger),
.availability-create-card :deep(.btn) {
  min-height: var(--availability-control-height);
  height: var(--availability-control-height);
  font-size: 0.85rem;
}

.availability-create-card :deep(.form-control) {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}

.availability-create-card :deep(.btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}

@media (max-width: 992px) {
  .availability-create-form__grid--main,
  .availability-create-form__grid--period {
    grid-template-columns: 1fr;
  }
}
</style>
