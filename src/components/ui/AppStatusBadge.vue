<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: '',
    validator: (value) => !value || [
      'primary',
      'secondary',
      'success',
      'danger',
      'warning',
      'info',
      'light',
      'dark',
    ].includes(value),
  },
  status: {
    type: [String, Number, Boolean],
    default: '',
  },
  labels: {
    type: Object,
    default: () => ({}),
  },
  variants: {
    type: Object,
    default: () => ({}),
  },
  fallbackLabel: {
    type: String,
    default: '—',
  },
  fallbackVariant: {
    type: String,
    default: 'secondary',
  },
})

const normalizedStatus = computed(() => String(props.status ?? '').trim())

const resolvedText = computed(() => {
  if (props.text) return props.text
  if (!normalizedStatus.value) return props.fallbackLabel

  return props.labels[normalizedStatus.value] || normalizedStatus.value
})

const resolvedVariant = computed(() => {
  if (props.variant) return props.variant
  if (!normalizedStatus.value) return props.fallbackVariant

  return props.variants[normalizedStatus.value] || props.fallbackVariant
})
</script>

<template>
  <span :class="['app-status-badge', `app-status-badge--${resolvedVariant}`]">
    {{ resolvedText }}
  </span>
</template>

<style scoped>
.app-status-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 26px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.app-status-badge--primary {
  background: color-mix(in srgb, var(--accent-color, #0d6efd) 14%, transparent);
  color: var(--accent-color, #0d6efd);
}

.app-status-badge--secondary {
  background: var(--btn-disabled-bg, #e9ecef);
  color: var(--text-muted, #6c757d);
}

.app-status-badge--success {
  background: color-mix(in srgb, var(--success-color, #198754) 14%, transparent);
  color: var(--success-color, #198754);
}

.app-status-badge--danger {
  background: color-mix(in srgb, var(--danger-color, #dc3545) 14%, transparent);
  color: var(--danger-color, #dc3545);
}

.app-status-badge--warning {
  background: color-mix(in srgb, var(--warning-color, #ffc107) 22%, transparent);
  color: var(--warning-text-color, #8a5a00);
}

.app-status-badge--info {
  background: color-mix(in srgb, var(--info-color, #0dcaf0) 16%, transparent);
  color: var(--info-color, #0aa2c0);
}

.app-status-badge--light {
  background: var(--header-footer-bg);
  color: var(--text-color);
}

.app-status-badge--dark {
  background: color-mix(in srgb, var(--text-color, #212529) 14%, transparent);
  color: var(--text-color);
}
</style>