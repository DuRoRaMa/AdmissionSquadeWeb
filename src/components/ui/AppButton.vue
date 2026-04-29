<template>
  <button
    :class="['btn', `btn-${variant}`, { disabled: disabled || loading, 'is-loading': loading }]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span
      v-if="loading"
      class="spinner-border spinner-border-sm me-2"
      role="status"
      aria-hidden="true"
    ></span>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  disabled: Boolean,
  loading: Boolean,
})
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: var(--btn-padding-y) var(--btn-padding-x);
  border: 1px solid transparent;
  border-radius: var(--btn-border-radius);
  font-weight: var(--btn-font-weight);
  font-size: 1rem;
  line-height: 1.5;
  cursor: pointer;
  transition: var(--btn-transition);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  background-size: 200% 200%;
  background-position: 0% 0%;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  background-position: 100% 100%;
}

.btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.btn:disabled,
.btn.disabled {
  background: var(--btn-disabled-bg, #e9ecef) !important;
  border-color: var(--btn-disabled-border-color, #dee2e6) !important;
  color: var(--btn-disabled-color, #8a8f98) !important;
  opacity: 1;
  pointer-events: none;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-primary {
  background: var(--btn-primary-gradient, var(--accent-gradient));
  color: white;
}

.btn-secondary {
  background: transparent;
  border-color: var(--accent-color, #0d6efd);
  color: var(--accent-color, #0d6efd);
  box-shadow: none;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--btn-primary-gradient, var(--accent-gradient));
  border-color: transparent;
  color: white;
}

.btn-success {
  background: var(--btn-success-gradient, linear-gradient(135deg, #198754, #146c43));
  color: white;
}

.btn-danger {
  background: var(--btn-danger-gradient, linear-gradient(135deg, #dc3545, #b02a37));
  color: white;
}

.btn-warning {
  background: var(--btn-warning-gradient, linear-gradient(135deg, #ffc107, #ff9800));
  color: #2b2111;
}

.btn-info {
  background: var(--btn-info-gradient, linear-gradient(135deg, #0dcaf0, #0aa2c0));
  color: #073642;
}

.btn-light {
  background: var(--btn-primary-gradient, var(--accent-gradient));
  color: white;
}

.btn-dark {
  background: var(--btn-danger-gradient, linear-gradient(135deg, #dc3545, #b02a37));
  color: white;
}

.btn-link {
  background: transparent;
  border-color: transparent;
  color: var(--accent-color, var(--btn-link-color, #0d6efd));
  box-shadow: none;
  padding-right: 0;
  padding-left: 0;
  border-radius: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.btn-link:hover:not(:disabled) {
  background: transparent;
  color: var(--btn-link-hover-color, var(--accent-color, #0d6efd));
  transform: translateY(-1px);
  box-shadow: none;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.spinner-border {
  width: 1.2rem;
  height: 1.2rem;
  border-width: 0.2rem;
  border-color: currentColor transparent currentColor transparent;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 576px) {
  .btn {
    padding: calc(var(--btn-padding-y) * 0.8) calc(var(--btn-padding-x) * 0.8);
    font-size: 0.9rem;
  }
}
</style>