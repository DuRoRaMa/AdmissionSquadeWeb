<script setup>
import { computed } from 'vue'

import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import MyScheduleRequestForm from '@/components/schedules/my/MyScheduleRequestForm.vue'

const props = defineProps({
  entry: {
    type: Object,
    required: true,
  },
  loading: Boolean,
})

const emit = defineEmits(['submit-request', 'validation-error'])

const FINAL_VISITED_STATUSES = new Set(['completed', 'attended', 'visited'])
const FINAL_MISSED_STATUSES = new Set(['cancelled', 'missed', 'absent'])

const statusLabels = {
  completed: 'Посетил',
  attended: 'Посетил',
  visited: 'Посетил',

  cancelled: 'Не посетил',
  missed: 'Не посетил',
  absent: 'Не посетил',

  checked_in: 'Приход отмечен',
  in_progress: 'На смене',

  planned: 'Планируешь',
  scheduled: 'Планируешь',
  assigned: 'Планируешь',

  pending_request: 'Ожидает решения по заявке',
}

const statusVariants = {
  completed: 'success',
  attended: 'success',
  visited: 'success',

  cancelled: 'danger',
  missed: 'danger',
  absent: 'danger',

  checked_in: 'info',
  in_progress: 'info',

  planned: 'warning',
  scheduled: 'warning',
  assigned: 'warning',

  pending_request: 'info',
}

const cardClasses = {
  completed: 'my-entry-card--visited',
  attended: 'my-entry-card--visited',
  visited: 'my-entry-card--visited',

  cancelled: 'my-entry-card--missed',
  missed: 'my-entry-card--missed',
  absent: 'my-entry-card--missed',

  checked_in: 'my-entry-card--progress',
  in_progress: 'my-entry-card--progress',

  planned: 'my-entry-card--planned',
  scheduled: 'my-entry-card--planned',
  assigned: 'my-entry-card--planned',

  pending_request: 'my-entry-card--pending',
}

const checkedInAt = computed(() => {
  return getFirstValue([
    props.entry.checked_in_at,
    props.entry.check_in_at,
    props.entry.checkin_at,
    props.entry.arrived_at,
    props.entry.attendance?.checked_in_at,
    props.entry.attendance?.check_in_at,
    props.entry.attendance_record?.checked_in_at,
    props.entry.attendance_record?.check_in_at,
    props.entry.record?.checked_in_at,
    props.entry.record?.check_in_at,
  ])
})

const checkedOutAt = computed(() => {
  return getFirstValue([
    props.entry.checked_out_at,
    props.entry.check_out_at,
    props.entry.checkout_at,
    props.entry.left_at,
    props.entry.attendance?.checked_out_at,
    props.entry.attendance?.check_out_at,
    props.entry.attendance_record?.checked_out_at,
    props.entry.attendance_record?.check_out_at,
    props.entry.record?.checked_out_at,
    props.entry.record?.check_out_at,
  ])
})

const hasCheckedIn = computed(() => Boolean(checkedInAt.value))
const hasCheckedOut = computed(() => Boolean(checkedOutAt.value))

const isEntryPast = computed(() => {
  const endDateTime = getEntryEndDateTime(props.entry)

  if (!endDateTime) {
    return false
  }

  return endDateTime < new Date()
})

const status = computed(() => {
  const rawStatus = props.entry.status || 'planned'

  if (hasCheckedIn.value && hasCheckedOut.value) {
    return 'completed'
  }

  if (FINAL_VISITED_STATUSES.has(rawStatus)) {
    return rawStatus
  }

  if (FINAL_MISSED_STATUSES.has(rawStatus)) {
    return rawStatus
  }

  if (hasCheckedIn.value && !hasCheckedOut.value) {
    return 'in_progress'
  }

  if (isEntryPast.value) {
    return 'missed'
  }

  if (props.entry.has_pending_request || props.entry.pending_request) {
    return 'pending_request'
  }

  return rawStatus
})

const statusLabel = computed(() => {
  return statusLabels[status.value] || props.entry.status_label || props.entry.status || 'Планируешь'
})

const statusVariant = computed(() => {
  return statusVariants[status.value] || 'secondary'
})

const cardClass = computed(() => {
  return cardClasses[status.value] || 'my-entry-card--planned'
})

const isFinalStatus = computed(() => {
  return FINAL_VISITED_STATUSES.has(status.value) || FINAL_MISSED_STATUSES.has(status.value)
})

const showRequestForm = computed(() => {
  return !isFinalStatus.value && status.value !== 'in_progress'
})

const showAttendanceInfo = computed(() => {
  return hasCheckedIn.value || hasCheckedOut.value || isEntryPast.value || isFinalStatus.value
})

const weekdayLabel = computed(() => {
  if (!props.entry.date) {
    return ''
  }

  const weekday = new Date(`${props.entry.date}T00:00:00`).toLocaleDateString('ru-RU', {
    weekday: 'long',
  })

  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
})

const dateLabel = computed(() => {
  if (!props.entry.date) {
    return 'Дата не указана'
  }

  return new Date(`${props.entry.date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const timeLabel = computed(() => {
  const startsAt = formatPlainTime(props.entry.starts_at || props.entry.start_time)
  const endsAt = formatPlainTime(props.entry.ends_at || props.entry.end_time)

  if (!startsAt && !endsAt) {
    return ''
  }

  if (!startsAt || !endsAt) {
    return startsAt || endsAt
  }

  return `${startsAt} — ${endsAt}`
})

const shiftName = computed(() => {
  if (!hasCheckedIn.value) {
    return 'Блок работ будет доступен после отметки прихода'
  }

  return (
    props.entry.work_block_name ||
    props.entry.work_block?.name ||
    props.entry.shift_name ||
    props.entry.block_name ||
    'Блок работ не указан'
  )
})

const checkInLabel = computed(() => {
  return formatDateTime(checkedInAt.value) || 'Не отмечен'
})

const checkOutLabel = computed(() => {
  return formatDateTime(checkedOutAt.value) || 'Не отмечен'
})

function getFirstValue(values) {
  return values.find((value) => value !== null && value !== undefined && value !== '') || null
}

function getEntryDateTime(entry, fallbackTime = '23:59:59') {
  if (!entry?.date) {
    return null
  }

  const timeValue = entry.ends_at || entry.end_time || fallbackTime
  const value = new Date(`${entry.date}T${timeValue}`)

  if (Number.isNaN(value.getTime())) {
    return null
  }

  return value
}

function getEntryEndDateTime(entry) {
  return getEntryDateTime(entry, '23:59:59')
}

function formatPlainTime(value) {
  if (!value) {
    return ''
  }

  const stringValue = String(value)

  if (/^\d{2}:\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 5)
  }

  const date = new Date(stringValue)

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return stringValue
}

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  const stringValue = String(value)

  if (/^\d{2}:\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 5)
  }

  const date = new Date(stringValue)

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return stringValue
}

function submitRequest(payload) {
  emit('submit-request', payload)
}

function showValidationError(message) {
  emit('validation-error', message)
}
</script>

<template>
  <article :class="['my-entry-card', cardClass]">
    <section class="my-entry-card__info">
      <div class="my-entry-card__date-block">
        <div class="my-entry-card__weekday">
          {{ weekdayLabel }}
        </div>

        <div class="my-entry-card__date">
          {{ dateLabel }}
        </div>
      </div>

      <div class="my-entry-card__details">
        <div class="my-entry-card__shift">
          {{ shiftName }}
        </div>

        <div v-if="timeLabel" class="my-entry-card__time">
          {{ timeLabel }}
        </div>
      </div>

      <div v-if="showAttendanceInfo" class="my-entry-card__attendance">
        <div class="my-entry-card__attendance-item">
          <span class="my-entry-card__attendance-label">Приход</span>
          <strong>{{ checkInLabel }}</strong>
        </div>

        <div class="my-entry-card__attendance-item">
          <span class="my-entry-card__attendance-label">Уход</span>
          <strong>{{ checkOutLabel }}</strong>
        </div>
      </div>

      <AppStatusBadge
        class="my-entry-card__status"
        :text="statusLabel"
        :variant="statusVariant"
      />
    </section>

    <aside v-if="showRequestForm" class="my-entry-card__side">
      <MyScheduleRequestForm
        :entry-id="entry.id"
        :loading="loading"
        @submit-request="submitRequest"
        @validation-error="showValidationError"
      />
    </aside>

    <aside v-else class="my-entry-card__side my-entry-card__side--closed">
      <div class="my-entry-card__closed-message">
        Заявка на изменение недоступна для закрытой или уже начатой смены.
      </div>
    </aside>
  </article>
</template>

<style scoped>
.my-entry-card {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(280px, 360px);
  gap: 18px;
  align-items: stretch;
  padding: 16px;
  border-radius: 20px;
  border: var(--card-border);
  background: rgba(255, 255, 255, 0.04);
}

.my-entry-card--visited {
  border-color: color-mix(in srgb, var(--success-color, #198754) 45%, transparent);
  background: color-mix(in srgb, var(--success-color, #198754) 9%, transparent);
}

.my-entry-card--missed {
  border-color: color-mix(in srgb, var(--danger-color, #dc3545) 45%, transparent);
  background: color-mix(in srgb, var(--danger-color, #dc3545) 9%, transparent);
}

.my-entry-card--progress {
  border-color: color-mix(in srgb, var(--info-color, #0dcaf0) 45%, transparent);
  background: color-mix(in srgb, var(--info-color, #0dcaf0) 10%, transparent);
}

.my-entry-card--planned {
  border-color: color-mix(in srgb, var(--warning-color, #ffc107) 45%, transparent);
  background: color-mix(in srgb, var(--warning-color, #ffc107) 11%, transparent);
}

.my-entry-card--pending {
  border-color: color-mix(in srgb, var(--info-color, #0dcaf0) 45%, transparent);
  background: color-mix(in srgb, var(--info-color, #0dcaf0) 10%, transparent);
}

.my-entry-card__info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  min-width: 0;
}

.my-entry-card__date-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.my-entry-card__weekday {
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
}

.my-entry-card__date {
  color: var(--text-color);
  font-size: clamp(1.55rem, 3vw, 2.15rem);
  font-weight: 900;
  line-height: 1.1;
}

.my-entry-card__details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.my-entry-card__shift {
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 700;
}

.my-entry-card__time {
  color: var(--text-muted);
  font-size: 0.88rem;
  opacity: 0.75;
}

.my-entry-card__attendance {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 10px;
  max-width: 360px;
}

.my-entry-card__attendance-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.my-entry-card__attendance-label {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.my-entry-card__attendance-item strong {
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 900;
}

.my-entry-card__status {
  margin-top: 2px;
}

.my-entry-card__side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-left: 18px;
  border-left: var(--card-border);
}

.my-entry-card__side--closed {
  justify-content: center;
}

.my-entry-card__closed-message {
  padding: 14px;
  border-radius: 16px;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.4;
  background: rgba(255, 255, 255, 0.04);
}

@media (max-width: 900px) {
  .my-entry-card {
    grid-template-columns: 1fr;
  }

  .my-entry-card__side {
    padding-left: 0;
    border-left: none;
    border-top: var(--card-border);
    padding-top: 14px;
  }
}

@media (max-width: 520px) {
  .my-entry-card__attendance {
    grid-template-columns: 1fr;
  }
}
</style>
