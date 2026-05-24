<template>
  <details class="app-accordion-item" :open="open">
    <summary class="app-accordion-item__summary">
      <span class="app-accordion-item__main">
        <span class="app-accordion-item__title-row">
          <slot name="title">
            <span class="app-accordion-item__title">{{ title }}</span>
          </slot>
        </span>

        <span v-if="subtitle || $slots.subtitle" class="app-accordion-item__subtitle">
          <slot name="subtitle">
            {{ subtitle }}
          </slot>
        </span>
      </span>

      <span v-if="$slots.meta" class="app-accordion-item__meta">
        <slot name="meta" />
      </span>

      <span class="app-accordion-item__arrow" aria-hidden="true">▾</span>
    </summary>

    <div class="app-accordion-item__body">
      <slot />
    </div>
  </details>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  open: Boolean,
})
</script>

<style scoped>
.app-accordion-item {
  background: var(--card-bg-solid);
  border: var(--card-border);
  border-radius: var(--card-border-radius);
  color: var(--text-color);
  overflow: hidden;
}

.app-accordion-item + .app-accordion-item {
  margin-top: 0.75rem;
}

.app-accordion-item__summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--header-footer-bg);
  cursor: pointer;
  list-style: none;
}

.app-accordion-item__summary::-webkit-details-marker {
  display: none;
}

.app-accordion-item__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.app-accordion-item__title-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-accordion-item__title {
  color: var(--text-color);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-accordion-item__subtitle {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.app-accordion-item__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.app-accordion-item__arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.app-accordion-item[open] .app-accordion-item__arrow {
  transform: rotate(180deg);
}

.app-accordion-item__body {
  padding: 1rem;
  border-top: 1px solid var(--card-border-color, rgba(255, 255, 255, 0.08));
}

@media (max-width: 768px) {
  .app-accordion-item__summary {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .app-accordion-item__meta {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
