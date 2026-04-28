<script setup>
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  squadOptions: {
    type: Array,
    default: () => [],
  },
  availabilityFormOptions: {
    type: Array,
    default: () => [],
  },
  selectedAvailabilityForm: {
    type: Object,
    default: null,
  },
  needRows: {
    type: Array,
    default: () => [],
  },
  totalRequiredPeople: {
    type: Number,
    default: 0,
  },
  totalRequiredPeopleForPeriod: {
    type: Number,
    default: 0,
  },
  feedback: {
    type: Object,
    default: () => ({ type: '', text: '' }),
  },
})

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
</script>

<template>
  <AppCard>
    <template #header>
      <div class="card-header">
        <div>
          <div class="card-title">Новый график</div>
          <div class="card-subtitle">
            Создание графика на основе закрытой формы доступности: период берётся из формы,
            затем задаются потребности на каждый день периода.
          </div>
        </div>
      </div>
    </template>

    <div class="section-grid">
      <div class="field field--select">
        <label class="field-label">Отряд</label>

        <AppSelect
          v-model="props.form.squad"
          :options="squadOptions"
          placeholder="Выберите отряд"
        />
      </div>

      <div class="field field--select">
        <label class="field-label">Форма доступности</label>

        <AppSelect
          v-model="props.form.availability_form"
          :options="availabilityFormOptions"
          :disabled="!props.form.squad"
          placeholder="Выберите закрытую форму"
        />

        <div
          v-if="props.form.squad && !availabilityFormOptions.length"
          class="field-hint"
        >
          Для выбранного отряда нет закрытых форм доступности.
        </div>
      </div>

      <div class="field">
        <label class="field-label">Название графика</label>

        <input
          v-model="props.form.title"
          class="text-input"
          type="text"
          placeholder="Например: График на период работы приёмной комиссии"
        />
      </div>

      <div class="field">
        <label class="field-label">Период графика</label>

        <div class="readonly-field">
          {{
            selectedAvailabilityForm
              ? formatPeriod(
                  selectedAvailabilityForm.period_start,
                  selectedAvailabilityForm.period_end
                )
              : 'Выберите форму доступности'
          }}
        </div>
      </div>
    </div>

    <div class="summary-row">
      <div class="summary-chip">
        <span class="summary-label">Блоков потребности</span>
        <strong>{{ needRows.length }}</strong>
      </div>

      <div class="summary-chip">
        <span class="summary-label">Нужно людей в день</span>
        <strong>{{ totalRequiredPeople }}</strong>
      </div>

      <div class="summary-chip">
        <span class="summary-label">Всего назначений за период</span>
        <strong>{{ totalRequiredPeopleForPeriod }}</strong>
      </div>
    </div>

    <div
      v-if="feedback.text"
      :class="['feedback', `feedback--${feedback.type || 'info'}`]"
    >
      {{ feedback.text }}
    </div>
  </AppCard>
</template>

<style scoped>
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

.readonly-field {
  width: 100%;
  min-height: 46px;
  padding: 0.8rem 0.95rem;
  border: var(--input-border);
  border-radius: 14px;
  background: var(--input-bg);
  color: var(--text-color);
  display: flex;
  align-items: center;
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

.field-hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.35;
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

@media (max-width: 980px) {
  .section-grid {
    grid-template-columns: 1fr;
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
