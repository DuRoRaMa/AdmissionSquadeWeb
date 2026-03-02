<script setup>
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (authStore.token) {
    await authStore.fetchUser()
  }
})

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

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
      <p><strong>phone:</strong> {{ authStore.user.phone }}</p>
      <p><strong>is_blocked:</strong> {{ authStore.user.is_blocked }}</p>
      <p><strong>created_at:</strong> {{ authStore.user.created_at }}</p>
      <p><strong>updated_at:</strong> {{ authStore.user.updated_at }}</p>
      <button @click="handleLogout">Выйти</button>
    </div>
    <div v-else>
      <p>Загрузка...</p>
    </div>
  </div>
</template>

