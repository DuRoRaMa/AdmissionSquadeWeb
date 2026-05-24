<template>
  <div class="app-shell">
    <AppNavbar />

    <main class="app-main">
      <template v-if="useSidebarLayout">
        <div class="app-main__container app-main__container--with-sidebar">
          <AppSidebar />
          <section class="app-content">
            <Transition name="page" mode="out-in">
              <router-view />
            </Transition>
          </section>
        </div>
      </template>

      <template v-else>
        <div class="app-main__standalone">
          <Transition name="page" mode="out-in">
            <router-view />
          </Transition>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AppNavbar from '@/components/AppNavbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useThemeStore } from '@/stores/theme'
import useAuthStore from '@/stores/auth'
import { APP_SECTIONS } from '@/router/sections'

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const useSidebarLayout = computed(() => {
  if (!authStore.isAuthenticated) return false
  if (!route.meta?.section) return false

  return Boolean(APP_SECTIONS[route.meta.section])
})

onMounted(() => {
  themeStore.initTheme()
})
</script>