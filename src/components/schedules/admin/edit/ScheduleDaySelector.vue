<template>
  <AppCard class="day-selector-card schedule-controls">
    <template #header>
      <div class="card-heading">
        <div>
          <h2>День редактирования</h2>
          <p>Выберите день, для которого нужно посмотреть потребности и изменить назначения.</p>
        </div>
      </div>
    </template>

    <div class="selector-row">
      <div class="selector-field">
        <label class="field-label">День графика</label>
        <AppSelect
          :model-value="selectedDate"
          :options="dayOptions"
          placeholder="Выберите день"
          :disabled="disabled || loading || !dayOptions.length"
          @update:model-value="$emit('select', $event)"
        />
      </div>

      <div class="selector-info">
        <span v-if="selectedDate">Выбран день: {{ formatDate(selectedDate) }}</span>
        <span v-else>Дни графика не найдены.</span>
      </div>
    </div>
  </AppCard>
</template>

<script setup>
import { computed } from 'vue'

import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps({
  days: {
    type: Array,
    default: () => [],
  },
  selectedDate: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const dayOptions = computed(() => props.days.map((date) => ({
  value: String(date),
  label: `${formatDate(date)} · ${getWeekday(date)}`,
})))

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

function getWeekday(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(new Date(value))
}
</script>

<style scoped>
.card-heading h2 {
  margin: 0;
  color: var(--text-color);
}

.card-heading p {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}

.selector-row {
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 1rem;
  align-items: end;
}

.selector-field {
  display: grid;
  gap: 0.35rem;
}

.field-label {
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: 600;
}

.selector-info {
  min-height: 36px;
  display: flex;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.schedule-controls :deep(input),
.schedule-controls :deep(select),
.schedule-controls :deep(.app-select__trigger),
.schedule-controls :deep(.select-trigger) {
  min-height: 36px;
  height: 36px;
  font-size: 0.85rem;
}

.schedule-controls :deep(.app-select),
.schedule-controls :deep(.select-wrapper) {
  width: 100%;
  max-width: none;
}

@media (max-width: 768px) {
  .selector-row {
    grid-template-columns: 1fr;
  }
}
</style>
