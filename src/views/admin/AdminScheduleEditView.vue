<template>
  <div class="admin-page schedule-edit-page">
    <AppAlert
      v-if="alert.message"
      :key="alert.id"
      :variant="alert.type"
      dismissible
      auto-close
      :duration="10000"
      @close="clearAlert"
    >
      {{ alert.message }}
    </AppAlert>

    <div class="page-header schedule-controls">
      <div>
        <button class="back-button" type="button" @click="goBack">
          ← К списку графиков
        </button>

        <h1>{{ schedule?.title || 'График' }}</h1>

        <p v-if="schedule" class="page-subtitle">
          {{ schedule.squad_name || getSquadName(schedule.squad) }} · {{ formatPeriod(schedule) }}
        </p>
      </div>

      <div v-if="schedule" class="header-actions">
        <AppStatusBadge
          :text="getStatusLabel(schedule.status)"
          :variant="getStatusVariant(schedule.status)"
        />

        <AppButton
          type="button"
          variant="primary"
          :disabled="scheduleStore.isLoading || scheduleStore.isSavingAssignments || scheduleStore.isSavingNeeds"
          @click="reloadCurrentDay"
        >
          Обновить
        </AppButton>

        <AppButton
          v-if="canPublish"
          type="button"
          variant="primary"
          :loading="publishing"
          :disabled="publishing || scheduleStore.isSavingAssignments || scheduleStore.isSavingNeeds || isDirty"
          @click="handlePublish"
        >
          Опубликовать
        </AppButton>
      </div>
    </div>

    <ScheduleDaySelector
      :days="days"
      :selected-date="selectedDate"
      :loading="scheduleStore.isLoading"
      :disabled="scheduleStore.isSavingAssignments || scheduleStore.isSavingNeeds"
      @select="handleSelectDate"
    />

    <ScheduleDayNeedsEditor
      v-model="needRows"
      :date="selectedDate"
      :work-block-options="workBlockOptions"
      :loading="scheduleStore.isLoading || workBlocksLoading"
      :saving="scheduleStore.isSavingNeeds"
      :readonly="isReadonly"
      :dirty="isNeedsDirty"
      @save="handleSaveNeeds"
      @reset="handleResetNeeds"
      @remove="handleRemoveNeedRow"
    />

    <ScheduleAssignmentsEditor
      v-model="assignmentRows"
      :needs="needsForAssignments"
      :work-block-options="workBlockOptions"
      :loading="scheduleStore.isLoading || workBlocksLoading"
      :saving="scheduleStore.isSavingAssignments"
      :readonly="isReadonly || isNeedsDirty"
      :readonly-message="assignmentsReadonlyMessage"
      :dirty="isAssignmentsDirty"
      @save="handleSaveAssignments"
      @reset="handleResetAssignments"
    />

    <ConfirmModal ref="confirmModalRef" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import apiClient from '@/axios'
import { useScheduleStore } from '@/stores/schedule'
import { useSquadsStore } from '@/stores/squads'

import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import ScheduleAssignmentsEditor from '@/components/schedules/ScheduleAssignmentsEditor.vue'
import ScheduleDayNeedsEditor from '@/components/schedules/ScheduleDayNeedsEditor.vue'
import ScheduleDaySelector from '@/components/schedules/ScheduleDaySelector.vue'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()
const squadsStore = useSquadsStore()

const confirmModalRef = ref(null)
const publishing = ref(false)
const schedule = ref(null)
const days = ref([])
const selectedDate = ref('')
const needs = ref([])
const members = ref([])
const workBlocks = ref([])
const workBlocksLoading = ref(false)
const needRows = ref([])
const assignmentRows = ref([])
const originalNeedsSnapshot = ref('[]')
const originalRowsSnapshot = ref('[]')

const alert = ref({
  id: 0,
  type: 'success',
  message: '',
})

const scheduleId = computed(() => route.params.id)
const isReadonly = computed(() => schedule.value?.status === 'published' || schedule.value?.status === 'archived')
const canPublish = computed(() => schedule.value?.status === 'draft')

const isNeedsDirty = computed(() => (
  JSON.stringify(normalizeNeedsForSnapshot(needRows.value)) !== originalNeedsSnapshot.value
))

const isAssignmentsDirty = computed(() => (
  JSON.stringify(normalizeRowsForSnapshot(assignmentRows.value)) !== originalRowsSnapshot.value
))

const isDirty = computed(() => isNeedsDirty.value || isAssignmentsDirty.value)

const assignmentsReadonlyMessage = computed(() => {
  if (isReadonly.value) {
    return 'Опубликованный или архивный график доступен только для просмотра.'
  }

  if (isNeedsDirty.value) {
    return 'Сначала сохраните изменения потребностей по выбранному дню.'
  }

  return ''
})

const workBlockOptions = computed(() => {
  const blocks = new Map()

  needs.value.forEach((need) => {
    const id = getNeedBlockId(need)

    if (!id) {
      return
    }

    blocks.set(String(id), {
      value: String(id),
      label: getWorkBlockName(need),
    })
  })

  workBlocks.value
    .filter((block) => block.is_active !== false)
    .forEach((block) => {
      const id = getEntityId(block)

      if (!id || blocks.has(String(id))) {
        return
      }

      blocks.set(String(id), {
        value: String(id),
        label: block.code ? `${block.code} · ${block.name}` : block.name,
      })
    })

  return [...blocks.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const needsForAssignments = computed(() => buildNeedsFromRows(needRows.value, needs.value))

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

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}

function normalizeWorkBlock(block) {
  if (!block || typeof block !== 'object') {
    return null
  }

  const id = getEntityId(block.id || block)

  if (!id) {
    return null
  }

  return {
    ...block,
    id,
  }
}

function mergeWorkBlocks(nextBlocks) {
  const map = new Map()

  workBlocks.value.forEach((block) => {
    const normalized = normalizeWorkBlock(block)

    if (normalized) {
      map.set(String(normalized.id), normalized)
    }
  })

  normalizeListResponse(nextBlocks).forEach((block) => {
    const normalized = normalizeWorkBlock(block)

    if (normalized) {
      map.set(String(normalized.id), normalized)
    }
  })

  workBlocks.value = [...map.values()].sort((a, b) => {
    const first = a.code ? `${a.code} · ${a.name}` : a.name || ''
    const second = b.code ? `${b.code} · ${b.name}` : b.name || ''

    return first.localeCompare(second)
  })
}

function showAlert(type, message) {
  alert.value = {
    id: Date.now(),
    type,
    message,
  }
}

function clearAlert() {
  alert.value = {
    id: 0,
    type: 'success',
    message: '',
  }
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (typeof data?.message === 'string') {
    return data.message
  }

  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0]

    if (Array.isArray(firstValue) && firstValue.length) {
      return firstValue.join(' ')
    }

    if (typeof firstValue === 'string') {
      return firstValue
    }
  }

  return fallback
}

function getEntityId(value) {
  if (value && typeof value === 'object') {
    return value.id
  }

  return value
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

function formatPeriod(item) {
  return `${formatDate(item.period_start)} — ${formatDate(item.period_end)}`
}

function normalizeDate(value) {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 10)
}

function normalizeTime(value) {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 5)
}

function getStatusLabel(status) {
  return statusLabels[status] || status || '—'
}

function getStatusVariant(status) {
  return statusVariants[status] || 'primary'
}

function getSquadName(squad) {
  if (squad && typeof squad === 'object') {
    return squad.name || 'Отряд не указан'
  }

  return squadsStore.squads.find((item) => String(item.id) === String(squad))?.name || 'Отряд не указан'
}

function getWorkBlockName(item) {
  if (item.work_block_code && item.work_block_name) {
    return `${item.work_block_code} · ${item.work_block_name}`
  }

  if (item.work_block?.code && item.work_block?.name) {
    return `${item.work_block.code} · ${item.work_block.name}`
  }

  return item.work_block_name || item.work_block?.name || item.block_name || 'Блок работ не указан'
}

function getMemberName(item) {
  if (item.member_name) {
    return item.member_name
  }

  if (item.full_name) {
    return item.full_name
  }

  const user = item.user || {}
  const parts = [user.last_name, user.first_name, user.middle_name].filter(Boolean)

  return parts.join(' ') || user.email || item.email || 'Участник без имени'
}

function normalizeMember(item) {
  return {
    membership: Number(item.membership || item.membership_id || item.id),
    userId: item.user_id || item.user?.id || item.user || null,
    memberName: getMemberName(item),
    roleName: item.role_name || item.role?.name || '',
  }
}

function normalizeMembersList(rawMembers) {
  return normalizeListResponse(rawMembers)
    .map(normalizeMember)
    .filter((item) => item.membership)
    .sort((a, b) => a.memberName.localeCompare(b.memberName))
}

function normalizeDays(rawDays) {
  return normalizeListResponse(rawDays)
    .map((item) => normalizeDate(item.date || item))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
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

function getNeedKindMap(dayNeeds) {
  const grouped = new Map()

  dayNeeds.forEach((need) => {
    const blockId = getNeedBlockId(need)
    const groupKey = blockId || 'without-block'

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, [])
    }

    grouped.get(groupKey).push(need)
  })

  const result = new Map()

  grouped.forEach((items) => {
    const sortedItems = [...items].sort((a, b) => (
      normalizeTime(a.starts_at).localeCompare(normalizeTime(b.starts_at))
    ))

    sortedItems.forEach((need, index) => {
      result.set(String(need.id), getNeedShiftKind(need, index))
    })
  })

  return result
}

function buildNeedRows(dayNeeds) {
  const grouped = new Map()
  const needKindMap = getNeedKindMap(dayNeeds)

  dayNeeds.forEach((need) => {
    const blockId = getNeedBlockId(need)

    if (!blockId) {
      return
    }

    if (!grouped.has(blockId)) {
      grouped.set(blockId, {
        localId: `need-${blockId}`,
        workBlock: String(blockId),
        primary: false,
        extra: false,
        requiredPeople: Number(need.required_people || 1),
      })
    }

    const row = grouped.get(blockId)
    const kind = needKindMap.get(String(need.id))

    row.requiredPeople = Math.max(row.requiredPeople, Number(need.required_people || 1))

    if (kind === 'extra') {
      row.extra = true
    } else {
      row.primary = true
    }
  })

  return [...grouped.values()].sort((a, b) => {
    const first = getWorkBlockOptionLabel(a.workBlock)
    const second = getWorkBlockOptionLabel(b.workBlock)

    return first.localeCompare(second)
  })
}

function getWorkBlockOptionLabel(blockId) {
  return workBlockOptions.value.find((item) => String(item.value) === String(blockId))?.label || ''
}

function buildNeedsFromRows(rows, sourceNeeds) {
  const templatesByBlockAndKind = new Map()
  const sourceKindMap = getNeedKindMap(sourceNeeds)

  sourceNeeds.forEach((need) => {
    const blockId = getNeedBlockId(need)
    const kind = sourceKindMap.get(String(need.id)) || getNeedShiftKind(need)

    if (!blockId) {
      return
    }

    templatesByBlockAndKind.set(`${blockId}:${kind}`, need)
  })

  return rows.flatMap((row) => {
    const items = []

    if (row.primary) {
      const template = templatesByBlockAndKind.get(`${row.workBlock}:primary`) || {}

      items.push({
        ...template,
        id: template.id || `local-${row.localId}-primary`,
        work_block: row.workBlock,
        work_block_id: row.workBlock,
        work_block_name: getWorkBlockOptionLabel(row.workBlock),
        shift_kind: 'primary',
        starts_at: template.starts_at || '09:00',
        ends_at: template.ends_at || '18:00',
        required_people: Number(row.requiredPeople || 1),
        entries: template.entries || [],
      })
    }

    if (row.extra) {
      const template = templatesByBlockAndKind.get(`${row.workBlock}:extra`) || {}

      items.push({
        ...template,
        id: template.id || `local-${row.localId}-extra`,
        work_block: row.workBlock,
        work_block_id: row.workBlock,
        work_block_name: getWorkBlockOptionLabel(row.workBlock),
        shift_kind: 'extra',
        starts_at: template.starts_at || '18:00',
        ends_at: template.ends_at || '21:00',
        required_people: Number(row.requiredPeople || 1),
        entries: template.entries || [],
      })
    }

    return items
  })
}

function collectEntries(dayNeeds) {
  return dayNeeds.flatMap((need) => (
    normalizeListResponse(need.entries).map((entry) => ({
      ...entry,
      need_id: entry.need || entry.need_id || need.id,
      work_block: entry.work_block || getNeedBlockId(need),
      work_block_name: entry.work_block_name || getWorkBlockName(need),
      starts_at: entry.starts_at || need.starts_at,
      ends_at: entry.ends_at || need.ends_at,
    }))
  ))
}

function buildAssignmentRows(dayNeeds, allMembers) {
  const needKindMap = getNeedKindMap(dayNeeds)
  const entries = collectEntries(dayNeeds)

  return allMembers.map((member) => {
    const memberEntries = entries.filter((entry) => (
      String(entry.membership || entry.membership_id) === String(member.membership)
    ))

    const primaryEntry = memberEntries.find((entry) => (
      needKindMap.get(String(entry.need || entry.need_id)) === 'primary'
    ))

    const extraEntry = memberEntries.find((entry) => (
      needKindMap.get(String(entry.need || entry.need_id)) === 'extra'
    ))

    const firstEntry = primaryEntry || extraEntry || memberEntries[0] || null

    return {
      membership: member.membership,
      userId: member.userId,
      memberName: member.memberName,
      roleName: member.roleName,
      primary: Boolean(primaryEntry),
      extra: Boolean(extraEntry),
      workBlock: firstEntry?.work_block ? String(firstEntry.work_block) : '',
    }
  })
}

function normalizeNeedsForSnapshot(rows) {
  return rows
    .filter((row) => row.workBlock && (row.primary || row.extra))
    .map((row) => ({
      workBlock: String(row.workBlock),
      primary: Boolean(row.primary),
      extra: Boolean(row.extra),
      requiredPeople: Number(row.requiredPeople || 1),
    }))
    .sort((a, b) => a.workBlock.localeCompare(b.workBlock))
}

function normalizeRowsForSnapshot(rows) {
  return rows
    .map((row) => ({
      membership: Number(row.membership),
      primary: Boolean(row.primary),
      extra: Boolean(row.extra),
      workBlock: row.workBlock ? String(row.workBlock) : '',
    }))
    .sort((a, b) => a.membership - b.membership)
}

function applyEditData(data) {
  schedule.value = data.schedule || data
  days.value = normalizeDays(data.days)
  selectedDate.value = normalizeDate(data.selected_date || selectedDate.value || days.value[0])
  needs.value = normalizeListResponse(data.needs)
  const editDataBlocks = normalizeListResponse(data.work_blocks || data.workBlocks)

  if (editDataBlocks.length) {
    mergeWorkBlocks(editDataBlocks)
  }
  members.value = normalizeMembersList(data.members)

  needRows.value = buildNeedRows(needs.value)
  assignmentRows.value = buildAssignmentRows(needs.value, members.value)
  originalNeedsSnapshot.value = JSON.stringify(normalizeNeedsForSnapshot(needRows.value))
  originalRowsSnapshot.value = JSON.stringify(normalizeRowsForSnapshot(assignmentRows.value))
}

async function fetchWorkBlocksForSchedule(squadId) {
  if (!squadId) {
    workBlocks.value = []
    return
  }

  workBlocksLoading.value = true

  try {
    const response = await apiClient.get('/api/v1/rosters/work-blocks/', {
      params: {
        squad: squadId,
      },
    })

    const blocks = normalizeListResponse(response.data)
      .filter((block) => {
        const blockSquadId = getEntityId(block.squad)

        return !blockSquadId || String(blockSquadId) === String(squadId)
      })

    mergeWorkBlocks(blocks)
  } catch (error) {
    showAlert('danger', getErrorMessage(error, 'Не удалось загрузить блоки работ отряда'))
  } finally {
    workBlocksLoading.value = false
  }
}

async function fetchSquadMembers(squadId) {
  if (!squadId) {
    return []
  }

  const response = await apiClient.get(`/api/v1/squads/${squadId}/members/`)

  return normalizeMembersList(response.data)
}

async function loadEditData(date = selectedDate.value) {
  const result = await scheduleStore.fetchScheduleEditData(scheduleId.value, date)

  if (!result.success) {
    showAlert('danger', result.message)
    return
  }

  applyEditData(result.data)

  const currentSquadId = getEntityId(schedule.value?.squad)

  await fetchWorkBlocksForSchedule(currentSquadId)

  if (!members.value.length && schedule.value?.squad) {
    try {
      members.value = await fetchSquadMembers(schedule.value.squad)
      assignmentRows.value = buildAssignmentRows(needs.value, members.value)
      originalRowsSnapshot.value = JSON.stringify(normalizeRowsForSnapshot(assignmentRows.value))
    } catch (error) {
      showAlert('danger', getErrorMessage(error, 'Не удалось загрузить участников отряда'))
    }
  }
}

async function reloadCurrentDay() {
  if (isDirty.value) {
    const confirmed = await confirmModalRef.value.open({
      title: 'Обновить данные?',
      message: 'Несохранённые изменения по текущему дню будут потеряны.',
    })

    if (!confirmed) {
      return
    }
  }

  await loadEditData(selectedDate.value)
}

async function handleSelectDate(date) {
  if (date === selectedDate.value) {
    return
  }

  if (isDirty.value) {
    const confirmed = await confirmModalRef.value.open({
      title: 'Перейти к другому дню?',
      message: 'Несохранённые изменения по текущему дню будут потеряны.',
    })

    if (!confirmed) {
      return
    }
  }

  selectedDate.value = date
  await loadEditData(date)
}

function validateNeeds(rows) {
  const activeRows = rows.filter((row) => row.workBlock && (row.primary || row.extra))
  const usedBlocks = new Set()

  activeRows.forEach((row) => {
    if (usedBlocks.has(String(row.workBlock))) {
      throw new Error('Один и тот же блок работ не должен повторяться в потребностях дня')
    }

    usedBlocks.add(String(row.workBlock))

    if (!Number(row.requiredPeople) || Number(row.requiredPeople) < 1) {
      throw new Error('Количество людей в потребности должно быть больше нуля')
    }
  })

  if (!activeRows.length) {
    throw new Error('Добавьте хотя бы одну потребность на выбранный день')
  }
}

function buildNeedsPayload() {
  validateNeeds(needRows.value)

  return {
    date: selectedDate.value,
    needs: needRows.value
      .filter((row) => row.workBlock && (row.primary || row.extra))
      .map((row) => ({
        work_block: Number(row.workBlock),
        primary: Boolean(row.primary),
        extra: Boolean(row.extra),
        required_people: Number(row.requiredPeople || 1),
      })),
  }
}

async function handleSaveNeeds() {
  if (isReadonly.value) {
    showAlert('warning', 'Опубликованный или архивный график нельзя редактировать')
    return
  }

  let payload

  try {
    payload = buildNeedsPayload()
  } catch (error) {
    showAlert('danger', error.message || 'Проверьте потребности')
    return
  }

  const confirmed = await confirmModalRef.value.open({
    title: 'Сохранить потребности?',
    message: `Потребности на ${formatDate(selectedDate.value)} будут перезаписаны. Назначения по этому дню лучше проверить после сохранения.`,
  })

  if (!confirmed) {
    return
  }

  const result = await scheduleStore.saveScheduleDayNeeds(scheduleId.value, payload)

  if (!result.success) {
    showAlert('danger', result.message)
    return
  }

  showAlert('success', result.message)
  await loadEditData(selectedDate.value)
}

async function handleResetNeeds() {
  const confirmed = await confirmModalRef.value.open({
    title: 'Сбросить изменения потребностей?',
    message: 'Все несохранённые изменения потребностей по текущему дню будут отменены.',
  })

  if (!confirmed) {
    return
  }

  needRows.value = buildNeedRows(needs.value)
  originalNeedsSnapshot.value = JSON.stringify(normalizeNeedsForSnapshot(needRows.value))
}

async function handleRemoveNeedRow(row) {
  const blockName = getWorkBlockOptionLabel(row.workBlock) || 'выбранный блок'

  const confirmed = await confirmModalRef.value.open({
    title: 'Удалить потребность?',
    message: `Потребность для блока “${blockName}” будет удалена из черновика. Чтобы применить изменение, сохраните потребности.`,
  })

  if (!confirmed) {
    return
  }

  needRows.value = needRows.value.filter((item) => item.localId !== row.localId)
}

function validateAssignments(rows) {
  rows.forEach((row) => {
    if ((row.primary || row.extra) && !row.workBlock) {
      throw new Error(`Выберите блок работ для участника ${row.memberName}`)
    }
  })
}

function buildAssignmentsPayload() {
  validateAssignments(assignmentRows.value)

  return {
    date: selectedDate.value,
    assignments: assignmentRows.value
      .filter((row) => row.primary || row.extra)
      .map((row) => ({
        membership: Number(row.membership),
        work_block: Number(row.workBlock),
        primary: Boolean(row.primary),
        extra: Boolean(row.extra),
      })),
  }
}

async function handleSaveAssignments() {
  if (isReadonly.value) {
    showAlert('warning', 'Опубликованный или архивный график нельзя редактировать')
    return
  }

  if (isNeedsDirty.value) {
    showAlert('warning', 'Сначала сохраните изменения потребностей по выбранному дню')
    return
  }

  let payload

  try {
    payload = buildAssignmentsPayload()
  } catch (error) {
    showAlert('danger', error.message || 'Проверьте назначения')
    return
  }

  const confirmed = await confirmModalRef.value.open({
    title: 'Сохранить изменения?',
    message: `Назначения на ${formatDate(selectedDate.value)} будут перезаписаны.`,
  })

  if (!confirmed) {
    return
  }

  const result = await scheduleStore.saveScheduleDayAssignments(scheduleId.value, payload)

  if (!result.success) {
    showAlert('danger', result.message)
    return
  }

  showAlert('success', result.message)
  await loadEditData(selectedDate.value)
}

async function handleResetAssignments() {
  const confirmed = await confirmModalRef.value.open({
    title: 'Сбросить изменения?',
    message: 'Все несохранённые изменения назначений по текущему дню будут отменены.',
  })

  if (!confirmed) {
    return
  }

  assignmentRows.value = buildAssignmentRows(needs.value, members.value)
  originalRowsSnapshot.value = JSON.stringify(normalizeRowsForSnapshot(assignmentRows.value))
}

async function handlePublish() {
  if (isDirty.value) {
    showAlert('warning', 'Сначала сохраните изменения по текущему дню')
    return
  }

  const confirmed = await confirmModalRef.value.open({
    title: 'Опубликовать график?',
    message: 'После публикации график станет доступен участникам.',
  })

  if (!confirmed) {
    return
  }

  publishing.value = true

  const result = await scheduleStore.publishSchedule(scheduleId.value)

  publishing.value = false

  if (!result.success) {
    showAlert('danger', result.message)
    return
  }

  showAlert('success', result.message)
  await loadEditData(selectedDate.value)
}

async function goBack() {
  if (isDirty.value) {
    const confirmed = await confirmModalRef.value.open({
      title: 'Выйти без сохранения?',
      message: 'Несохранённые изменения по текущему дню будут потеряны.',
    })

    if (!confirmed) {
      return
    }
  }

  router.push({ name: 'dashboard-schedules' })
}

onMounted(async () => {
  await Promise.allSettled([
    squadsStore.fetchSquads?.(),
    loadEditData(),
  ])
})
</script>

<style scoped>
.schedule-edit-page {
  display: grid;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.page-header h1 {
  margin: 0;
  color: var(--text-color);
}

.page-subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}

.back-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent-color);
  cursor: pointer;
  font: inherit;
  margin-bottom: 0.45rem;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }
}
</style>
