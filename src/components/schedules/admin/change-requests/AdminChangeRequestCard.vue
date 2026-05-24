<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const props = defineProps({
  request: {
    type: Object,
    required: true,
  },
  loading: Boolean,
})

const emit = defineEmits(['approve', 'reject', 'validation-error'])

const reviewComment = ref('')
const isReviewCommentInvalid = ref(false)
const reviewCommentField = ref(null)
const confirmModal = ref(null)

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

const isResolved = computed(() => props.request.status !== 'pending')

const requestedFullName = computed(() => {
  return (
    props.request.requested_full_name ||
    props.request.requested_by_full_name ||
    props.request.member_full_name ||
    props.request.entry?.member_name ||
    props.request.entry?.membership?.full_name ||
    ''
  )
})

const requestTypeLabel = computed(() => {
  return requestTypeLabels[props.request.request_type] || props.request.request_type || 'Заявка'
})

watch(
  () => props.request.id,
  () => {
    reviewComment.value = ''
    isReviewCommentInvalid.value = false
  },
)

function clearReviewCommentError() {
  if (reviewComment.value.trim()) {
    isReviewCommentInvalid.value = false
  }
}

async function markReviewCommentAsInvalid() {
  isReviewCommentInvalid.value = true

  emit('validation-error', 'Для отклонения заявки нужно указать комментарий.')

  await nextTick()

  reviewCommentField.value?.focus()
}

async function approveRequest() {
  if (isResolved.value || props.loading) {
    return
  }

  const isConfirmed = await confirmModal.value.open({
    title: 'Подтверждение действия',
    message: 'Одобрить эту заявку?',
  })

  if (!isConfirmed) {
    return
  }

  emit('approve', props.request.id)
}

async function rejectRequest() {
  if (isResolved.value || props.loading) {
    return
  }

  if (!reviewComment.value.trim()) {
    await markReviewCommentAsInvalid()
    return
  }

  const isConfirmed = await confirmModal.value.open({
    title: 'Подтверждение действия',
    message: 'Отклонить эту заявку?',
  })

  if (!isConfirmed) {
    return
  }

  emit('reject', {
    id: props.request.id,
    reviewComment: reviewComment.value.trim(),
  })
}
</script>

<template>
  <article
    class="admin-request-card"
    :class="{ 'admin-request-card--resolved': isResolved }"
  >
    <div class="admin-request-card__main">
      <div class="admin-request-card__header">
        <div>
          <div class="admin-request-card__label">
            Запрашиваемый участник
          </div>

          <div class="admin-request-card__title">
            {{ requestedFullName || 'Не передано с сервера' }}
          </div>
        </div>

        <AppStatusBadge
          :status="request.status"
          :labels="statusLabels"
          :variants="statusVariants"
        />
      </div>

      <div class="admin-request-card__line">
        <span class="admin-request-card__label">Тип заявки</span>
        <span>{{ requestTypeLabel }}</span>
      </div>

      <div class="admin-request-card__line">
        <span class="admin-request-card__label">Причина</span>
        <span>{{ request.reason || 'Причина не указана' }}</span>
      </div>

      <div
        v-if="request.review_comment"
        class="admin-request-card__line"
      >
        <span class="admin-request-card__label">Комментарий решения</span>
        <span>{{ request.review_comment }}</span>
      </div>
    </div>

    <div class="admin-request-card__actions">
      <div class="admin-request-card__field">
        <textarea
          ref="reviewCommentField"
          v-model="reviewComment"
          class="admin-request-card__textarea"
          :class="{ 'admin-request-card__textarea--invalid': isReviewCommentInvalid }"
          rows="3"
          placeholder="Комментарий при отклонении"
          :disabled="isResolved || loading"
          :aria-invalid="isReviewCommentInvalid"
          @input="clearReviewCommentError"
        ></textarea>

        <div
          v-if="isReviewCommentInvalid"
          class="admin-request-card__field-error"
        >
          Для отклонения заявки нужно указать комментарий.
        </div>
      </div>

      <div class="admin-request-card__buttons">
        <AppButton
          type="button"
          variant="secondary"
          :loading="loading"
          :disabled="loading || isResolved"
          @click="approveRequest"
        >
          Одобрить
        </AppButton>

        <AppButton
          type="button"
          variant="danger"
          :loading="loading"
          :disabled="loading || isResolved"
          @click="rejectRequest"
        >
          Отклонить
        </AppButton>
      </div>
    </div>

    <ConfirmModal ref="confirmModal" />
  </article>
</template>

<style scoped>
.admin-request-card {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  border: var(--card-border);
  background: rgba(255, 255, 255, 0.04);
  transition:
    opacity 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.admin-request-card--resolved {
  opacity: 0.62;
}

.admin-request-card__main,
.admin-request-card__actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-request-card--resolved .admin-request-card__actions {
  opacity: 0.58;
}

.admin-request-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.admin-request-card__title {
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 800;
}

.admin-request-card__line {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text-color);
}

.admin-request-card__label {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.admin-request-card__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-request-card__textarea {
  width: 100%;
  min-height: 92px;
  border: var(--card-border);
  border-radius: 14px;
  background: var(--header-footer-bg);
  color: var(--text-color);
  padding: 12px 14px;
  resize: vertical;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.admin-request-card__textarea::placeholder {
  color: var(--text-muted);
}

.admin-request-card__textarea:focus {
  box-shadow: var(--input-focus-shadow);
}

.admin-request-card__textarea:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.admin-request-card__textarea--invalid {
  border-color: var(--danger-color, #dc3545);
  background: color-mix(in srgb, var(--danger-color, #dc3545) 12%, var(--header-footer-bg));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger-color, #dc3545) 22%, transparent);
}

.admin-request-card__field-error {
  color: var(--danger-color, #dc3545);
  font-size: 0.82rem;
  font-weight: 700;
}

.admin-request-card__buttons {
  display: flex;
  gap: 10px;
}

.admin-request-card__buttons > * {
  flex: 1;
}

@media (max-width: 900px) {
  .admin-request-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .admin-request-card__buttons {
    flex-direction: column;
  }
}
</style>
