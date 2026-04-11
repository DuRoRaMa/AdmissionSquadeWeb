<template>
  <nav class="navbar navbar-expand-lg">
    <div class="container">
      <router-link to="/" class="navbar-brand">ССервО "СОПКа"</router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="navbarNav" class="collapse navbar-collapse">
        <!-- Основное меню (для всех авторизованных) -->
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link to="/" class="nav-link" exact-active-class="active">Главная</router-link>
          </li>
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <router-link to="/squads" class="nav-link" active-class="active">Отряды</router-link>
          </li>
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <router-link to="/my-squads" class="nav-link" active-class="active">Мои отряды</router-link>
          </li>
          <!-- Админские ссылки (видны только при is_staff = true) -->
          <li v-if="userStore.user?.is_staff" class="nav-item">
            <router-link to="/dashboard/users" class="nav-link" active-class="active">Пользователи</router-link>
          </li>
          <li v-if="userStore.user?.is_staff" class="nav-item">
            <router-link to="/dashboard/roles" class="nav-link" active-class="active">Роли</router-link>
          </li>
          <!-- Ссылка на профиль (для всех авторизованных) -->
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <router-link to="/profile" class="nav-link" active-class="active">Профиль</router-link>
          </li>
        </ul>

        <!-- Правая часть: имя пользователя, выход, тема -->
        <ul class="navbar-nav">
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <span class="navbar-text me-3">
              {{ userStore.user?.full_name || userStore.user?.first_name || userStore.user?.email || '' }}
            </span>
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
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* Стили кнопки темы (оставить как есть) */
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