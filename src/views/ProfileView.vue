<template>
  <div class="profile">
    <h1>Профиль</h1>
    <div v-if="authStore.user">
      <p><strong>Имя пользователя:</strong> {{ authStore.user.username }}</p>
      <p>
        <strong>ФИО:</strong> {{ authStore.user.last_name }} {{ authStore.user.first_name }}
        {{ authStore.user.middle_name }}
      </p>
      <p><strong>Email:</strong> {{ authStore.user.email }}</p>
      <button @click="handleLogout">Выйти</button>
    </div>
    <div v-else>
      <p>Загрузка...</p>
    </div>
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
