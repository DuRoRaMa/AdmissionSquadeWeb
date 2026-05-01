<template>
  <AppCard class="needs-editor-card schedule-controls">
    <template #header>
      <div class="needs-header">
        <div>
          <h2>Потребности на день</h2>
          <p>
            {{ formattedDate }}. Потребности задаются по блокам работ только для выбранного дня.
          </p>
        </div>

        <AppButton
          type="button"
          variant="primary"
          :disabled="loading || saving || readonly || !workBlockOptions.length"
          @click="addNeedRow"
        >
          Добавить потребность
        </AppButton>
      </div>
    </template>

    <div v-if="loading" class="empty-state">
      Загрузка потребностей...
    </div>

    <div v-else-if="!workBlockOptions.length" class="empty-state">
      Для отряда ещё не добавлены блоки работ. Добавьте их в управлении отрядом, затем вернитесь к настройке графика.
    </div>

    <div v-else-if="!modelValue.length" class="empty-state">
      На выбранный день потребности не указаны. Добавьте потребность.
    </div>

    <div v-else class="needs-table-wrapper">
      <div class="needs-table">
        <div class="needs-table__head">
          <span>Блок работ</span>
          <span>Основная смена</span>
          <span>Дополнительная смена</span>
          <span>Количество</span>
          <span>Действия</span>
        </div>

        <div
          v-for="row in modelValue"
          :key="row.localId"
          class="needs-row"
        >
          <div class="needs-cell" data-label="Блок работ">
            <AppSelect
              :model-value="row.workBlock"
              :options="availableBlockOptions(row)"
              placeholder="Выберите блок"
              :disabled="loading || saving || readonly"
              @update:model-value="updateRow(row.localId, { workBlock: $event })"
            />
          </div>

          <div class="needs-cell checkbox-cell" data-label="Основная смена">
            <label class="checkbox-item" :class="{ disabled: loading || saving || readonly }">
              <input
                type="checkbox"
                :checked="row.primary"
                :disabled="loading || saving || readonly"
                @change="updateRow(row.localId, { primary: $event.target.checked })"
              />
              <span>Основная</span>
            </label>
          </div>

          <div class="needs-cell checkbox-cell" data-label="Дополнительная смена">
            <label class="checkbox-item" :class="{ disabled: loading || saving || readonly }">
              <input
                type="checkbox"
                :checked="row.extra"
                :disabled="loading || saving || readonly"
                @change="updateRow(row.localId, { extra: $event.target.checked })"
              />
              <span>Дополнительная</span>
            </label>
          </div>

          <div class="needs-cell" data-label="Количество">
            <AppInput
              :model-value="row.requiredPeople"
              type="number"
              min="1"
              placeholder="1"
              :disabled="loading || saving || readonly"
              @update:model-value="updateRow(row.localId, { requiredPeople: normalizePeopleCount($event) })"
            />
          </div>

          <div class="needs-cell actions-cell" data-label="Действия">
            <AppIconButton
              icon="trash"
              title="Удалить потребность"
              variant="danger"
              :disabled="loading || saving || readonly"
              @click="emit('remove', row)"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="needs-footer">
        <p v-if="readonly" class="footer-note">
          Опубликованный или архивный график доступен только для просмотра.
        </p>
        <p v-else class="footer-note">
          После изменения потребностей сохраните их, затем проверьте назначения участников на этот день.
        </p>

        <div class="footer-actions">
          <AppButton
            type="button"
            variant="danger"
            :disabled="loading || saving || readonly || !dirty"
            @click="emit('reset')"
          >
            Сбросить
          </AppButton>

          <AppButton
            type="button"
            variant="primary"
            :loading="saving"
            :disabled="loading || saving || readonly || !dirty"
            @click="emit('save')"
          >
            Сохранить потребности
          </AppButton>
        </div>
      </div>
    </template>
  </AppCard>
</template>

<script setup>
import { computed } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppIconButton from '@/components/ui/AppIconButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  date: {
    type: String,
    default: '',
  },
  workBlockOptions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  dirty: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'reset', 'remove'])

const formattedDate = computed(() => (props.date ? formatDate(props.date) : 'День не выбран'))

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

function normalizePeopleCount(value) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue < 1) return 1
  return Math.floor(numberValue)
}

function getUsedBlockIds(exceptRow) {
  return new Set(
    props.modelValue
      .filter((row) => row.localId !== exceptRow.localId && row.workBlock)
      .map((row) => String(row.workBlock)),
  )
}

function availableBlockOptions(row) {
  const usedBlockIds = getUsedBlockIds(row)

  return props.workBlockOptions.filter((option) => (
    String(option.value) === String(row.workBlock) || !usedBlockIds.has(String(option.value))
  ))
}

function updateRow(localId, patch) {
  emit(
    'update:modelValue',
    props.modelValue.map((row) => (
      row.localId === localId
        ? {
            ...row,
            ...patch,
          }
        : row
    )),
  )
}

function addNeedRow() {
  const usedBlockIds = new Set(
    props.modelValue
      .filter((row) => row.workBlock)
      .map((row) => String(row.workBlock)),
  )

  const firstFreeBlock = props.workBlockOptions.find((option) => !usedBlockIds.has(String(option.value)))

  emit('update:modelValue', [
    ...props.modelValue,
    {
      localId: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      workBlock: firstFreeBlock ? String(firstFreeBlock.value) : '',
      primary: true,
      extra: false,
      requiredPeople: 1,
    },
  ])
}
</script>

<style scoped>
.needs-header,
.needs-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.needs-header h2 {
  margin: 0;
  color: var(--text-color);
}

.needs-header p,
.footer-note {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  color: var(--text-muted);
  padding: 0.75rem 0;
}

.needs-table-wrapper {
  overflow-x: auto;
}

.needs-table {
  display: grid;
  min-width: 840px;
}

.needs-table__head,
.needs-row {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 160px 190px 130px 90px;
  gap: 0.75rem;
  align-items: center;
}

.needs-table__head {
  padding-bottom: 0.45rem;
  border-bottom: 1px solid var(--card-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.needs-row {
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--card-border);
}

.needs-row:last-child {
  border-bottom: 0;
}

.needs-cell {
  min-height: 36px;
  display: flex;
  align-items: center;
  min-width: 0;
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

.actions-cell {
  justify-content: flex-end;
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
  .needs-header,
  .needs-footer {
    flex-direction: column;
  }

  .footer-actions {
    justify-content: flex-start;
  }

  .needs-table {
    min-width: 0;
  }

  .needs-table__head {
    display: none;
  }

  .needs-row {
    grid-template-columns: 1fr;
    gap: 0.45rem;
    padding: 0.9rem 0;
  }

  .needs-cell {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr);
    gap: 0.75rem;
    align-items: center;
  }

  .needs-cell::before {
    content: attr(data-label);
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .actions-cell {
    justify-content: stretch;
  }
}
</style>
