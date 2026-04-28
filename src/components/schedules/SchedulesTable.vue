<script setup>
import AppCard from '@/components/ui/AppCard.vue'

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
})

const emit = defineEmits([
  'generate',
  'publish',
  'download',
  'edit',
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

function getStatusLabel(status) {
  const map = {
    draft: 'Черновик',
    published: 'Опубликован',
    archived: 'Архив',
  }
  return map[status] || status || '—'
}

function getStatusClass(status) {
  return {
    'status-pill': true,
    'status-pill--draft': status === 'draft',
    'status-pill--published': status === 'published',
    'status-pill--archived': status === 'archived',
  }
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

function canManageGeneratedSchedule(item) {
  return item.status === 'draft' && isScheduleGenerated(item)
}

function formatSquadName(squadId) {
  const squad = props.squads.find((item) => Number(item.id) === Number(squadId))
  return squad?.name || `Отряд #${squadId}`
}
</script>

<template>
  <AppCard>
    <template #header>
      <div class="card-header">
        <div>
          <div class="card-title">Список графиков</div>
          <div class="card-subtitle">
            Черновики можно сгенерировать, затем опубликовать.
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="isLoading"
      class="empty-state"
    >
      Загрузка...
    </div>

    <div
      v-else-if="!schedules.length"
      class="empty-state"
    >
      Графики ещё не созданы.
    </div>

    <div
      v-else
      class="table-wrap"
    >
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Отряд</th>
            <th>Название</th>
            <th>Период</th>
            <th>Потребностей</th>
            <th>Статус</th>
            <th>Действия</th>
            <th class="download-column" aria-label="Скачать"></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in schedules"
            :key="item.id"
          >
            <td>{{ item.id }}</td>

            <td>{{ formatSquadName(item.squad) }}</td>

            <td>{{ item.title }}</td>

            <td>{{ formatPeriod(item.period_start, item.period_end) }}</td>

            <td>{{ item.needs?.length || 0 }}</td>

            <td>
              <span :class="getStatusClass(item.status)">
                {{ getStatusLabel(item.status) }}
              </span>
            </td>

            <td>
              <div class="row-actions row-actions--schedules">
                <button
                  v-if="canGenerateSchedule(item)"
                  class="btn btn--primary btn--table-action"
                  type="button"
                  @click="emit('generate', item.id)"
                >
                  Сгенерировать
                </button>

                <template v-if="canManageGeneratedSchedule(item)">
                  <button
                    class="btn btn--ghost btn--table-action btn--edit"
                    type="button"
                    @click="emit('edit', item)"
                  >
                    Редактировать
                  </button>

                  <button
                    class="btn btn--success btn--table-action"
                    type="button"
                    @click="emit('publish', item.id)"
                  >
                    Опубликовать
                  </button>
                </template>
              </div>
            </td>

            <td class="download-cell">
              <button
                v-if="isScheduleGenerated(item) || item.status === 'published'"
                class="btn btn--icon-download"
                type="button"
                title="Скачать график"
                aria-label="Скачать график"
                @click="emit('download', item)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
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

.btn--success {
  background: var(--btn-success-gradient);
  color: #fff;
  box-shadow: var(--card-shadow);
}

.btn--success:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn--table-action {
  padding: 9px 14px;
  border-radius: var(--btn-border-radius);
  white-space: nowrap;
}

.btn--ghost {
  background: transparent;
  color: var(--text-color);
  border: var(--card-border);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--input-bg);
}

.btn--edit {
  border: var(--input-border);
  color: var(--text-color);
}

.download-column,
.download-cell {
  width: 52px;
  text-align: right;
}

.btn--icon-download {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: var(--input-border);
  border-radius: 12px;
  background: var(--input-bg);
  color: var(--text-color);
  box-shadow: none;
}

.btn--icon-download:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--card-bg);
}

.btn--icon-download svg {
  width: 19px;
  height: 19px;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-color);
}

.data-table th,
.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  color: var(--text-muted);
  font-weight: 600;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.status-pill--draft {
  background: var(--btn-warning-gradient);
  color: #fff;
  box-shadow: 0 8px 18px rgba(245, 158, 11, 0.18);
}

.status-pill--published {
  background: var(--btn-success-gradient);
  color: #fff;
  box-shadow: 0 8px 18px rgba(72, 187, 120, 0.16);
}

.status-pill--archived {
  background: var(--btn-secondary-gradient);
  color: #fff;
}
</style>
