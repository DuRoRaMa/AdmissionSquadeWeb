<script setup>
defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(value)
  },
  dismissible: Boolean
})

defineEmits(['close'])
</script>

<template>
  <div :class="['alert', `alert-${variant}`, { 'alert-dismissible': dismissible }]" role="alert">
    <slot />
    <button v-if="dismissible" type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
  </div>
</template>

<style scoped>
.alert {
  position: relative;
  padding: var(--alert-padding);
  margin-bottom: 1rem;
  border-radius: var(--alert-border-radius);
  font-size: var(--alert-font-size);
  border: var(--alert-border);
  box-shadow: var(--alert-shadow);
  backdrop-filter: blur(var(--alert-blur));
  -webkit-backdrop-filter: blur(var(--alert-blur));
  transition: var(--alert-transition);
  overflow: hidden;
}
.alert:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
.alert-primary {
  background: var(--alert-primary-gradient);
  color: var(--alert-text-dark);
}
/* ... остальные варианты ... */
.alert-dismissible {
  padding-right: 3rem;
}
.btn-close {
  top: 20%;
  right: 1rem;
  transform: translateY(-50%);
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: rgba(0, 0, 0, 0.2);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--alert-transition);
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  font-size: var(--alert-close-size);
  line-height: 1;
  opacity: 0.7;
}
.btn-close::before,
.btn-close::after {
  content: '';
  position: absolute;
  width: 1rem;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
}
.btn-close::before {
  transform: rotate(45deg);
}
.btn-close::after {
  transform: rotate(-45deg);
}
.btn-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.3);
  transform: translateY(-50%) scale(1.1);
}
.alert-light .btn-close {
  background: rgba(0, 0, 0, 0.1);
}
.alert-light .btn-close:hover {
  background: rgba(0, 0, 0, 0.2);
}
.alert-enter-active,
.alert-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
@media (max-width: 576px) {
  .alert-dismissible {
    padding-right: 2.5rem;
  }
  .btn-close {
    right: 0.75rem;
    width: 1.25rem;
    height: 1.25rem;
  }
  .btn-close::before,
  .btn-close::after {
    width: 0.75rem;
  }
}
</style>
