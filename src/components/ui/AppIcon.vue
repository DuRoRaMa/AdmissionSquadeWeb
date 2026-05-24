<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 18,
  },
})

const iconSize = computed(() => `${props.size}`)

const paths = {
  download: [
    'M12 3v10',
    'M7 9l5 5 5-5',
    'M5 19h14',
  ],
  eye: [
    'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  edit: [
    'M12 20h9',
    'M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z',
  ],
  plus: [
    'M12 5v14',
    'M5 12h14',
  ],
  calendar: [
    'M8 3v4',
    'M16 3v4',
    'M4 9h16',
    'M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  ],
  trash: [
    'M4 7h16',
    'M10 11v6',
    'M14 11v6',
    'M6 7l1 14h10l1-14',
    'M9 7V4h6v3',
  ],
  close: [
    'M6 6l12 12',
    'M18 6L6 18',
  ],
  check: [
    'M20 6L9 17l-5-5',
  ],
  warning: [
    'M12 9v4',
    'M12 17h.01',
    'M10.3 4.3 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z',
  ],
  info: [
    'M12 16v-4',
    'M12 8h.01',
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  ],
}

const currentPaths = computed(() => paths[props.name] || paths.eye)
</script>

<template>
  <svg
    class="app-icon"
    :width="iconSize"
    :height="iconSize"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="path in currentPaths" :key="path" :d="path" />
  </svg>
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
}
</style>
