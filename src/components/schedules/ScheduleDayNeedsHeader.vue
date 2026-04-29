<template>
  <AppCard class="needs-header-card">
    <template #header>
      <div class="card-heading">
        <div>
          <h2>Потребности на день</h2>
          <p>{{ formattedDate }}</p>
        </div>
      </div>
    </template>

    <div v-if="!needs.length" class="empty-state">
      На выбранный день потребности не указаны.
    </div>

    <div v-else class="needs-grid">
      <article
        v-for="group in groupedNeeds"
        :key="group.blockId"
        class="need-card"
      >
        <h3>{{ group.blockName }}</h3>

        <div class="need-lines">
          <div
            v-for="shift in group.shifts"
            :key="shift.id"
            class="need-line"
          >
            <span>{{ shift.label }}</span>
            <strong>{{ shift.assignedCount }} / {{ shift.requiredPeople }}</strong>
          </div>
        </div>
      </article>
    </div>
  </AppCard>
</template>

<script setup>
import { computed } from 'vue'

import AppCard from '@/components/ui/AppCard.vue'

const props = defineProps({
  date: {
    type: String,
    default: '',
  },
  needs: {
    type: Array,
    default: () => [],
  },
})

const formattedDate = computed(() => (props.date ? formatDate(props.date) : 'День не выбран'))

const groupedNeeds = computed(() => {
  const groups = new Map()

  props.needs.forEach((need) => {
    const blockId = getNeedBlockId(need) || `without-block-${need.id}`

    if (!groups.has(blockId)) {
      groups.set(blockId, {
        blockId,
        blockName: getWorkBlockName(need),
        shifts: [],
      })
    }

    groups.get(blockId).shifts.push({
      id: need.id,
      startsAt: normalizeTime(need.starts_at),
      endsAt: normalizeTime(need.ends_at),
      label: getShiftTitle(need),
      requiredPeople: Number(need.required_people || 0),
      assignedCount: Number(need.assigned_count || normalizeEntries(need.entries).length || 0),
    })
  })

  return [...groups.values()]
    .map((group) => ({
      ...group,
      shifts: group.shifts.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    }))
    .sort((a, b) => a.blockName.localeCompare(b.blockName))
})

function normalizeEntries(entries) {
  return Array.isArray(entries) ? entries : []
}

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

function getWorkBlockName(need) {
  if (need.work_block_code && need.work_block_name) {
    return `${need.work_block_code} · ${need.work_block_name}`
  }

  if (need.work_block?.code && need.work_block?.name) {
    return `${need.work_block.code} · ${need.work_block.name}`
  }

  return need.work_block_name || need.work_block?.name || need.block_name || 'Блок работ не указан'
}

function normalizeTime(value) {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 5)
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

function getShiftTitle(need) {
  const startsAt = normalizeTime(need.starts_at)
  const endsAt = normalizeTime(need.ends_at)
  const timeRange = startsAt && endsAt ? ` (${startsAt}–${endsAt})` : ''

  if (need.shift_kind === 'extra' || need.shiftKind === 'extra') {
    return `Дополнительная смена${timeRange}`
  }

  if (need.shift_kind === 'primary' || need.shiftKind === 'primary') {
    return `Основная смена${timeRange}`
  }

  return `${need.shift_title || need.title || 'Смена'}${timeRange}`
}
</script>

<style scoped>
.card-heading h2 {
  margin: 0;
  color: var(--text-color);
}

.card-heading p {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}

.empty-state {
  color: var(--text-muted);
}

.needs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.need-card {
  display: grid;
  gap: 0.55rem;
  padding: 0.85rem;
  border: 1px solid var(--card-border);
  border-radius: 0.9rem;
  background: var(--header-footer-bg);
}

.need-card h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 0.95rem;
}

.need-lines {
  display: grid;
  gap: 0.35rem;
}

.need-line {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.need-line strong {
  color: var(--text-color);
  white-space: nowrap;
}
</style>