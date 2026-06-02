<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useScheduleStore } from '@/stores/schedule'

const props = defineProps({
  entryId: {
    type: [Number, String],
    required: true,
  },
  loading: Boolean,
})

const emit = defineEmits(['submit-request', 'validation-error'])

const scheduleStore = useScheduleStore()

const confirmModal = ref(null)
const reasonField = ref(null)

const requestType = ref('cancel')
const reason = ref('')
const targetMembership = ref('')

const isReasonInvalid = ref(false)
const isTargetInvalid = ref(false)

const requestTypeOptions = [
  {
    value: 'cancel',
    label: 'Не могу выйти',
  },
  {
    value: 'swap',
    label: 'Прошу замену',
  },
]

const replacementCandidates = computed(() => {
  return scheduleStore.replacementCandidatesByEntry?.[props.entryId] || []
})

const replacementCandidateOptions = computed(() => {
  return replacementCandidates.value.map((item) => ({
    value: item.id,
    label: item.full_name || item.name || item.email || `Участник ${item.id}`,
  }))
})

const isCandidatesLoading = computed(() => {
  return String(scheduleStore.replacementCandidatesLoadingEntryId) === String(props.entryId)
})

const isSubmitDisabled = computed(() => {
  if (props.loading || isCandidatesLoading.value) {
    return true
  }

  if (requestType.value === 'swap' && !replacementCandidateOptions.value.length) {
    return true
  }

  return false
})

watch(requestType, async (value) => {
  targetMembership.value = ''
  isTargetInvalid.value = false

  if (value !== 'swap') {
    return
  }

  const result = await scheduleStore.fetchReplacementCandidates(props.entryId)

  if (!result.success) {
    emit('validation-error', result.message)
  }
})

function getRequestTypeLabel(value) {
  return requestTypeOptions.find((option) => option.value === value)?.label || 'Заявка'
}

function clearReasonError() {
  if (reason.value.trim()) {
    isReasonInvalid.value = false
  }
}

function clearTargetError() {
  if (targetMembership.value) {
    isTargetInvalid.value = false
  }
}

async function markReasonAsInvalid() {
  isReasonInvalid.value = true
  emit('validation-error', 'Перед отправкой заявки нужно указать причину.')

  await nextTick()
  reasonField.value?.focus()
}

function markTargetAsInvalid() {
  isTargetInvalid.value = true
  emit('validation-error', 'Для заявки на замену нужно выбрать участника.')
}

async function submitRequest() {
  if (!reason.value.trim()) {
    await markReasonAsInvalid()
    return
  }

  if (requestType.value === 'swap' && !targetMembership.value) {
    markTargetAsInvalid()
    return
  }

  isReasonInvalid.value = false
  isTargetInvalid.value = false

  const isConfirmed = await confirmModal.value.open({
    title: 'Подтверждение отправки',
    message: `Отправить заявку «${getRequestTypeLabel(requestType.value)}»?`,
  })

  if (!isConfirmed) {
    return
  }

  const payload = {
    entry: props.entryId,
    request_type: requestType.value,
    reason: reason.value.trim(),
  }

  if (requestType.value === 'swap') {
    payload.target_membership = targetMembership.value
  }

  emit('submit-request', payload)

  reason.value = ''
  requestType.value = 'cancel'
  targetMembership.value = ''
  isReasonInvalid.value = false
  isTargetInvalid.value = false
}
</script>

<template>
  <form class="request-form" @submit.prevent="submitRequest">
    <div class="request-form__title">
      Заявка
    </div>

    <AppSelect
      v-model="requestType"
      :options="requestTypeOptions"
      placeholder="Тип заявки"
      class="request-form__select"
    />

    <template v-if="requestType === 'swap'">
      <div v-if="isCandidatesLoading" class="request-form__hint">
        Загружаем участников на замену...
      </div>

      <template v-else>
        <AppSelect
          v-model="targetMembership"
          :options="replacementCandidateOptions"
          placeholder="Кто выйдет вместо вас"
          class="request-form__select"
          @update:model-value="clearTargetError"
        />

        <div
          v-if="isTargetInvalid"
          class="request-form__field-error"
        >
          Выберите участника на замену
        </div>

        <div
          v-else-if="!replacementCandidateOptions.length"
          class="request-form__hint"
        >
          Нет доступных участников для замены.
        </div>

        <div
          v-else
          class="request-form__hint"
        >
          Выберите участника, который сможет выйти вместо вас.
        </div>
      </template>
    </template>

    <div class="request-form__field">
      <textarea
        ref="reasonField"
        v-model="reason"
        class="request-form__textarea"
        :class="{ 'request-form__textarea--invalid': isReasonInvalid }"
        rows="2"
        placeholder="Причина"
        aria-label="Причина заявки"
        :aria-invalid="isReasonInvalid"
        @input="clearReasonError"
      ></textarea>

      <div
        v-if="isReasonInvalid"
        class="request-form__field-error"
      >
        Заполните причину заявки
      </div>
    </div>

    <AppButton
      type="submit"
      variant="primary"
      :loading="loading"
      :disabled="isSubmitDisabled"
    >
      Отправить
    </AppButton>

    <ConfirmModal ref="confirmModal" />
  </form>
</template>

<style scoped>
.request-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.request-form__title {
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 800;
}

.request-form__select {
  width: 100%;
}

.request-form__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.request-form__textarea {
  width: 100%;
  min-height: 60px;
  border: var(--card-border);
  border-radius: 14px;
  background: var(--header-footer-bg);
  color: var(--text-color);
  padding: 10px 12px;
  resize: vertical;
  outline: none;
}

.request-form__textarea::placeholder {
  color: var(--text-muted);
}

.request-form__textarea:focus {
  box-shadow: var(--input-focus-shadow);
}

.request-form__textarea--invalid {
  border-color: var(--danger-color, #dc3545);
}

.request-form__field-error {
  color: var(--danger-color, #dc3545);
  font-size: 0.82rem;
  font-weight: 700;
}

.request-form__hint {
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.35;
}

:deep(.custom-select) {
  max-width: none;
}
</style>
