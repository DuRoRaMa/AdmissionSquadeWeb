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
  isLoading: {
    type: Boolean,
    default: false,
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
  downloadingId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits([
  'refresh',
  'generate',
  'publish',
  'download',
  'edit',
  'delete',
])

const isTableLoading = computed(() => props.isLoading || props.loading)

const isAnyActionLoading = computed(() => Boolean(
  props.generatingId || props.publishingId || props.deletingId || props.downloadingId,
))

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

function formatShortDate(date) {
  if (!date) {
    return '—'
  }

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsedDate)
}

function formatPeriod(start, end) {
  if (!start || !end) {
    return '—'
  }

  return `${formatShortDate(start)} — ${formatShortDate(end)}`
}

function getStatusLabel(status) {
  return statusLabels[status] || status || '—'
}

function getStatusVariant(status) {
  return statusVariants[status] || 'primary'
}

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

function formatSquadName(squad) {
  const squadName = getEntityName(squad)

  if (squadName) {
    return squadName
  }

  const squadId = getEntityId(squad)
  const foundSquad = props.squads.find((item) => String(item.id) === String(squadId))

  return foundSquad?.name || '—'
}

function isScheduleGenerated(item) {
  return Boolean(
    item?.has_entries ||
    Number(item?.entries_count || 0) > 0 ||
    item?.entries?.length,
  )
}

function canGenerateSchedule(item) {
  return item.status === 'draft' && !isScheduleGenerated(item)
}

function canPublishSchedule(item) {
  return item.status === 'draft' && isScheduleGenerated(item)
}

function canEditSchedule(item) {
  return isScheduleGenerated(item)
}

function canDownloadSchedule(item) {
  return isScheduleGenerated(item) || item.status === 'published'
}
</script>

<template>
  <AppCard class="schedules-table-card schedule-controls">
    <template #header>
      <div class="card-header">
        <div>
          <h2 class="card-title">Список графиков</h2>
          <p class="card-subtitle">
            Черновики можно сгенерировать, затем отредактировать и опубликовать.
          </p>
        </div>

        <AppButton
          type="button"
          variant="primary"
          :disabled="isTableLoading"
          @click="emit('refresh')"
        >
          Обновить
        </AppButton>
      </div>
    </template>

    <div v-if="isTableLoading" class="empty-state">
      Загрузка графиков...
    </div>

    <div v-else-if="!schedules.length" class="empty-state">
      Графики ещё не созданы.
    </div>

    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Отряд</th>
            <th>Период</th>
            <th>Статус</th>
            <th class="actions-column">Действия</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in schedules" :key="item.id">
            <td>
              <strong>{{ item.title || '—' }}</strong>
            </td>

            <td>{{ formatSquadName(item.squad) }}</td>

            <td>{{ formatPeriod(item.period_start, item.period_end) }}</td>

            <td>
              <AppStatusBadge
                :text="getStatusLabel(item.status)"
                :variant="getStatusVariant(item.status)"
              />
            </td>

            <td class="actions-cell">
              <div class="row-actions">
                <AppButton
                  v-if="canPublishSchedule(item)"
                  type="button"
                  variant="primary"
                  class="main-action-button"
                  :loading="String(publishingId) === String(item.id)"
                  :disabled="isAnyActionLoading"
                  @click="emit('publish', item)"
                >
                  Опубликовать
                </AppButton>

                <AppButton
                  v-else-if="canGenerateSchedule(item)"
                  type="button"
                  variant="primary"
                  class="main-action-button"
                  :loading="String(generatingId) === String(item.id)"
                  :disabled="isAnyActionLoading"
                  @click="emit('generate', item)"
                >
                  Сгенерировать
                </AppButton>

                <AppIconButton
                  v-if="canEditSchedule(item)"
                  icon="edit"
                  variant="primary"
                  class="edit-action"
                  title="Редактировать график"
                  aria-label="Редактировать график"
                  :disabled="isAnyActionLoading"
                  @click="emit('edit', item)"
                />

                <AppIconButton
                  v-if="canDownloadSchedule(item)"
                  icon="download"
                  variant="primary"
                  class="download-action"
                  title="Скачать график"
                  aria-label="Скачать график"
                  :loading="String(downloadingId) === String(item.id)"
                  :disabled="isAnyActionLoading"
                  @click="emit('download', item)"
                />

                <AppIconButton
                  icon="trash"
                  variant="danger"
                  class="delete-action"
                  title="Удалить график"
                  aria-label="Удалить график"
                  :loading="String(deletingId) === String(item.id)"
                  :disabled="isAnyActionLoading"
                  @click="emit('delete', item)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.card-subtitle {
  margin: 4px 0 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.empty-state {
  padding: 22px 18px;
  color: var(--text-muted);
  text-align: center;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  color: var(--text-color);
}

.data-table th,
.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--card-border);
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
}

.actions-column {
  width: 292px;
  min-width: 292px;
  text-align: right;
}

.actions-cell {
  width: 292px;
  min-width: 292px;
  text-align: right;
}

.row-actions {
  display: grid;
  grid-template-columns: 128px 36px 36px 36px;
  align-items: center;
  justify-content: end;
  column-gap: 0.35rem;
  width: 292px;
  min-width: 292px;
  margin-left: auto;
}

.main-action-button {
  grid-column: 1;
  width: 128px;
  min-width: 128px;
}

.edit-action {
  grid-column: 2;
}

.download-action {
  grid-column: 3;
}

.delete-action {
  grid-column: 4;
}

.schedule-controls :deep(.btn),
.schedule-controls :deep(.app-icon-button) {
  min-height: 36px;
  height: 36px;
  font-size: 0.85rem;
}

.schedule-controls :deep(.btn) {
  padding: 0.4rem 0.75rem;
  box-shadow: none;
}

.schedule-controls :deep(.app-icon-button) {
  width: 36px;
  min-width: 36px;
  padding: 0;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
  }
}
</style>
