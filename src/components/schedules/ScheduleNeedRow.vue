<template>
  <div class="need-row">
    <div class="need-cell need-cell--block" data-label="Блок работ">
      <AppSelect
        :model-value="row.workBlock"
        :options="workBlockOptions"
        placeholder="Выберите блок"
        :disabled="disabled"
        required
        @update:model-value="updateField('workBlock', $event)"
      />
    </div>

    <div class="need-cell need-cell--center" data-label="Основная смена">
      <label class="checkbox-item" :class="{ disabled: disabled || !hasPrimaryShift }">
        <input
          type="checkbox"
          :checked="row.primary"
          :disabled="disabled || !hasPrimaryShift"
          @change="updateField('primary', $event.target.checked)"
        />
        <span>Основная</span>
      </label>
    </div>

    <div class="need-cell need-cell--center" data-label="Дополнительная смена">
      <label class="checkbox-item" :class="{ disabled: disabled || !hasExtraShift }">
        <input
          type="checkbox"
          :checked="row.extra"
          :disabled="disabled || !hasExtraShift"
          @change="updateField('extra', $event.target.checked)"
        />
        <span>Дополнительная</span>
      </label>
    </div>

    <div class="need-cell" data-label="Количество людей">
      <AppInput
        :model-value="row.requiredPeople"
        type="number"
        min="1"
        :disabled="disabled"
        required
        @update:model-value="updateField('requiredPeople', $event)"
      />
    </div>

    <div class="need-cell need-cell--action">
      <AppIconButton
        icon="trash"
        variant="danger"
        title="Удалить потребность"
        aria-label="Удалить потребность"
        :disabled="disabled"
        @click="$emit('remove')"
      />
    </div>
  </div>
</template>

<script setup>
import AppIconButton from '@/components/ui/AppIconButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
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
  hasPrimaryShift: {
    type: Boolean,
    default: true,
  },
  hasExtraShift: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update', 'remove'])

function updateField(field, value) {
  emit('update', {
    ...props.row,
    [field]: value,
  })
}
</script>

<style scoped>
.need-row {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 160px 190px 150px 40px;
  gap: 0.75rem;
  align-items: center;
  min-width: 820px;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--card-border);
}

.need-row:last-child {
  border-bottom: 0;
}

.need-cell {
  min-height: 36px;
  display: flex;
  align-items: center;
}

.need-cell--block {
  min-width: 0;
}

.need-cell--center {
  justify-content: flex-start;
}

.need-cell--action {
  justify-content: flex-end;
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

.need-row :deep(input),
.need-row :deep(select),
.need-row :deep(.app-select__trigger),
.need-row :deep(.select-trigger) {
  min-height: 36px;
  height: 36px;
  font-size: 0.85rem;
}

.need-row :deep(.app-select),
.need-row :deep(.select-wrapper) {
  width: 100%;
  max-width: none;
}

@media (max-width: 900px) {
  .need-row {
    min-width: 0;
    grid-template-columns: 1fr;
    gap: 0.45rem;
    padding: 0.9rem 0;
  }

  .need-cell {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 0.75rem;
    align-items: center;
  }

  .need-cell::before {
    content: attr(data-label);
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .need-cell--action {
    display: flex;
    justify-content: flex-start;
  }

  .need-cell--action::before {
    content: '';
    display: none;
  }
}
</style>
