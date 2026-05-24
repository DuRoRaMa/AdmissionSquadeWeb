<script setup>
import { computed, ref } from 'vue'

import AppButton from '../ui/AppButton.vue'
import AppIcon from '../ui/AppIcon.vue'
import AppIconButton from '../ui/AppIconButton.vue'
import AppInput from '../ui/AppInput.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  periodStart: {
    type: String,
    default: '',
  },
  periodEnd: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const newDate = ref('')
const error = ref('')

const sortedDays = computed(() => [...props.modelValue].sort((a, b) => a.date.localeCompare(b.date)))
const canEditDays = computed(() => Boolean(props.periodStart && props.periodEnd && props.periodEnd >= props.periodStart))

function addDay() {
  error.value = ''

  if (!canEditDays.value) {
    error.value = 'Сначала укажите корректный период работы.'
    return
  }

  if (!newDate.value) {
    error.value = 'Выберите дату.'
    return
  }

  if (newDate.value < props.periodStart || newDate.value > props.periodEnd) {
    error.value = 'Дата должна входить в выбранный период работы.'
    return
  }

  if (props.modelValue.some((day) => day.date === newDate.value)) {
    error.value = 'Эта дата уже добавлена.'
    return
  }

  emit('update:modelValue', [
    ...props.modelValue,
    {
      date: newDate.value,
      primary: true,
      extra: false,
    },
  ])

  newDate.value = ''
}

function updateDay(date, patch) {
  const nextDays = props.modelValue.map((day) => {
    if (day.date !== date) return day

    return {
      ...day,
      ...patch,
    }
  })

  emit('update:modelValue', nextDays)
}

function removeDay(date) {
  emit('update:modelValue', props.modelValue.filter((day) => day.date !== date))
}

function formatDate(value) {
  if (!value) return '—'

  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}
</script>

<template>
  <section class="availability-days-editor">
    <div class="availability-days-editor__header">
      <div>
        <h3>Дни работы</h3>
        <p>
          Дни строятся по периоду работы. Можно удалить лишний день или добавить его обратно.
        </p>
      </div>

      <div class="availability-days-editor__add">
        <AppInput
          v-model="newDate"
          type="date"
          :disabled="!canEditDays"
          aria-label="Дата для добавления"
        />

        <AppButton
          type="button"
          variant="primary"
          :disabled="!canEditDays"
          @click="addDay"
        >
          <AppIcon name="plus" size="16" />
          Добавить день
        </AppButton>
      </div>
    </div>

    <p v-if="error" class="availability-days-editor__error">
      {{ error }}
    </p>

    <div v-if="sortedDays.length" class="availability-days-editor__list">
      <div class="availability-days-editor__row availability-days-editor__row--head">
        <span>Дата</span>
        <span>Основная смена</span>
        <span>Дополнительная смена</span>
        <span></span>
      </div>

      <div
        v-for="day in sortedDays"
        :key="day.date"
        class="availability-days-editor__row"
      >
        <div class="availability-days-editor__date">
          <AppIcon name="calendar" size="16" />
          <strong>{{ formatDate(day.date) }}</strong>
        </div>

        <label class="availability-days-editor__checkbox">
          <input
            type="checkbox"
            :checked="day.primary"
            @change="updateDay(day.date, { primary: $event.target.checked })"
          />
          <span>09:00–18:00</span>
        </label>

        <label class="availability-days-editor__checkbox">
          <input
            type="checkbox"
            :checked="day.extra"
            @change="updateDay(day.date, { extra: $event.target.checked })"
          />
          <span>18:00–21:00</span>
        </label>

        <AppIconButton
          icon="trash"
          title="Удалить день"
          variant="danger"
          @click="removeDay(day.date)"
        />
      </div>
    </div>

    <p v-else class="availability-days-editor__empty">
      Укажите период работы, чтобы список дней сформировался автоматически.
    </p>
  </section>
</template>

<style scoped>
.availability-days-editor {
  --availability-control-height: 36px;
  display: grid;
  gap: 14px;
  padding-top: 4px;
}

.availability-days-editor__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.availability-days-editor__header h3 {
  margin: 0;
  color: var(--text-color);
}

.availability-days-editor__header p,
.availability-days-editor__empty {
  margin: 4px 0 0;
  color: var(--text-muted);
}

.availability-days-editor__add {
  display: grid;
  grid-template-columns: 170px 170px;
  align-items: start;
  gap: 10px;
}

.availability-days-editor__error {
  margin: 0;
  color: var(--input-error-color, #dc3545);
  font-weight: 600;
}

.availability-days-editor__list {
  display: grid;
  border-top: 1px solid var(--card-border);
}

.availability-days-editor__row {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) minmax(180px, 1fr) minmax(220px, 1fr) 36px;
  align-items: center;
  gap: 14px;
  min-height: 48px;
  padding: 8px 0;
  border-bottom: 1px solid var(--card-border);
}

.availability-days-editor__row--head {
  min-height: 36px;
  color: var(--text-muted);
  font-weight: 700;
}

.availability-days-editor__date,
.availability-days-editor__checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
}

.availability-days-editor__checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-color, #0d6efd);
}

.availability-days-editor :deep(.mb-3) {
  margin-bottom: 0 !important;
}

.availability-days-editor :deep(.form-control),
.availability-days-editor :deep(.btn) {
  min-height: var(--availability-control-height);
  height: var(--availability-control-height);
  font-size: 0.85rem;
}

.availability-days-editor :deep(.form-control) {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}

.availability-days-editor :deep(.btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}

@media (max-width: 992px) {
  .availability-days-editor__header {
    flex-direction: column;
    align-items: stretch;
  }

  .availability-days-editor__add,
  .availability-days-editor__row,
  .availability-days-editor__row--head {
    grid-template-columns: 1fr;
  }

  .availability-days-editor__row--head {
    display: none;
  }
}
</style>