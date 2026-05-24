<script setup>
import { nextTick, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const props = defineProps({
  entryId: {
    type: [Number, String],
    required: true,
  },
  loading: Boolean,
})

const emit = defineEmits(['submit-request', 'validation-error'])

const confirmModal = ref(null)
const reasonField = ref(null)

const requestType = ref('cancel')
const reason = ref('')
const isReasonInvalid = ref(false)

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

function getRequestTypeLabel(value) {
  return requestTypeOptions.find((option) => option.value === value)?.label || 'Заявка'
}

function clearReasonError() {
  if (reason.value.trim()) {
    isReasonInvalid.value = false
  }
}

async function markReasonAsInvalid() {
  isReasonInvalid.value = true

  emit('validation-error', 'Перед отправкой заявки нужно указать причину.')

  await nextTick()

  reasonField.value?.focus()
}

async function submitRequest() {
  if (!reason.value.trim()) {
    await markReasonAsInvalid()
    return
  }

  isReasonInvalid.value = false

  const isConfirmed = await confirmModal.value.open({
    title: 'Подтверждение отправки',
    message: `Отправить заявку «${getRequestTypeLabel(requestType.value)}»?`,
  })

  if (!isConfirmed) {
    return
  }

  emit('submit-request', {
    entry: props.entryId,
    request_type: requestType.value,
    reason: reason.value.trim(),
  })

  reason.value = ''
  requestType.value = 'cancel'
  isReasonInvalid.value = false
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

    <div v-if="requestType === 'swap'" class="request-form__hint">
      Участника на замену выберем после правок бэка.
    </div>

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

      <div v-if="isReasonInvalid" class="request-form__field-error">
        Заполните причину заявки
      </div>
    </div>

    <AppButton
      type="submit"
      variant="primary"
      :loading="loading"
      :disabled="loading"
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

.request-form__hint {
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.35;
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
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.request-form__textarea::placeholder {
  color: var(--text-muted);
}

.request-form__textarea:focus {
  box-shadow: var(--input-focus-shadow);
}

.request-form__textarea--invalid {
  border-color: var(--danger-color, #dc3545);
  background: color-mix(in srgb, var(--danger-color, #dc3545) 12%, var(--header-footer-bg));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger-color, #dc3545) 22%, transparent);
}

.request-form__field-error {
  color: var(--danger-color, #dc3545);
  font-size: 0.82rem;
  font-weight: 700;
}

:deep(.custom-select) {
  max-width: none;
}
</style>
