<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container">
      <router-link to="/" class="navbar-brand">ССервО "СОПКа"</router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="navbarNav" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link to="/" class="nav-link" exact-active-class="active">Главная</router-link>
          </li>
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <router-link to="/profile" class="nav-link" active-class="active">Профиль</router-link>
          </li>
        </ul>
        <ul class="navbar-nav">
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <span class="navbar-text me-3">{{ authStore.user?.name }}</span>
          </li>
          <li v-if="!authStore.isAuthenticated" class="nav-item">
            <router-link to="/login" class="nav-link" active-class="active">Вход</router-link>
          </li>
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <button class="btn btn-outline-danger btn-sm" @click="handleLogout">Выйти</button>
          </li>
          <li class="nav-item">
            <button class="btn btn-link nav-link theme-toggle" @click="themeStore.toggleTheme">
              <i :class="themeStore.isDark ? 'bi-sun' : 'bi-moon'"></i>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const themeStore = useThemeStore()

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.theme-toggle {
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
}
.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
