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

const statusLabels = {
  completed: 'Посетил',
  attended: 'Посетил',
  visited: 'Посетил',

  cancelled: 'Не посетил',
  missed: 'Не посетил',
  absent: 'Не посетил',

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

  planned: 'my-entry-card--planned',
  scheduled: 'my-entry-card--planned',
  assigned: 'my-entry-card--planned',

  pending_request: 'my-entry-card--pending',
}

const status = computed(() => {
  if (props.entry.has_pending_request || props.entry.pending_request) {
    return 'pending_request'
  }

  return props.entry.status || 'planned'
})

const statusLabel = computed(() => statusLabels[status.value] || props.entry.status || 'Планируешь')
const statusVariant = computed(() => statusVariants[status.value] || 'secondary')
const cardClass = computed(() => cardClasses[status.value] || 'my-entry-card--planned')

const weekdayLabel = computed(() => {
  if (!props.entry.date) return ''

  const weekday = new Date(`${props.entry.date}T00:00:00`).toLocaleDateString('ru-RU', {
    weekday: 'long',
  })

  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
})

const dateLabel = computed(() => {
  if (!props.entry.date) return 'Дата не указана'

  return new Date(`${props.entry.date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const timeLabel = computed(() => {
  const startsAt = formatTime(props.entry.starts_at)
  const endsAt = formatTime(props.entry.ends_at)

  if (!startsAt && !endsAt) return ''
  if (!startsAt || !endsAt) return startsAt || endsAt

  return `${startsAt} — ${endsAt}`
})

const shiftName = computed(() => {
  return props.entry.work_block_name || 'Смена'
})

function formatTime(value) {
  if (!value) return ''

  return String(value).slice(0, 5)
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

      <AppStatusBadge
        class="my-entry-card__status"
        :text="statusLabel"
        :variant="statusVariant"
      />
    </section>

    <aside class="my-entry-card__request">
      <MyScheduleRequestForm
        :entry-id="entry.id"
        :loading="loading"
        @submit-request="submitRequest"
        @validation-error="showValidationError"
      />
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

.my-entry-card__status {
  margin-top: 2px;
}

.my-entry-card__request {
  padding-left: 18px;
  border-left: var(--card-border);
}

@media (max-width: 900px) {
  .my-entry-card {
    grid-template-columns: 1fr;
  }

  .my-entry-card__request {
    padding-top: 14px;
    padding-left: 0;
    border-top: var(--card-border);
    border-left: 0;
  }
}
</style>
