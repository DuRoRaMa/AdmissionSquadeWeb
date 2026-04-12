<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()

const isCommander = computed(() => {
  return (
    userStore.user?.is_staff ||
    userStore.user?.memberships?.some(
      m => m.role_detail?.slug === 'commander' || m.role_detail?.name === 'Командир'
    )
  )
})

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

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
        <ul class="navbar-nav me-auto" v-if="authStore.isAuthenticated">
          <li class="nav-item">
            <router-link to="/" class="nav-link" exact-active-class="active">Главная</router-link>
          </li>

          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Работа
            </a>
            <ul class="dropdown-menu">
              <li>
                <router-link to="/availability" class="dropdown-item">Доступность</router-link>
              </li>
              <li>
                <router-link to="/schedule" class="dropdown-item">Мой график</router-link>
              </li>
              <li>
                <router-link to="/schedule/requests" class="dropdown-item">Мои заявки</router-link>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <router-link to="/my-squads" class="dropdown-item">Мои отряды</router-link>
              </li>
              <li>
                <router-link to="/squads" class="dropdown-item">Все отряды</router-link>
              </li>
            </ul>
          </li>

          <li v-if="isCommander" class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Управление
            </a>
            <ul class="dropdown-menu">
              <li>
                <router-link to="/dashboard/availability" class="dropdown-item">
                  Формы доступности
                </router-link>
              </li>
              <li>
                <router-link to="/dashboard/schedules" class="dropdown-item">
                  Графики
                </router-link>
              </li>
              <li>
                <router-link to="/dashboard/change-requests" class="dropdown-item">
                  Заявки на изменения
                </router-link>
              </li>
              <li>
                <router-link to="/dashboard/scanner" class="dropdown-item">
                  Сканер QR
                </router-link>
              </li>

              <template v-if="userStore.user?.is_staff">
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <router-link to="/dashboard/users" class="dropdown-item">Пользователи</router-link>
                </li>
                <li>
                  <router-link to="/dashboard/roles" class="dropdown-item">Роли</router-link>
                </li>
              </template>
            </ul>
          </li>

          <li class="nav-item">
            <router-link to="/profile" class="nav-link" active-class="active">Профиль</router-link>
          </li>
        </ul>

        <ul class="navbar-nav ms-auto">
          <li v-if="authStore.isAuthenticated" class="nav-item">
            <span class="navbar-text me-3">
              {{ userStore.user?.first_name || userStore.user?.email || 'Пользователь' }}
            </span>
          </li>

          <li v-if="authStore.isAuthenticated" class="nav-item">
            <button class="btn btn-link nav-link" @click="handleLogout">Выйти</button>
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