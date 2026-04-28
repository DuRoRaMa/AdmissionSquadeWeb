<script setup>
import AppCard from '@/components/ui/AppCard.vue'
import ScheduleNeedRow from '@/components/schedules/ScheduleNeedRow.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  selectedAvailabilityForm: {
    type: Object,
    default: null,
  },
  needRows: {
    type: Array,
    default: () => [],
  },
  workBlockOptions: {
    type: Array,
    default: () => [],
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'add-need',
  'remove-need',
  'toggle-new-work-block',
  'create-work-block',
  'submit',
])
</script>

<template>
  <AppCard>
    <template #header>
      <div class="card-header card-header--actions">
        <div>
          <div class="card-title">Потребности графика</div>
          <div class="card-subtitle">
            Каждая строка потребности применяется ко всем дням выбранного периода.
            Например, если указать 20 человек, то каждый день периода будет создана
            потребность на 20 человек для выбранного блока работ.
          </div>
        </div>

        <button
          class="btn btn--primary"
          :disabled="!props.form.availability_form"
          type="button"
          @click="emit('add-need')"
        >
          Добавить потребность
        </button>
      </div>
    </template>

    <div
      v-if="!props.form.availability_form"
      class="empty-state"
    >
      Сначала выберите закрытую форму доступности, затем добавляйте потребности.
    </div>

    <div
      v-else-if="!needRows.length"
      class="empty-state"
    >
      Пока нет ни одной потребности. Нажмите «Добавить потребность».
    </div>

    <div
      v-else
      class="needs-list"
    >
      <ScheduleNeedRow
        v-for="(row, index) in needRows"
        :key="row.local_id"
        :row="row"
        :index="index"
        :selected-availability-form="selectedAvailabilityForm"
        :work-block-options="workBlockOptions"
        @remove="emit('remove-need', $event)"
        @toggle-new-work-block="emit('toggle-new-work-block', $event)"
        @create-work-block="emit('create-work-block', $event)"
      />
    </div>

    <div class="actions-row">
      <button
        class="btn btn--primary"
        :disabled="isSubmitting || isLoading"
        type="button"
        @click="emit('submit')"
      >
        {{ isSubmitting ? 'Сохранение...' : 'Создать график' }}
      </button>
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

.card-header--actions {
  align-items: center;
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

.empty-state {
  padding: 22px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  text-align: center;
}

.needs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
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

@media (max-width: 980px) {
  .card-header,
  .card-header--actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions-row {
    justify-content: stretch;
  }

  .actions-row .btn,
  .card-header--actions .btn {
    width: 100%;
  }
}
</style>
