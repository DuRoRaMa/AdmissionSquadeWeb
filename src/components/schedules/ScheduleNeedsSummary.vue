<template>
  <AppCard class="needs-summary">
    <template #header>
      <div class="summary-header">
        <div>
          <h2>Потребности на день</h2>
          <p>Показываем уникальные ежедневные потребности, без повторения по каждой дате периода.</p>
        </div>
      </div>
    </template>

    <div v-if="!uniqueNeeds.length" class="empty-state">
      Потребности не указаны.
    </div>

    <div v-else class="summary-table-wrap">
      <table class="summary-table">
        <thead>
          <tr>
            <th>Блок</th>
            <th>Смена</th>
            <th class="count-column">Количество</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="need in uniqueNeeds" :key="need.localKey">
            <td>
              <strong>{{ getBlockName(need) }}</strong>
            </td>

            <td>{{ getShiftLabel(need) }}</td>

            <td class="count-column">
              {{ need.required_people }} чел.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppCard>
</template>

<script setup>
import { computed } from 'vue'

import AppCard from '@/components/ui/AppCard.vue'

const props = defineProps({
  needs: {
    type: Array,
    default: () => [],
  },
})

const uniqueNeeds = computed(() => {
  const uniqueMap = new Map()

  props.needs.forEach((need, index) => {
    const key = [
      getWorkBlockId(need),
      formatTime(need.starts_at),
      formatTime(need.ends_at),
      Number(need.required_people || 0),
    ].join('|')

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        ...need,
        localKey: `${key}-${index}`,
      })
    }
  })

  return [...uniqueMap.values()].sort((a, b) => {
    const blockCompare = getBlockName(a).localeCompare(getBlockName(b), 'ru')

    if (blockCompare !== 0) {
      return blockCompare
    }

    return formatTime(a.starts_at).localeCompare(formatTime(b.starts_at))
  })
})

function getWorkBlockId(need) {
  if (need.work_block && typeof need.work_block === 'object') {
    return need.work_block.id || need.work_block.code || need.work_block.name || 'without-block'
  }

  return need.work_block || need.work_block_id || need.work_block_code || need.work_block_name || 'without-block'
}

function formatTime(value) {
  if (!value) {
    return '—'
  }

  return String(value).slice(0, 5)
}

function getBlockName(need) {
  if (need.work_block_code && need.work_block_name) {
    return `${need.work_block_code} · ${need.work_block_name}`
  }

  if (need.work_block?.code && need.work_block?.name) {
    return `${need.work_block.code} · ${need.work_block.name}`
  }

  if (need.work_block?.name) {
    return need.work_block.name
  }

  return need.work_block_name || 'Блок не указан'
}

function getShiftLabel(need) {
  const timeRange = `${formatTime(need.starts_at)}–${formatTime(need.ends_at)}`
  const startsAt = formatTime(need.starts_at)

  if (startsAt >= '18:00') {
    return `Дополнительная смена (${timeRange})`
  }

  return `Основная смена (${timeRange})`
}
</script>

<style scoped>
.summary-header h2 {
  margin: 0;
  color: var(--text-color);
}

.summary-header p {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}

.empty-state {
  color: var(--text-muted);
}

.summary-table-wrap {
  overflow-x: auto;
}

.summary-table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  color: var(--text-color);
}

.summary-table th,
.summary-table td {
  padding: 0.75rem 0.6rem;
  border-bottom: 1px solid var(--card-border);
  text-align: left;
  vertical-align: middle;
}

.summary-table th {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.summary-table tr:last-child td {
  border-bottom: 0;
}

.count-column {
  width: 120px;
  text-align: right;
  white-space: nowrap;
}
</style>
