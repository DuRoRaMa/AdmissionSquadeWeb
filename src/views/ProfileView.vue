<script setup>
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppProfileCard from '../components/AppProfileCard.vue'
import AppInfoProfileCard from '../components/AppInfoProfileCard.vue'
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
  <div class="profile-container">
    <AppProfileCard :user="authStore.user" />
    <div class="main-content">
    </div>
  </div>
</template>

<style scoped>

.profile-container {
  max-width: 1300px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 32px;
  box-shadow: 0 20px 35px -8px rgba(0, 20, 30, 0.15);
  padding: 32px;
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.main-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
</style>