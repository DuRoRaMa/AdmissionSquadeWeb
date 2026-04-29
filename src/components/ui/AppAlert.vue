<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  message: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'danger', 'warning', 'info', 'primary'].includes(value),
  },
  type: {
    type: String,
    default: '',
  },
  dismissible: {
    type: Boolean,
    default: true,
  },
  autoClose: {
    type: Boolean,
    default: true,
  },
  duration: {
    type: Number,
    default: 10000,
  },
})

const emit = defineEmits(['close'])

const isShown = ref(true)
let closeTimer = null

const normalizedVariant = computed(() => props.type || props.variant)

const iconName = computed(() => {
  const icons = {
    success: 'check',
    danger: 'close',
    warning: 'warning',
    info: 'info',
    primary: 'info',
  }

  return icons[normalizedVariant.value] || 'info'
})

watch(
  () => [props.message, normalizedVariant.value, props.duration, props.autoClose],
  () => {
    isShown.value = true
    startTimer()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimer()
})

function startTimer() {
  clearTimer()

  if (!props.autoClose || props.duration <= 0) return

  closeTimer = window.setTimeout(() => {
    close()
  }, props.duration)
}

function clearTimer() {
  if (!closeTimer) return

  window.clearTimeout(closeTimer)
  closeTimer = null
}

function close() {
  clearTimer()
  isShown.value = false
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="app-alert-toast">
      <aside
        v-if="isShown"
        :class="['app-alert', `app-alert--${normalizedVariant}`]"
        :role="normalizedVariant === 'danger' ? 'alert' : 'status'"
      >
        <span class="app-alert__icon" aria-hidden="true">
          <AppIcon :name="iconName" size="18" />
        </span>

        <div class="app-alert__content">
          <slot>{{ message }}</slot>
        </div>

        <button
          v-if="dismissible"
          type="button"
          class="app-alert__close"
          aria-label="Закрыть уведомление"
          @click="close"
        >
          <AppIcon name="close" size="16" />
        </button>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-alert {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 11000;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.75rem;
  width: min(420px, calc(100vw - 32px));
  padding: 1rem;
  border: var(--card-border);
  border-left: 4px solid var(--accent-color, #0d6efd);
  border-radius: var(--card-border-radius);
  background: var(--card-bg-solid);
  color: var(--text-color);
  box-shadow: var(--card-shadow);
}

.app-alert--success {
  border-left-color: var(--success-color, #198754);
}

.app-alert--danger {
  border-left-color: var(--danger-color, #dc3545);
}

.app-alert--warning {
  border-left-color: var(--warning-color, #ffc107);
}

.app-alert--info,
.app-alert--primary {
  border-left-color: var(--accent-color, #0d6efd);
}

.app-alert__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--accent-color, #0d6efd);
}

.app-alert--success .app-alert__icon {
  color: var(--success-color, #198754);
}

.app-alert--danger .app-alert__icon {
  color: var(--danger-color, #dc3545);
}

.app-alert--warning .app-alert__icon {
  color: var(--warning-color, #b7791f);
}

.app-alert__content {
  min-width: 0;
  padding-top: 0.1rem;
  font-weight: 600;
  line-height: 1.4;
}

.app-alert__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.app-alert__close:hover {
  color: var(--text-color);
  opacity: 0.8;
}

.app-alert-toast-enter-active,
.app-alert-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.app-alert-toast-enter-from,
.app-alert-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 576px) {
  .app-alert {
    top: 16px;
    right: 16px;
  }
}
</style>
