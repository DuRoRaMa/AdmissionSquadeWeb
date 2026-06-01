<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ title }}</h3>

          <button
            type="button"
            class="close-btn"
            :disabled="loading"
            @click="close"
          >
            &times;
          </button>
        </div>

        <div class="modal-body">
          <p v-if="message" class="modal-message">
            {{ message }}
          </p>

          <slot />
        </div>

        <div class="modal-footer">
          <AppButton
            type="button"
            variant="secondary"
            :disabled="loading"
            @click="close"
          >
            {{ cancelText }}
          </AppButton>

          <AppButton
            type="button"
            variant="primary"
            :loading="loading"
            :disabled="confirmDisabled"
            @click="confirm"
          >
            {{ loading ? loadingText : confirmText }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps({
  confirmDisabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: 'Проверка...',
  },
})

const visible = ref(false)

let resolvePromise = null

const title = ref('Подтверждение')
const message = ref('Вы уверены?')
const confirmText = ref('Подтвердить')
const cancelText = ref('Отмена')

function open(options = {}) {
  title.value = options.title || 'Подтверждение'
  message.value = options.message || 'Вы уверены?'
  confirmText.value = options.confirmText || 'Подтвердить'
  cancelText.value = options.cancelText || 'Отмена'

  visible.value = true

  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

function confirm() {
  if (props.confirmDisabled || props.loading) return

  visible.value = false

  if (resolvePromise) resolvePromise(true)

  resolvePromise = null
}

function close() {
  if (props.loading) return

  visible.value = false

  if (resolvePromise) resolvePromise(false)

  resolvePromise = null
}

defineExpose({ open })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
}

.modal-container {
  background: var(--card-bg-solid);
  border-radius: var(--card-border-radius);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--header-footer-bg);
  border-bottom: 1px solid var(--card-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.15rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.25rem;
}

.close-btn:hover:not(:disabled) {
  color: var(--text-color);
}

.close-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-body {
  padding: 1rem;
  color: var(--text-color);
}

.modal-message {
  margin: 0 0 1rem;
  color: var(--text-muted);
}

.modal-footer {
  padding: 1rem;
  background: var(--header-footer-bg);
  border-top: 1px solid var(--card-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
