<template>
  <aside class="section-sidebar card">
    <div class="section-sidebar__header">
      <p class="section-sidebar__eyebrow">Управление</p>
      <h3 class="section-sidebar__title">{{ title }}</h3>
      <p v-if="description" class="section-sidebar__description">
        {{ description }}
      </p>
    </div>

    <nav class="section-sidebar__nav">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="section-sidebar__link"
        :class="{ 'is-active': isActive(item) }"
      >
        <span class="section-sidebar__link-title">{{ item.label }}</span>
        <span v-if="item.caption" class="section-sidebar__link-caption">
          {{ item.caption }}
        </span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: 'Раздел',
  },
  description: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()

function isActive(item) {
  if (item.exact) {
    return route.path === item.to
  }
  return route.path.startsWith(item.to)
}
</script>

<style scoped>
.section-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 260px;
  padding: 1.25rem;
  border-radius: 20px;
}

.section-sidebar__header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.section-sidebar__eyebrow {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary);
}

.section-sidebar__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.section-sidebar__description {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.section-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-sidebar__link {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  text-decoration: none;
  color: var(--color-text);
  background: var(--color-surface-soft);
  border: 1px solid transparent;
  transition: 0.2s ease;
}

.section-sidebar__link:hover {
  transform: translateY(-1px);
  border-color: var(--color-border);
  background: var(--color-surface);
}

.section-sidebar__link.is-active {
  background: rgba(var(--color-primary-rgb), 0.1);
  border-color: rgba(var(--color-primary-rgb), 0.25);
  color: var(--color-primary);
}

.section-sidebar__link-title {
  font-weight: 600;
}

.section-sidebar__link-caption {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

@media (max-width: 960px) {
  .section-sidebar {
    min-width: unset;
    width: 100%;
  }
}
</style>