<template>
  <div :class="['app-stat-card', `app-stat-card--${variant}`]">
    <span class="app-stat-card__label">{{ label }}</span>
    <strong class="app-stat-card__value">{{ value }}</strong>
    <span v-if="hint" class="app-stat-card__hint">{{ hint }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  hint: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'danger', 'secondary'].includes(value),
  },
})
</script>

<style scoped>
.app-stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background: var(--header-footer-bg);
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  color: var(--text-color);
}

.app-stat-card::after {
  content: '';
  display: block;
  width: 100%;
  height: 3px;
  margin-top: 0.5rem;
  border-radius: 3px;
  background: var(--accent-gradient);
}

.app-stat-card--success::after {
  background: var(--success-color, #198754);
}

.app-stat-card--danger::after {
  background: var(--danger-color, #dc3545);
}

.app-stat-card--secondary::after {
  background: var(--text-muted, #6c757d);
}

.app-stat-card__label {
  color: var(--text-muted);
  font-size: var(--label-font-size);
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.app-stat-card__value {
  color: var(--text-color);
  font-size: 1.5rem;
  line-height: 1.2;
}

.app-stat-card__hint {
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>