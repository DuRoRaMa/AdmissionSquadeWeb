<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { APP_SECTIONS, filterSectionItems } from '@/router/sections'
import useAuthStore from '@/stores/auth'
import useUserStore from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const userStore = useUserStore()
const themeStore = useThemeStore()

const mobileMenuOpen = ref(false)

function isLoginRoute() {
  return route.name === 'login'
}

function isRegisterRoute() {
  return route.name === 'register'
}

const access = computed(() => ({
  isAdmin: userStore.isAdmin,
  hasAnyPermission: userStore.hasAnyPermission,
  hasAllPermissions: userStore.hasAllPermissions,
}))
const visibleWorkItems = computed(() =>
  filterSectionItems(APP_SECTIONS.work, access.value)
)

const visibleSquadItems = computed(() =>
  filterSectionItems(APP_SECTIONS.squads, access.value)
)

const workLandingLink = computed(() => {
  return visibleWorkItems.value[0]?.to || '/availability'
})

const squadLandingLink = computed(() => {
  return visibleSquadItems.value[0]?.to || '/squads'
})

const visibleManageItems = computed(() =>
  filterSectionItems(APP_SECTIONS.manage, access.value)
)

const manageLandingLink = computed(() => {
  return visibleManageItems.value[0]?.to || '/dashboard/availability'
})

const sectionLinks = computed(() => {
  const links = [{ label: 'Главная', to: '/', section: 'home' }]

  if (!authStore.isAuthenticated) return links

  if (visibleWorkItems.value.length) {
    links.push({
      label: 'Работа',
      to: workLandingLink.value,
      section: 'work',
    })
  }

  if (visibleSquadItems.value.length) {
    links.push({
      label: 'Отряды',
      to: squadLandingLink.value,
      section: 'squads',
    })
  }

  if (visibleManageItems.value.length) {
    links.push({
      label: 'Управление',
      to: manageLandingLink.value,
      section: 'manage',
    })
  }

  links.push({ label: 'Профиль', to: '/profile', section: 'profile' })

  return links
})

function isActive(link) {
  if (link.section === 'home') {
    return route.name === 'home'
  }
  return route.meta.section === link.section
}

function handleLogout() {
  authStore.logout()
  mobileMenuOpen.value = false
  router.push({ name: 'login' })
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>

<template>
  <header class="app-topbar">
    <div class="app-topbar__container">
      <div class="app-topbar__head">
        <RouterLink to="/" class="app-topbar__brand" @click="closeMobileMenu">
          <span class="app-topbar__brand-main">ССервО</span>
          <span class="app-topbar__brand-accent">"СОПКа"</span>
        </RouterLink>

        <button
          class="app-topbar__burger"
          type="button"
          @click="toggleMobileMenu"
          :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
          aria-label="Открыть меню"
        >
          <i :class="mobileMenuOpen ? 'bi bi-x-lg' : 'bi bi-list'" />
        </button>
      </div>

      <div
        class="app-topbar__body"
        :class="{ 'is-open': mobileMenuOpen }"
      >
        <nav class="app-topbar__nav">
          <RouterLink
            v-for="link in sectionLinks"
            :key="link.to"
            :to="link.to"
            class="app-topbar__link"
            :class="{ 'is-active': isActive(link) }"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <div class="app-topbar__actions">
          <template v-if="authStore.isAuthenticated">
            <RouterLink
              to="/profile"
              class="app-topbar__user"
              @click="closeMobileMenu"
            >
              {{ userStore.user?.first_name || userStore.user?.email || 'Пользователь' }}
            </RouterLink>

            <button class="app-icon-btn" @click="themeStore.toggleTheme" type="button">
              <i :class="themeStore.isDark ? 'bi bi-sun' : 'bi bi-moon'" />
            </button>

            <button class="app-ghost-btn" @click="handleLogout" type="button">
              Выйти
            </button>
          </template>

          <template v-else>
            <button class="app-icon-btn" @click="themeStore.toggleTheme" type="button">
              <i :class="themeStore.isDark ? 'bi bi-sun' : 'bi bi-moon'" />
            </button>

            <RouterLink
              to="/login"
              class="app-ghost-btn"
              :class="{ 'is-active': isLoginRoute() }"
              @click="closeMobileMenu"
            >
              Войти
            </RouterLink>

            <RouterLink
              to="/register"
              class="app-secondary-btn"
              :class="{ 'is-active': isRegisterRoute() }"
              @click="closeMobileMenu"
            >
              Регистрация
            </RouterLink>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(14px);
  background: var(--navbar-bg, rgba(255, 255, 255, 0.75));
  border-bottom: var(--navbar-border-bottom, 1px solid rgba(0, 0, 0, 0.06));
}

.app-topbar__container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-topbar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.app-topbar__brand {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  text-decoration: none;
  line-height: 1;
}

.app-topbar__brand-main {
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: var(--text-color);
}

.app-topbar__brand-accent {
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 8px 24px rgba(102, 126, 234, 0.18);
}

.app-topbar__burger {
  display: none;
  border: none;
  background: rgba(127, 127, 127, 0.08);
  color: var(--text-color);
  width: 42px;
  height: 42px;
  border-radius: 14px;
  cursor: pointer;
  transition: 0.2s ease;
}

.app-topbar__burger:hover {
  background: rgba(127, 127, 127, 0.14);
}

.app-topbar__body {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.app-topbar__nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.app-topbar__link {
  text-decoration: none;
  color: var(--text-muted);
  padding: 10px 14px;
  border-radius: 14px;
  font-weight: 600;
  transition: 0.2s ease;
}

.app-topbar__link:hover {
  color: var(--text-color);
  background: rgba(127, 127, 127, 0.08);
}

.app-topbar__link.is-active {
  color: #fff;
  background: var(--accent-gradient);
  box-shadow: 0 10px 24px rgba(102, 126, 234, 0.25);
}

.app-topbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.app-topbar__user {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(127, 127, 127, 0.08);
}

.app-icon-btn,
.app-ghost-btn,
.app-secondary-btn {
  border: none;
  text-decoration: none;
  cursor: pointer;
  border-radius: 14px;
  padding: 10px 14px;
  font-weight: 600;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;
}

.app-icon-btn {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  background: rgba(127, 127, 127, 0.08);
}

.app-ghost-btn,
.app-secondary-btn {
  color: var(--text-color);
  background: rgba(127, 127, 127, 0.08);
}

.app-ghost-btn.is-active,
.app-secondary-btn.is-active {
  color: #fff;
  background: var(--accent-gradient);
  box-shadow: 0 10px 24px rgba(102, 126, 234, 0.25);
}

.app-ghost-btn:hover,
.app-secondary-btn:hover {
  transform: translateY(-1px);
  background: rgba(127, 127, 127, 0.14);
}

.app-icon-btn:hover {
  transform: translateY(-1px);
  background: rgba(127, 127, 127, 0.14);
}

@media (max-width: 992px) {
  .app-topbar__container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .app-topbar__head {
    width: 100%;
  }

  .app-topbar__burger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .app-topbar__body {
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    width: 100%;
  }

  .app-topbar__body.is-open {
    display: flex;
  }

  .app-topbar__nav {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .app-topbar__link {
    width: 100%;
    text-align: left;
  }

  .app-topbar__actions {
    flex-wrap: wrap;
    width: 100%;
  }

  .app-topbar__user,
  .app-ghost-btn,
  .app-secondary-btn {
    flex: 1 1 auto;
    text-align: center;
  }
}

@media (max-width: 576px) {
  .app-topbar__container {
    padding: 12px;
  }

  .app-topbar__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .app-topbar__user,
  .app-ghost-btn,
  .app-secondary-btn {
    width: 100%;
  }
}
</style>