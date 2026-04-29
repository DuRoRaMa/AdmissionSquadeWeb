<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="availability-responses-modal__overlay"
      @click.self="emit('close')"
    >
      <section class="availability-responses-modal" role="dialog" aria-modal="true">
        <header class="availability-responses-modal__header">
          <div>
            <h3 class="availability-responses-modal__title">Ответы на форму</h3>
            <p class="availability-responses-modal__subtitle">
              {{ formTitle }}
            </p>
          </div>

          <AppIconButton
            icon="close"
            title="Закрыть"
            variant="danger"
            @click="emit('close')"
          />
        </header>

        <main class="availability-responses-modal__body">
          <div v-if="loading" class="availability-responses-modal__empty">
            Загрузка ответов...
          </div>

          <template v-else>
            <div class="availability-responses-modal__stats">
              <AppStatCard label="Всего участников" :value="stats.total" variant="primary" />
              <AppStatCard label="Ответили" :value="stats.answered" variant="success" />
              <AppStatCard label="Без ответа" :value="stats.unanswered" variant="danger" />
            </div>

            <div class="availability-responses-modal__filters">
              <AppInput
                v-model="searchQuery"
                type="search"
                placeholder="Поиск по ФИО"
              />

              <AppSelect
                v-model="responseFilter"
                :options="responseFilterOptions"
                placeholder="Фильтр"
              />
            </div>

            <div v-if="!filteredMembers.length" class="availability-responses-modal__empty">
              По выбранным условиям участников нет.
            </div>

            <div v-else class="availability-responses-modal__list">
              <AppAccordionItem
                v-for="member in filteredMembers"
                :key="getMemberKey(member)"
              >
                <template #title>
                  <span class="availability-responses-modal__member-name">
                    {{ member.full_name }}
                  </span>
                </template>

                <template #subtitle>
                  {{ getMemberSubtitle(member) }}
                </template>

                <template #meta>
                  <AppStatusBadge
                    :text="getMemberAnswerBadge(member).text"
                    :variant="getMemberAnswerBadge(member).variant"
                  />

                  <span class="availability-responses-modal__count-pill availability-responses-modal__count-pill--success">
                    Доступно: {{ member.available_count }}
                  </span>

                  <span class="availability-responses-modal__count-pill availability-responses-modal__count-pill--danger">
                    Недоступно: {{ member.unavailable_count }}
                  </span>
                </template>

                <div
                  v-if="!member.has_response"
                  class="availability-responses-modal__empty availability-responses-modal__empty--inner"
                >
                  Участник ещё не отправил ответ.
                </div>

                <div
                  v-else-if="!member.slots.length"
                  class="availability-responses-modal__empty availability-responses-modal__empty--inner"
                >
                  Ответ есть, но детализация по сменам отсутствует.
                </div>

                <div v-else class="table-responsive">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Смена</th>
                        <th>Статус по смене</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="slot in member.slots" :key="getSlotKey(slot)">
                        <td>{{ formatDate(slot.date) }}</td>
                        <td>{{ getShiftLabel(slot) }}</td>
                        <td>
                          <AppStatusBadge
                            :text="getSlotStatus(slot).text"
                            :variant="getSlotStatus(slot).variant"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </AppAccordionItem>
            </div>
          </template>
        </main>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppAccordionItem from '../ui/AppAccordionItem.vue'
import AppIconButton from '../ui/AppIconButton.vue'
import AppInput from '../ui/AppInput.vue'
import AppSelect from '../ui/AppSelect.vue'
import AppStatCard from '../ui/AppStatCard.vue'
import AppStatusBadge from '../ui/AppStatusBadge.vue'

const props = defineProps({
  visible: Boolean,
  loading: Boolean,
  form: {
    type: Object,
    default: null,
  },
  responses: {
    type: [Array, Object],
    default: () => [],
  },
  members: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close'])

const searchQuery = ref('')
const responseFilter = ref('all')

const responseFilterOptions = [
  { value: 'all', label: 'Все' },
  { value: 'answered', label: 'Ответили' },
  { value: 'not_answered', label: 'Без ответа' },
]

const formTitle = computed(() => props.form?.title || 'Форма доступности')

const rawMembers = computed(() => {
  if (props.members.length) {
    return props.members
  }

  if (Array.isArray(props.responses)) {
    return props.responses
  }

  if (Array.isArray(props.responses?.members)) {
    return props.responses.members
  }

  return []
})

const sortedMembers = computed(() => {
  return rawMembers.value
    .map(normalizeMember)
    .sort((left, right) => left.full_name.localeCompare(right.full_name, 'ru'))
})

const filteredMembers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return sortedMembers.value.filter((member) => {
    const matchesQuery = !query || member.full_name.toLowerCase().includes(query)
    const matchesStatus =
      responseFilter.value === 'all' ||
      (responseFilter.value === 'answered' && member.has_response) ||
      (responseFilter.value === 'not_answered' && !member.has_response)

    return matchesQuery && matchesStatus
  })
})

const stats = computed(() => {
  const total = sortedMembers.value.length
  const answered = sortedMembers.value.filter((member) => member.has_response).length

  return {
    total,
    answered,
    unanswered: total - answered,
  }
})

watch(
  () => props.visible,
  (isVisible) => {
    if (!isVisible) {
      searchQuery.value = ''
      responseFilter.value = 'all'
    }
  },
)

function normalizeMember(member) {
  const slots = Array.isArray(member.slots) ? member.slots.map(normalizeSlot) : []
  const availableCount = getCount(member.available_count, slots, true)
  const unavailableCount = getCount(member.unavailable_count, slots, false)

  return {
    ...member,
    full_name: getMemberName(member),
    role_name: member.role_name || '',
    has_response: Boolean(member.has_response || slots.length),
    available_count: availableCount,
    unavailable_count: unavailableCount,
    submitted_at: member.submitted_at || getLatestSubmittedAt(slots),
    slots,
  }
}

function normalizeSlot(slot) {
  return {
    ...slot,
    is_available: normalizeBoolean(slot.is_available ?? slot.available ?? slot.isAvailable),
  }
}

function normalizeBoolean(value) {
  if (value === true || value === false) {
    return value
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()

    if (['true', '1', 'yes', 'available', 'доступен', 'доступна'].includes(normalizedValue)) {
      return true
    }

    if (['false', '0', 'no', 'unavailable', 'недоступен', 'недоступна'].includes(normalizedValue)) {
      return false
    }
  }

  if (typeof value === 'number') {
    return value === 1
  }

  return null
}

function getCount(value, slots, targetAvailability) {
  const numberValue = Number(value)

  if (Number.isFinite(numberValue)) {
    return numberValue
  }

  return slots.filter((slot) => slot.is_available === targetAvailability).length
}

function getLatestSubmittedAt(slots) {
  const dates = slots
    .map((slot) => slot.submitted_at)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))

  if (!dates.length) {
    return null
  }

  return new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString()
}

function getMemberName(member) {
  return (
    member.full_name ||
    member.name ||
    member.user?.full_name ||
    [member.user?.last_name, member.user?.first_name, member.user?.middle_name]
      .filter(Boolean)
      .join(' ') ||
    member.user?.email ||
    'Без имени'
  )
}

function getMemberSubtitle(member) {
  return member.role_name || 'Участник'
}

function getMemberAnswerBadge(member) {
  if (!member.has_response) {
    return {
      text: 'Без ответа',
      variant: 'danger',
    }
  }

  return {
    text: member.submitted_at
      ? `Ответ отправлен: ${formatDateTime(member.submitted_at)}`
      : 'Ответ отправлен',
    variant: 'success',
  }
}

function getMemberKey(member) {
  return member.membership_id || member.user_id || member.id || member.full_name
}

function getSlotKey(slot) {
  return `${slot.shift_id || slot.id || ''}-${slot.date || ''}-${slot.starts_at || ''}-${slot.ends_at || ''}`
}

function getShiftLabel(slot) {
  const title = slot.shift_title || slot.title || getShiftKindLabel(slot.shift_kind)
  const time = formatTimeRange(slot.starts_at, slot.ends_at)

  if (!time) {
    return title
  }

  return `${title} (${time})`
}

function getShiftKindLabel(value) {
  const labels = {
    primary: 'Основная смена',
    extra: 'Дополнительная смена',
  }

  return labels[value] || 'Смена'
}

function getSlotStatus(slot) {
  if (slot.is_available === true) {
    return {
      text: 'Доступен',
      variant: 'success',
    }
  }

  if (slot.is_available === false) {
    return {
      text: 'Недоступен',
      variant: 'danger',
    }
  }

  return {
    text: 'Не указано',
    variant: 'secondary',
  }
}

function formatDate(value) {
  if (!value) return '—'

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}.${month}.${year}`
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU')
}

function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ru-RU')
}

function formatTime(value) {
  if (!value) return ''

  return String(value).slice(0, 5)
}

function formatTimeRange(start, end) {
  const startTime = formatTime(start)
  const endTime = formatTime(end)

  if (!startTime && !endTime) {
    return ''
  }

  return `${startTime || '—'}–${endTime || '—'}`
}
</script>

<style scoped>
.availability-responses-modal__overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.availability-responses-modal {
  width: min(1100px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--card-bg-solid);
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  color: var(--text-color);
  overflow: hidden;

  --input-padding-y: 0.4rem;
  --input-padding-x: 0.8rem;
  --btn-padding-y: 0.4rem;
  --btn-padding-x: 0.8rem;
}

.availability-responses-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--header-footer-bg);
  border-bottom: 1px solid var(--card-border-color, rgba(255, 255, 255, 0.08));
}

.availability-responses-modal__title {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
}

.availability-responses-modal__subtitle {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
}

.availability-responses-modal__body {
  padding: 1rem;
  overflow-y: auto;
}

.availability-responses-modal__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.availability-responses-modal__filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 240px);
  gap: 1rem;
  align-items: start;
  margin-bottom: 1rem;
}

.availability-responses-modal__list {
  display: flex;
  flex-direction: column;
}

.availability-responses-modal__member-name {
  min-width: 0;
  color: var(--text-color);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.availability-responses-modal__count-pill {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.availability-responses-modal__count-pill--success {
  background: color-mix(in srgb, var(--success-color, #198754) 14%, transparent);
  color: var(--success-color, #198754);
}

.availability-responses-modal__count-pill--danger {
  background: color-mix(in srgb, var(--danger-color, #dc3545) 14%, transparent);
  color: var(--danger-color, #dc3545);
}

.availability-responses-modal__empty {
  padding: 1rem;
  color: var(--text-muted);
  text-align: center;
}

.availability-responses-modal__empty--inner {
  padding: 0;
  text-align: left;
}

@media (max-width: 768px) {
  .availability-responses-modal__header {
    flex-direction: column;
  }

  .availability-responses-modal__stats,
  .availability-responses-modal__filters {
    grid-template-columns: 1fr;
  }
}
</style>
