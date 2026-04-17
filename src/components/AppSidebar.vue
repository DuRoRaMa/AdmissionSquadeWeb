<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import useAuthStore from '@/stores/auth'
import useUserStore from '@/stores/user'
import { APP_SECTIONS, filterSectionItems } from '@/router/sections'

const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()

const currentSection = computed(() => {
  const sectionKey = route.meta?.section
  return APP_SECTIONS[sectionKey] ?? null
})

const access = computed(() => ({
  isAdmin: Boolean(userStore.isAdmin),

  hasAnyPermission(permissions = []) {
    if (!permissions.length) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.isAdmin) return true
    return userStore.hasAnyPermission(permissions)
  },

  hasAllPermissions(permissions = []) {
    if (!permissions.length) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.isAdmin) return true
    return userStore.hasAllPermissions(permissions)
  },
}))

const items = computed(() => {
  return filterSectionItems(currentSection.value, access.value)
})

const showSidebar = computed(() => {
  return authStore.isAuthenticated && currentSection.value && items.value.length > 0
})

function isItemActive(item) {
  if (Array.isArray(item.routeNames) && item.routeNames.length) {
    return item.routeNames.includes(route.name)
  }

  return route.path === item.to
}
</script>

<template>
  <aside v-if="showSidebar" class="app-sidebar">
    <div class="app-sidebar__card">
      <div class="app-sidebar__title">
        {{ currentSection.title }}
      </div>

      <nav class="app-sidebar__nav">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="app-sidebar__link"
          :class="{ 'is-active': isItemActive(item) }"
        >
          <i v-if="item.icon" :class="['bi', item.icon]" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </aside>
</template>