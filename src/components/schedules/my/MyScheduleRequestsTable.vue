<script setup>
import { ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

defineProps({
  requests: {
    type: Array,
    default: () => [],
  },
})

const openedCommentIds = ref(new Set())

const requestTypeLabels = {
  cancel: 'Не могу выйти',
  swap: 'Прошу замену',
}

const statusLabels = {
  pending: 'Ожидает решения',
  approved: 'Одобрена',
  rejected: 'Отклонена',
}

const statusVariants = {
  pending: 'info',
  approved: 'success',
  rejected: 'danger',
}

function formatDateTime(value) {
  if (!value) return 'Дата не указана'

  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function hasReviewComment(item) {
  return Boolean(item.review_comment?.trim())
}

function getReviewCommentText(item) {
  if (item.status === 'pending') {
    return 'Решение по заявке еще не принято.'
  }

  return item.review_comment || 'Комментарий не указан.'
}

function isCommentOpened(id) {
  return openedCommentIds.value.has(id)
}

function toggleComment(id) {
  const nextOpenedIds = new Set(openedCommentIds.value)

  if (nextOpenedIds.has(id)) {
    nextOpenedIds.delete(id)
  } else {
    nextOpenedIds.add(id)
  }

  openedCommentIds.value = nextOpenedIds
}
</script>

<template>
  <div class="requests-table-wrap">
    <table class="requests-table">
      <thead>
        <tr>
          <th>Тип заявки</th>
          <th>Причина</th>
          <th>Статус</th>
          <th>Создана</th>
          <th>Комментарий</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="item in requests" :key="item.id">
          <tr class="requests-table__row">
            <td class="requests-table__cell requests-table__cell--nowrap">
              {{ requestTypeLabels[item.request_type] || item.request_type || 'Заявка' }}
            </td>

            <td class="requests-table__cell">
              <span class="requests-table__reason">
                {{ item.reason || 'Причина не указана' }}
              </span>
            </td>

            <td class="requests-table__cell requests-table__cell--nowrap">
              <AppStatusBadge
                :status="item.status"
                :labels="statusLabels"
                :variants="statusVariants"
              />
            </td>

            <td class="requests-table__cell requests-table__cell--nowrap">
              {{ formatDateTime(item.created_at) }}
            </td>

            <td class="requests-table__cell requests-table__cell--action">
              <AppButton
                type="button"
                variant="secondary"
                class="requests-table__comment-button"
                @click="toggleComment(item.id)"
              >
                {{ isCommentOpened(item.id) ? 'Скрыть' : 'Посмотреть' }}
              </AppButton>
            </td>
          </tr>

          <tr v-if="isCommentOpened(item.id)" class="requests-table__comment-row">
            <td colspan="5">
              <div
                class="requests-table__comment"
                :class="{ 'requests-table__comment--empty': !hasReviewComment(item) }"
              >
                <div class="requests-table__comment-title">
                  Комментарий по решению
                </div>

                <div class="requests-table__comment-text">
                  {{ getReviewCommentText(item) }}
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.requests-table-wrap {
  overflow-x: auto;
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-color);
}

.requests-table th,
.requests-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.requests-table th {
  color: var(--text-muted);
  font-weight: 700;
  white-space: nowrap;
}

.requests-table__row {
  min-height: 52px;
}

.requests-table__cell {
  vertical-align: middle;
}

.requests-table__cell--nowrap {
  white-space: nowrap;
}

.requests-table__cell--action {
  width: 1%;
  text-align: right;
  white-space: nowrap;
}

.requests-table__reason {
  display: inline-block;
  max-width: 420px;
  line-height: 1.35;
}

.requests-table__comment-button {
  min-width: 82px;
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 0.82rem;
  line-height: 1;
  white-space: nowrap;
}

.requests-table__comment-row td {
  padding-top: 0;
  vertical-align: top;
}

.requests-table__comment {
  padding: 12px 14px;
  border-radius: 14px;
  border: var(--card-border);
  background: rgba(255, 255, 255, 0.04);
}

.requests-table__comment--empty {
  opacity: 0.75;
}

.requests-table__comment-title {
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.requests-table__comment-text {
  color: var(--text-color);
  line-height: 1.45;
  white-space: pre-wrap;
}
</style>
