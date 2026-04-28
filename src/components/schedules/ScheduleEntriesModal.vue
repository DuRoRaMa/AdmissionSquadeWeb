<script setup>
import { computed } from 'vue'

const props = defineProps({
  schedule: {
    type: Object,
    default: null,
  },
  entries: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const groupedEntries = computed(() => {
  const groups = props.entries.reduce((result, entry) => {
    const date = entry.date || 'unknown'

    if (!result[date]) {
      result[date] = []
    }

    result[date].push(entry)
    return result
  }, {})

  return Object.entries(groups)
    .sort(([dateA], [dateB]) => String(dateA).localeCompare(String(dateB)))
    .map(([date, entries]) => ({
      date,
      entries: [...entries].sort((a, b) => {
        const timeCompare = String(a.starts_at || '').localeCompare(String(b.starts_at || ''))

        if (timeCompare !== 0) {
          return timeCompare
        }

        return String(a.work_block_name || a.work_block_code || '').localeCompare(
          String(b.work_block_name || b.work_block_code || ''),
        )
      }),
    }))
})

function formatShortDate(date) {
  if (!date || date === 'unknown') {
    return 'Без даты'
  }

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsedDate)
}

function formatPeriod(start, end) {
  if (!start || !end) return '—'
  return `${formatShortDate(start)} — ${formatShortDate(end)}`
}

function formatTime(value) {
  if (!value) return '—'
  return String(value).slice(0, 5)
}

function getEntryStatusLabel(status) {
  const map = {
    planned: 'Запланирован',
    confirmed: 'Подтверждён',
    completed: 'Выполнен',
    missed: 'Не вышел',
    replaced: 'Заменён',
  }

  return map[status] || status || '—'
}

function getEntryStatusClass(status) {
  return {
    'entry-status': true,
    'entry-status--planned': status === 'planned',
    'entry-status--confirmed': status === 'confirmed',
    'entry-status--completed': status === 'completed',
    'entry-status--missed': status === 'missed',
    'entry-status--replaced': status === 'replaced',
  }
}

function getMemberName(entry) {
  return (
    entry.member_name ||
    entry.membership_name ||
    entry.membership?.user_full_name ||
    entry.membership?.full_name ||
    `Участник #${entry.membership}`
  )
}

function getWorkBlockName(entry) {
  return (
    entry.work_block_name ||
    entry.work_block?.name ||
    entry.work_block_code ||
    `Блок #${entry.work_block}`
  )
}
</script>

<template>
  <Teleport to="body">
    <div
      class="modal-backdrop"
      @click.self="emit('close')"
    >
      <section class="schedule-modal">
        <header class="schedule-modal__header">
          <div>
            <h2>Сгенерированный график</h2>
            <p v-if="schedule">
              {{ schedule.title }} · {{ formatPeriod(schedule.period_start, schedule.period_end) }}
            </p>
          </div>

          <button
            type="button"
            class="icon-button"
            aria-label="Закрыть"
            @click="emit('close')"
          >
            ×
          </button>
        </header>

        <div
          v-if="loading"
          class="empty-state"
        >
          Загрузка графика...
        </div>

        <div
          v-else-if="error"
          class="feedback feedback--error"
        >
          {{ error }}
        </div>

        <div
          v-else-if="!entries.length"
          class="empty-state"
        >
          В графике пока нет назначений. Сначала нажмите «Сгенерировать».
        </div>

        <div
          v-else
          class="schedule-days"
        >
          <article
            v-for="group in groupedEntries"
            :key="group.date"
            class="schedule-day"
          >
            <div class="schedule-day__header">
              <h3>{{ formatShortDate(group.date) }}</h3>
              <span>Назначений: {{ group.entries.length }}</span>
            </div>

            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Блок работ</th>
                    <th>Участник</th>
                    <th>Статус</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="entry in group.entries"
                    :key="entry.id"
                  >
                    <td>
                      {{ formatTime(entry.starts_at) }} — {{ formatTime(entry.ends_at) }}
                    </td>

                    <td>{{ getWorkBlockName(entry) }}</td>

                    <td>{{ getMemberName(entry) }}</td>

                    <td>
                      <span :class="getEntryStatusClass(entry.status)">
                        {{ getEntryStatusLabel(entry.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(6px);
}

.schedule-modal {
  width: min(1120px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 24px;
  border: var(--card-border);
  border-radius: 22px;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  color: var(--text-color);
}

.schedule-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.schedule-modal__header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-color);
}

.schedule-modal__header p {
  margin: 6px 0 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.icon-button {
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
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.2s ease;
}

.icon-button:hover {
  transform: translateY(-1px);
  background: var(--card-bg);
}

.empty-state {
  padding: 22px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  text-align: center;
}

.feedback {
  padding: 14px 16px;
  border-radius: 14px;
  font-weight: 600;
}

.feedback--error {
  border: 1px solid rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color, #dc2626);
}

.schedule-days {
  display: grid;
  gap: 16px;
}

.schedule-day {
  padding: 18px;
  border: var(--card-border);
  border-radius: 18px;
  background: var(--input-bg);
}

.schedule-day__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.schedule-day__header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-color);
}

.schedule-day__header span {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
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
  padding: 13px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  color: var(--text-muted);
  font-weight: 700;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.entry-status {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
}

.entry-status--planned {
  background: var(--btn-secondary-gradient);
}

.entry-status--confirmed,
.entry-status--completed {
  background: var(--btn-success-gradient);
}

.entry-status--missed {
  background: var(--btn-danger-gradient);
}

.entry-status--replaced {
  background: var(--btn-warning-gradient);
}

@media (max-width: 768px) {
  .modal-backdrop {
    padding: 12px;
  }

  .schedule-modal {
    max-height: calc(100vh - 24px);
    padding: 18px;
    border-radius: 18px;
  }

  .schedule-modal__header,
  .schedule-day__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
