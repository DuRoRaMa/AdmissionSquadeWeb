<script setup>
import { computed } from 'vue'

import AppButton from '../ui/AppButton.vue'
import AppCard from '../ui/AppCard.vue'
import AppIconButton from '../ui/AppIconButton.vue'
import AppStatusBadge from '../ui/AppStatusBadge.vue'

const props = defineProps({
  forms: {
    type: Array,
    default: () => [],
  },
  squads: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  downloadingFormId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['open', 'close', 'view-responses', 'download'])

const squadNameById = computed(() => new Map(props.squads.map((squad) => [String(squad.id), squad.name])))

const statusMap = {
  draft: { label: 'Черновик', variant: 'primary' },
  open: { label: 'Открыта', variant: 'success' },
  closed: { label: 'Закрыта', variant: 'danger' },
}

function getSquadName(form) {
  if (form.squad_name) return form.squad_name
  if (form.squad?.name) return form.squad.name

  return squadNameById.value.get(String(form.squad)) || 'Отряд не найден'
}

function getStatus(form) {
  return statusMap[form.status] || { label: form.status || 'Неизвестно', variant: 'secondary' }
}

function getPeriod(form) {
  if (!form.period_start && !form.period_end) return '—'

  return `${formatDate(form.period_start)} — ${formatDate(form.period_end)}`
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('ru-RU').format(date)
}

function getShiftsCount(form) {
  return (form.days || []).reduce((total, day) => total + (day.shifts?.length || 0), 0)
}

function isDownloading(form) {
  return String(props.downloadingFormId) === String(form.id)
}
</script>

<template>
  <AppCard>
    <template #header>
      Созданные формы
    </template>

    <div v-if="loading && !forms.length" class="availability-forms-table__empty">
      Загрузка форм...
    </div>

    <div v-else-if="!forms.length" class="availability-forms-table__empty">
      Формы пока не созданы.
    </div>

    <div v-else class="availability-forms-table__wrapper">
      <table class="availability-forms-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Отряд</th>
            <th>Период</th>
            <th>Дедлайн</th>
            <th>Статус</th>
            <th>Смен</th>
            <th>Управление</th>
            <th class="availability-forms-table__actions-heading">Ответы</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="form in forms" :key="form.id">
            <td>
              <strong>{{ form.title }}</strong>
            </td>

            <td>{{ getSquadName(form) }}</td>
            <td>{{ getPeriod(form) }}</td>
            <td>{{ formatDate(form.response_deadline) }}</td>

            <td>
              <AppStatusBadge
                :text="getStatus(form).label"
                :variant="getStatus(form).variant"
              />
            </td>

            <td>{{ getShiftsCount(form) }}</td>

            <td>
              <div class="availability-forms-table__manage-actions">
                <AppButton
                  v-if="form.status === 'draft'"
                  type="button"
                  variant="primary"
                  @click="emit('open', form)"
                >
                  Открыть
                </AppButton>

                <AppButton
                  v-if="form.status === 'open'"
                  type="button"
                  variant="danger"
                  @click="emit('close', form)"
                >
                  Закрыть
                </AppButton>
              </div>
            </td>

            <td>
              <div class="availability-forms-table__icon-actions">
                <AppIconButton
                  icon="eye"
                  title="Посмотреть ответы"
                  variant="primary"
                  @click="emit('view-responses', form)"
                />

                <AppIconButton
                  icon="download"
                  title="Скачать ответы"
                  variant="primary"
                  :loading="isDownloading(form)"
                  :disabled="Boolean(downloadingFormId) && !isDownloading(form)"
                  @click="emit('download', form)"
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
.availability-forms-table__empty {
  color: var(--text-muted);
}

.availability-forms-table__wrapper {
  overflow-x: auto;
}

.availability-forms-table {
  width: 100%;
  border-collapse: collapse;
}

.availability-forms-table th,
.availability-forms-table td {
  padding: 12px;
  border-bottom: 1px solid var(--card-border);
  text-align: left;
  vertical-align: middle;
  color: var(--text-color);
}

.availability-forms-table th {
  color: var(--text-muted);
  font-weight: 700;
  white-space: nowrap;
}

.availability-forms-table__actions-heading {
  text-align: right;
}

.availability-forms-table__manage-actions,
.availability-forms-table__icon-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.availability-forms-table__manage-actions :deep(.btn) {
  min-width: 112px;
  min-height: 36px;
  height: 36px;
  font-size: 0.85rem;
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}
</style>