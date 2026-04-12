<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import useAuthStore from '@/stores/auth'
import useUserStore from '@/stores/user'

const authStore = useAuthStore()
const userStore = useUserStore()
const router = useRouter()

onMounted(async () => {
  if (authStore.isAuthenticated && !userStore.user) {
    await userStore.fetchUser()
  }
})

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => !!userStore.user?.is_staff)

const isCommander = computed(() => {
  if (!userStore.user?.memberships?.length) return false
  return userStore.user.memberships.some(
    (m) => m.role_detail?.slug === 'commander' || m.role_detail?.name === 'Командир'
  )
})

const canManage = computed(() => isAdmin.value || isCommander.value)

const displayName = computed(() => {
  if (!userStore.user) return 'Пользователь'
  const firstName = userStore.user.first_name || ''
  const lastName = userStore.user.last_name || ''
  return `${firstName} ${lastName}`.trim() || userStore.user.email || 'Пользователь'
})

async function logout() {
  if (typeof authStore.logout === 'function') {
    await authStore.logout()
  }
  router.push({ name: 'login' })
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
    <div class="container">
      <RouterLink class="navbar-brand fw-semibold" :to="{ name: 'home' }">
        AdmissionSquade
      </RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Переключить навигацию"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="mainNavbar" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0" v-if="isAuthenticated">
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'home' }">Главная</RouterLink>
          </li>

          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="personalDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Личное
            </a>
            <ul class="dropdown-menu" aria-labelledby="personalDropdown">
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'profile' }">Профиль</RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'my-schedule' }">Мой график</RouterLink>
              </li>
            </ul>
          </li>

          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="workDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Работа
            </a>
            <ul class="dropdown-menu" aria-labelledby="workDropdown">
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'availability' }">
                  Доступность
                </RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'my-schedule' }">
                  Мои смены
                </RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'schedule-requests' }">
                  Мои заявки
                </RouterLink>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'my-squads' }">
                  Мои отряды
                </RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'squads' }">
                  Все отряды
                </RouterLink>
              </li>
            </ul>
          </li>

          <li v-if="canManage" class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="manageDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Управление
            </a>
            <ul class="dropdown-menu" aria-labelledby="manageDropdown">
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'admin-availability' }">
                  Формы доступности
                </RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'admin-schedules' }">
                  Графики
                </RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'admin-change-requests' }">
                  Заявки на изменения
                </RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'admin-scanner' }">
                  Сканер QR
                </RouterLink>
              </li>

              <template v-if="isAdmin">
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <RouterLink class="dropdown-item" :to="{ name: 'dashboard-users' }">
                    Пользователи
                  </RouterLink>
                </li>
                <li>
                  <RouterLink class="dropdown-item" :to="{ name: 'dashboard-roles' }">
                    Роли
                  </RouterLink>
                </li>
              </template>
            </ul>
          </li>
        </ul>

        <ul class="navbar-nav ms-auto" v-if="isAuthenticated">
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center gap-2"
              href="#"
              id="accountDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span class="badge bg-primary-subtle text-primary">Аккаунт</span>
              <span class="text-truncate" style="max-width: 180px;">{{ displayName }}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'profile' }">Открыть профиль</RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" :to="{ name: 'home' }">На главную</RouterLink>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <button class="dropdown-item text-danger" @click="logout">
                  Выйти
                </button>
              </li>
            </ul>
          </li>
        </ul>

        <ul class="navbar-nav ms-auto" v-else>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'login' }">Вход</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'register' }">Регистрация</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>