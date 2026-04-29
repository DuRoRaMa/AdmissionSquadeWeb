<template>
  <section class="needs-editor schedule-controls">
    <div class="needs-header">
      <div>
        <h3>Потребности</h3>
        <p>
          Потребность задаётся на весь период работы выбранной формы. При создании графика она будет применена к каждому дню формы.
        </p>
      </div>

      <AppButton
        type="button"
        variant="primary"
        :disabled="disabled || !availabilityForm"
        @click="addNeed"
      >
        Добавить блок
      </AppButton>
    </div>

    <div v-if="!availabilityForm" class="empty-state">
      Сначала выберите закрытую форму доступности.
    </div>

    <div v-else-if="!modelValue.length" class="empty-state">
      Потребности не добавлены.
    </div>

    <div v-else class="needs-table">
      <div class="needs-table__head">
        <span>Блок работ</span>
        <span>Основная смена</span>
        <span>Дополнительная смена</span>
        <span>Количество людей</span>
        <span></span>
      </div>

      <ScheduleNeedRow
        v-for="row in modelValue"
        :key="row.localId"
        :row="row"
        :work-block-options="workBlockOptions"
        :has-primary-shift="hasPrimaryShift"
        :has-extra-shift="hasExtraShift"
        :disabled="disabled"
        @update="updateNeed(row.localId, $event)"
        @remove="removeNeed(row.localId)"
      />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import ScheduleNeedRow from '@/components/schedules/ScheduleNeedRow.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  availabilityForm: {
    type: Object,
    default: null,
  },
  workBlocks: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const days = computed(() => [...(props.availabilityForm?.days || [])])

const hasPrimaryShift = computed(() => hasShiftKind('primary'))
const hasExtraShift = computed(() => hasShiftKind('extra'))

const workBlockOptions = computed(() => props.workBlocks.map((block) => ({
  value: String(block.id),
  label: block.code ? `${block.code} · ${block.name}` : block.name,
})))

function hasShiftKind(kind) {
  return days.value.some((day) => (
    day.shifts || []
  ).some((shift) => shift.shift_kind === kind && shift.is_active !== false))
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createNeedRow() {
  return {
    localId: createLocalId(),
    workBlock: '',
    primary: hasPrimaryShift.value,
    extra: false,
    requiredPeople: 1,
  }
}

function addNeed() {
  emit('update:modelValue', [...props.modelValue, createNeedRow()])
}

function updateNeed(localId, nextRow) {
  emit(
    'update:modelValue',
    props.modelValue.map((item) => (item.localId === localId ? nextRow : item)),
  )
}

function removeNeed(localId) {
  emit('update:modelValue', props.modelValue.filter((item) => item.localId !== localId))
}
</script>

<style scoped>
.needs-editor {
  display: grid;
  gap: 0.9rem;
}

.needs-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.needs-header h3 {
  margin: 0;
  color: var(--text-color);
}

.needs-header p {
  margin: 0.3rem 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.needs-table {
  display: grid;
  gap: 0;
  overflow-x: auto;
}

.needs-table__head {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 160px 190px 150px 40px;
  gap: 0.75rem;
  align-items: center;
  padding: 0 0 0.45rem;
  border-bottom: 1px solid var(--card-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.empty-state {
  color: var(--text-muted);
  border: 1px dashed var(--card-border);
  border-radius: 0.9rem;
  padding: 0.9rem;
}

.schedule-controls :deep(.btn),
.schedule-controls :deep(input),
.schedule-controls :deep(select),
.schedule-controls :deep(.app-select__trigger),
.schedule-controls :deep(.select-trigger) {
  min-height: 36px;
  height: 36px;
  font-size: 0.85rem;
}

.schedule-controls :deep(.btn) {
  padding: 0.4rem 0.8rem;
  box-shadow: none;
}

.schedule-controls :deep(.app-select),
.schedule-controls :deep(.select-wrapper) {
  width: 100%;
  max-width: none;
}

@media (max-width: 900px) {
  .needs-header {
    flex-direction: column;
  }

  .needs-table__head {
    display: none;
  }
}
</style>
