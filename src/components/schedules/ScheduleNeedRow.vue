<script setup>
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps({
  row: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  selectedAvailabilityForm: {
    type: Object,
    default: null,
  },
  workBlockOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'remove',
  'toggle-new-work-block',
  'create-work-block',
])

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
  <div class="need-card">
    <div class="need-card__top">
      <div>
        <div class="need-card__title">
          Потребность #{{ index + 1 }}
        </div>

        <div class="need-card__subtitle">
          Применяется на весь период:
          {{
            selectedAvailabilityForm
              ? formatPeriod(
                  selectedAvailabilityForm.period_start,
                  selectedAvailabilityForm.period_end
                )
              : 'период не выбран'
          }}
        </div>
      </div>

      <button
        class="btn btn--ghost"
        type="button"
        @click="emit('remove', row.local_id)"
      >
        Удалить
      </button>
    </div>

    <div class="need-grid">
      <div class="field field--select need-grid__block">
        <div class="field-label-row">
          <label class="field-label">Блок работ</label>

          <button
            type="button"
            class="btn btn--ghost btn--sm"
            @click="emit('toggle-new-work-block', row)"
          >
            {{ row.new_block_open ? 'Отмена' : 'Новый блок' }}
          </button>
        </div>

        <AppSelect
          v-model="props.row.work_block"
          :options="workBlockOptions"
          placeholder="Выберите блок работ"
        />

        <div
          v-if="row.new_block_open"
          class="new-work-block"
        >
          <input
            v-model="props.row.new_block_code"
            class="text-input"
            type="text"
            placeholder="Код, например DOC"
          />

          <input
            v-model="props.row.new_block_name"
            class="text-input"
            type="text"
            placeholder="Название блока работ"
          />

          <button
            type="button"
            class="btn btn--primary"
            :disabled="row.is_creating_block"
            @click="emit('create-work-block', row)"
          >
            {{ row.is_creating_block ? 'Создание...' : 'Создать блок' }}
          </button>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Начало</label>

        <input
          v-model="props.row.starts_at"
          class="text-input"
          type="time"
        />
      </div>

      <div class="field">
        <label class="field-label">Окончание</label>

        <input
          v-model="props.row.ends_at"
          class="text-input"
          type="time"
        />
      </div>

      <div class="field">
        <label class="field-label">Сколько человек нужно каждый день</label>

        <input
          v-model="props.row.required_people"
          class="text-input"
          type="number"
          min="1"
          step="1"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.need-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  padding: 18px;
}

.need-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.need-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.need-card__subtitle {
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.need-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.need-grid__block {
  grid-column: 1 / -1;
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

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
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

.new-work-block {
  display: grid;
  grid-template-columns: minmax(120px, 0.4fr) minmax(180px, 1fr) auto;
  gap: 0.75rem;
  align-items: end;
  margin-top: 0.75rem;
  padding: 0.85rem;
  border: var(--input-border);
  border-radius: 14px;
  background: var(--input-bg);
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
  background: var(--input-bg);
}

.btn--sm {
  min-height: 34px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
}

@media (max-width: 980px) {
  .need-grid {
    grid-template-columns: 1fr;
  }

  .need-card__top {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .new-work-block {
    grid-template-columns: 1fr;
  }
}
</style>
