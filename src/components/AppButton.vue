<template>
  <button
    :class="['btn', `btn-${variant}`, { 'disabled': disabled || loading, 'position-relative': loading }]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'link'].includes(value)
  },
  disabled: Boolean,
  loading: Boolean
})
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--btn-padding-y) var(--btn-padding-x);
  border: none;
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
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  background-position: 100% 100%;
}
.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.btn:disabled,
.btn.disabled {
  opacity: var(--btn-disabled-opacity);
  pointer-events: none;
  cursor: not-allowed;
}
.btn-primary {
  background: var(--btn-primary-gradient);
  color: white;
}
/* ... остальные варианты ... */
.btn-link {
  background: transparent;
  color: var(--btn-link-color);
  box-shadow: none;
  padding: var(--btn-padding-y) 0;
  border-radius: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.btn-link:hover {
  background: transparent;
  color: var(--btn-link-hover-color);
  transform: translateY(-1px);
  box-shadow: none;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.btn-link:active {
  transform: translateY(0);
}
.spinner-border {
  width: 1.2rem;
  height: 1.2rem;
  border-width: 0.2rem;
  border-color: currentColor transparent currentColor transparent;
  animation: spinner-border 0.75s linear infinite;
}
@keyframes spinner-border {
  to { transform: rotate(360deg); }
}
@media (max-width: 576px) {
  .btn {
    padding: calc(var(--btn-padding-y) * 0.8) calc(var(--btn-padding-x) * 0.8);
    font-size: 0.9rem;
  }
}
</style>