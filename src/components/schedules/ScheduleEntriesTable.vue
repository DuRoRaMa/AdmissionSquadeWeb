<template>
  <AppCard class="schedules-table-card schedule-controls">
    <template #header>
      <div class="table-header">
        <div>
          <h2>Созданные графики</h2>
          <p>После генерации черновик можно открыть для редактирования и опубликовать.</p>
        </div>

        <AppButton
          type="button"
          variant="primary"
          :disabled="loading"
          @click="$emit('refresh')"
        >
          Обновить
        </AppButton>
      </div>
    </template>

    <div v-if="loading" class="table-state">
      Загрузка графиков...
    </div>

    <div v-else-if="!schedules.length" class="table-state">
      Графики пока не созданы.
    </div>

    <div v-else class="table-wrapper">
      <table class="schedules-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Отряд</th>
            <th>Форма доступности</th>
            <th>Период</th>
            <th>Статус</th>
            <th class="actions-column">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in schedules" :key="schedule.id">
            <td>
              <strong>{{ schedule.title }}</strong>
            </td>
            <td>{{ getSquadName(schedule.squad) }}</td>
            <td>{{ getAvailabilityFormTitle(schedule) }}</td>
            <td>{{ formatPeriod(schedule) }}</td>
            <td>
              <AppStatusBadge
                :text="getStatusLabel(schedule.status)"
                :variant="getStatusVariant(schedule.status)"
              />
            </td>
            <td>
              <div class="actions">
                <AppButton
                  v-if="canGenerate(schedule)"
                  type="button"
                  variant="primary"
                  :loading="String(generatingId) === String(schedule.id)"
                  :disabled="isAnyActionLoading"
                  @click="$emit('generate', schedule)"
                >
                  Сгенерировать
                </AppButton>

                <AppIconButton
                  v-if="canEdit(schedule)"
                  icon="edit"
                  variant="primary"
                  title="Редактировать график"
                  aria-label="Редактировать график"
                  :disabled="isAnyActionLoading"
                  @click="$emit('edit', schedule)"
                />

                <AppButton
                  v-if="canPublish(schedule)"
                  type="button"
                  variant="primary"
                  :loading="String(publishingId) === String(schedule.id)"
                  :disabled="isAnyActionLoading"
                  @click="$emit('publish', schedule)"
                >
                  Опубликовать
                </AppButton>

                <AppIconButton
                  icon="trash"
                  variant="danger"
                  title="Удалить график"
                  aria-label="Удалить график"
                  :loading="String(deletingId) === String(schedule.id)"
                  :disabled="isAnyActionLoading"
                  @click="$emit('delete', schedule)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppCard>
</template>

<script setup>
import { computed } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppIconButton from '@/components/ui/AppIconButton.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

const props = defineProps({
  schedules: {
    type: Array,
    default: () => [],
  },
  squads: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  generatingId: {
    type: [String, Number],
    default: null,
  },
  publishingId: {
    type: [String, Number],
    default: null,
  },
  deletingId: {
    type: [String, Number],
    default: null,
  },
})

defineEmits(['refresh', 'generate', 'publish', 'edit', 'delete'])

const statusLabels = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив',
}

const statusVariants = {
  draft: 'primary',
  published: 'success',
  archived: 'danger',
}

const isAnyActionLoading = computed(() => Boolean(
  props.generatingId || props.publishingId || props.deletingId,
))

function getEntityId(value) {
  if (value && typeof value === 'object') {
    return value.id
  }

  return value
}

function getEntityName(value) {
  if (value && typeof value === 'object') {
    return value.name || value.title || ''
  }

  return ''
}

function getSquadName(squad) {
  const squadName = getEntityName(squad)

  if (squadName) {
    return squadName
  }

  const squadId = getEntityId(squad)
  return props.squads.find((item) => String(item.id) === String(squadId))?.name || '—'
}

function getAvailabilityFormTitle(schedule) {
  if (schedule.availability_form_title) {
    return schedule.availability_form_title
  }

  if (schedule.availability_form?.title) {
    return schedule.availability_form.title
  }

  return '—'
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

function formatPeriod(schedule) {
  return `${formatDate(schedule.period_start)} — ${formatDate(schedule.period_end)}`
}

function getStatusLabel(status) {
  return statusLabels[status] || status || '—'
}

function getStatusVariant(status) {
  return statusVariants[status] || 'primary'
}

function hasEntries(schedule) {
  return Boolean(schedule.has_entries) || Number(schedule.entries_count || 0) > 0
}

function canGenerate(schedule) {
  return schedule.status === 'draft' && !hasEntries(schedule)
}

function canEdit(schedule) {
  return hasEntries(schedule)
}

function canPublish(schedule) {
  return schedule.status === 'draft' && hasEntries(schedule)
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
}

.table-state {
  padding: 1rem 0;
  color: var(--text-muted);
}

.table-wrapper {
  overflow-x: auto;
}

.schedules-table {
  width: 100%;
  border-collapse: collapse;
}

.schedules-table th,
.schedules-table td {
  padding: 0.75rem 0.6rem;
  border-bottom: 1px solid var(--card-border);
  vertical-align: middle;
  text-align: left;
  color: var(--text-color);
}

.schedules-table th {
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
}

.actions-column {
  text-align: right;
}

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.schedule-controls :deep(.btn),
.schedule-controls :deep(.app-icon-button) {
  min-height: 36px;
  height: 36px;
  font-size: 0.85rem;
}

.schedule-controls :deep(.btn) {
  padding: 0.4rem 0.8rem;
  box-shadow: none;
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>
