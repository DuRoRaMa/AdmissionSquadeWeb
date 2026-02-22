<template>
  <div :class="['alert', `alert-${variant}`, { 'alert-dismissible': dismissible }]" role="alert">
    <slot />
    <button v-if="dismissible" type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
  </div>
</template>

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