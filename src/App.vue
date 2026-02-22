<template>
  <div>
    <AppNavbar />
    <main class="container mt-4 d-flex align-items-center justify-content-center h-100">
      <Transition name="page" mode="out-in">
        <router-view />
      </Transition>
    </main>
  </div>
</template>

<script setup>
import AppNavbar from '@/components/AppNavbar.vue'
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<style scoped></style>
