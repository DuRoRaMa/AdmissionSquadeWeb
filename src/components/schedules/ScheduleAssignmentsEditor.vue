<template>
  <AppCard class="assignments-card schedule-controls">
    <template #header>
      <div class="table-header">
        <div>
          <h2>Редактирование назначений</h2>
          <p>
            В списке показаны все участники отряда. Если участник не заполнял доступность, его всё равно можно назначить вручную.
          </p>
        </div>

        <div class="header-actions">
          <AppButton
            type="button"
            variant="primary"
            :disabled="loading || saving || readonly || !dirty"
            @click="$emit('reset')"
          >
            Сбросить
          </AppButton>

          <AppButton
            type="button"
            variant="primary"
            :loading="saving"
            :disabled="loading || saving || readonly || !dirty"
            @click="$emit('save')"
          >
            Сохранить
          </AppButton>
        </div>
      </div>
    </template>

    <div class="filters-row">
      <AppInput
        v-model="searchQuery"
        placeholder="Поиск по ФИО или ID"
        :disabled="loading || saving"
      />

      <p v-if="readonly" class="readonly-note">
        {{ readonlyMessage || 'Редактирование назначений сейчас недоступно.' }}
      </p>
    </div>

    <div v-if="loading" class="table-state">
      Загрузка назначений...
    </div>

    <div v-else-if="!modelValue.length" class="table-state">
      Участники не найдены.
    </div>

    <div v-else class="assignments-table-wrapper">
      <div class="assignments-table">
        <div class="assignments-table__head">
          <span>ФИО (ID)</span>
          <span>Основная смена</span>
          <span>Дополнительная смена</span>
          <span>Блок работ</span>
        </div>

        <ScheduleMemberAssignmentRow
          v-for="row in filteredRows"
          :key="row.membership"
          :row="row"
          :work-block-options="workBlockOptions"
          :available-shifts-by-block="availableShiftsByBlock"
          :disabled="loading || saving || readonly"
          @update="updateRow(row.membership, $event)"
        />
      </div>
    </div>
  </AppCard>
</template>

<script setup>
import { computed, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import ScheduleMemberAssignmentRow from '@/components/schedules/ScheduleMemberAssignmentRow.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  needs: {
    type: Array,
    default: () => [],
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
  readonlyMessage: {
    type: String,
    default: '',
  },
  dirty: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'reset'])

const searchQuery = ref('')

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return [...props.modelValue]
    .sort((a, b) => a.memberName.localeCompare(b.memberName))
    .filter((row) => {
      if (!query) {
        return true
      }

      return `${row.memberName} ${row.membership} ${row.userId || ''}`.toLowerCase().includes(query)
    })
})

const availableShiftsByBlock = computed(() => {
  const grouped = new Map()

  props.needs.forEach((need) => {
    const blockId = getNeedBlockId(need)

    if (!blockId) {
      return
    }

    if (!grouped.has(blockId)) {
      grouped.set(blockId, [])
    }

    grouped.get(blockId).push(need)
  })

  const result = {}

  grouped.forEach((items, blockId) => {
    const sortedItems = [...items].sort((a, b) => (
      normalizeTime(a.starts_at).localeCompare(normalizeTime(b.starts_at))
    ))

    result[blockId] = {
      primary: false,
      extra: false,
    }

    sortedItems.forEach((need, index) => {
      const kind = getNeedShiftKind(need, index)
      result[blockId][kind] = true
    })
  })

  return result
})

function getEntityId(value) {
  if (value && typeof value === 'object') {
    return value.id
  }

  return value
}

function getNeedBlockId(need) {
  return String(
    getEntityId(need.work_block)
      || need.work_block_id
      || need.workBlock
      || need.work_block
      || '',
  )
}

function normalizeTime(value) {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 5)
}

function getNeedShiftKind(need, index = 0) {
  const rawKind = need.shift_kind || need.shiftKind || need.kind

  if (rawKind === 'primary' || rawKind === 'extra') {
    return rawKind
  }

  const startsAt = normalizeTime(need.starts_at)
  const endsAt = normalizeTime(need.ends_at)

  if (startsAt >= '18:00' || endsAt > '18:00') {
    return 'extra'
  }

  return index === 0 ? 'primary' : 'extra'
}

function updateRow(membership, nextRow) {
  emit(
    'update:modelValue',
    props.modelValue.map((row) => (
      String(row.membership) === String(membership) ? nextRow : row
    )),
  )
}
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.table-header h2 {
  margin: 0;
  color: var(--text-color);
}

.table-header p {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
  max-width: 820px;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filters-row {
  display: grid;
  grid-template-columns: minmax(240px, 360px) minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.9rem;
}

.readonly-note {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.table-state {
  padding: 0.75rem 0;
  color: var(--text-muted);
}

.assignments-table-wrapper {
  overflow-x: auto;
}

.assignments-table {
  display: grid;
  min-width: 860px;
}

.assignments-table__head {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) 150px 180px minmax(240px, 1fr);
  gap: 0.75rem;
  align-items: center;
  padding: 0 0 0.45rem;
  border-bottom: 1px solid var(--card-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
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
  .table-header,
  .filters-row {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .assignments-table__head {
    display: none;
  }

  .assignments-table {
    min-width: 0;
  }
}
</style>
