<template>
  <div>
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
              <router-link to="/profile" class="nav-link" active-class="active"
                >Профиль</router-link
              >
            </li>
          </ul>
          <ul class="navbar-nav">
            <li v-if="authStore.isAuthenticated" class="nav-item">
              <span class="navbar-text me-3">{{ authStore.user?.name }}</span>
            </li>
            <li v-if="!authStore.isAuthenticated" class="nav-item">
              <router-link to="/login" class="nav-link">Вход</router-link>
            </li>
            <li v-if="!authStore.isAuthenticated" class="nav-item">
              <router-link to="/register" class="nav-link">Регистрация</router-link>
            </li>
            <li v-if="authStore.isAuthenticated" class="nav-item">
              <button class="btn btn-outline-danger btn-sm" @click="handleLogout">Выйти</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <main class="container mt-4 d-flex align-items-center justify-content-center h-100">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>
