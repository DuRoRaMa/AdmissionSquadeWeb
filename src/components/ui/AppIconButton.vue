<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'primary',
  },
  disabled: Boolean,
  loading: Boolean,
})
</script>

<template>
  <button
    type="button"
    :class="['app-icon-button', `app-icon-button--${variant}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    :title="title"
    :aria-label="title"
    :aria-busy="loading ? 'true' : 'false'"
    v-bind="$attrs"
  >
    <AppIcon :name="icon" size="18" />
  </button>
</template>

<style scoped>
.app-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  min-width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--accent-color, #0d6efd);
  cursor: pointer;
  transition: color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
}

.app-icon-button:hover:not(:disabled) {
  background: transparent;
  transform: translateY(-1px);
  opacity: 0.85;
}

.app-icon-button:active:not(:disabled) {
  transform: translateY(0);
}

.app-icon-button:disabled {
  color: var(--btn-disabled-color, #8a8f98);
  opacity: 1;
  cursor: not-allowed;
}

.app-icon-button--primary,
.app-icon-button--secondary {
  color: var(--accent-color, #0d6efd);
}

.app-icon-button--success {
  color: var(--success-color, #198754);
}

.app-icon-button--danger {
  color: var(--danger-color, #dc3545);
}

.app-icon-button--warning {
  color: var(--warning-color, #b7791f);
}

.app-icon-button--info {
  color: var(--info-color, #0aa2c0);
}

.app-icon-button.is-loading {
  opacity: 0.6;
}
</style>