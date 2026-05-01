<template>
  <div class="assignment-row">
    <div class="assignment-cell member-cell" data-label="ФИО (ID)">
      <div>
        <strong>{{ row.memberName }} ({{ row.membership }})</strong>
        <span v-if="row.roleName">{{ row.roleName }}</span>
      </div>
    </div>

    <div class="assignment-cell checkbox-cell" data-label="Основная смена">
      <label class="checkbox-item" :class="{ disabled: disabled || !canUsePrimary }">
        <input
          type="checkbox"
          :checked="row.primary"
          :disabled="disabled || !canUsePrimary"
          @change="updateField('primary', $event.target.checked)"
        />
        <span>Основная</span>
      </label>
    </div>

    <div class="assignment-cell checkbox-cell" data-label="Дополнительная смена">
      <label class="checkbox-item" :class="{ disabled: disabled || !canUseExtra }">
        <input
          type="checkbox"
          :checked="row.extra"
          :disabled="disabled || !canUseExtra"
          @change="updateField('extra', $event.target.checked)"
        />
        <span>Дополнительная</span>
      </label>
    </div>

    <div class="assignment-cell" data-label="Блок работ">
      <AppSelect
        :model-value="row.workBlock"
        :options="workBlockOptions"
        placeholder="Выберите блок"
        :disabled="disabled"
        @update:model-value="handleWorkBlockChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps({
  row: {
    type: Object,
    required: true,
  },
  workBlockOptions: {
    type: Array,
    default: () => [],
  },
  availableShiftsByBlock: {
    type: Object,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update'])

const selectedBlockShifts = computed(() => {
  if (!props.row.workBlock) {
    return {
      primary: true,
      extra: true,
    }
  }

  return props.availableShiftsByBlock[String(props.row.workBlock)] || {
    primary: false,
    extra: false,
  }
})

const canUsePrimary = computed(() => selectedBlockShifts.value.primary)
const canUseExtra = computed(() => selectedBlockShifts.value.extra)

function updateField(field, value) {
  emit('update', {
    ...props.row,
    [field]: value,
  })
}

function handleWorkBlockChange(value) {
  const shifts = value
    ? props.availableShiftsByBlock[String(value)] || { primary: false, extra: false }
    : { primary: true, extra: true }

  emit('update', {
    ...props.row,
    workBlock: value,
    primary: shifts.primary ? props.row.primary : false,
    extra: shifts.extra ? props.row.extra : false,
  })
}
</script>

<style scoped>
.assignment-row {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) 150px 180px minmax(240px, 1fr);
  gap: 0.75rem;
  align-items: center;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--card-border);
}

.assignment-row:last-child {
  border-bottom: 0;
}

.assignment-cell {
  min-height: 36px;
  display: flex;
  align-items: center;
  min-width: 0;
}

.member-cell strong {
  display: block;
  color: var(--text-color);
  font-size: 0.9rem;
  line-height: 1.25;
}

.member-cell span {
  display: block;
  margin-top: 0.15rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.checkbox-cell {
  justify-content: flex-start;
}

.checkbox-item {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-color);
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.checkbox-item.disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}

.checkbox-item input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-color);
}

.assignment-row :deep(select),
.assignment-row :deep(.app-select__trigger),
.assignment-row :deep(.select-trigger) {
  min-height: 36px;
  height: 36px;
  font-size: 0.85rem;
}

.assignment-row :deep(.app-select),
.assignment-row :deep(.select-wrapper) {
  width: 100%;
  max-width: none;
}

@media (max-width: 900px) {
  .assignment-row {
    grid-template-columns: 1fr;
    gap: 0.45rem;
    padding: 0.9rem 0;
  }

  .assignment-cell {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr);
    gap: 0.75rem;
    align-items: center;
  }

  .assignment-cell::before {
    content: attr(data-label);
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 600;
  }
}
</style>
