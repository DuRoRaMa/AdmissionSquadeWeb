<template>
  <div class="profile-container">
    <AppProfileCard v-if="userStore.user" :user="userStore.user" />
    <div v-else class="loading">Загрузка профиля...</div>
    <div v-if="userStore.user" class="main-content">
      <UserPersonalCard :user="userStore.user" @update:user="handleUserUpdate" />
      <UserStudyInfoCard :user="userStore.user" @update:user="handleUserUpdate" />
      <UserContractCard :user="userStore.user" @update:user="handleUserUpdate" />
      <UserPassportCard :user="userStore.user" @update:user="handleUserUpdate" />
      <UserAccountCard :user="userStore.user" />
      <UserMembershipCard :memberships="userStore.user.memberships" />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'
import AppProfileCard from '../components/AppProfileCard.vue'
import UserAccountCard from '../components/UserAccountCard.vue'
import UserContractCard from '../components/UserContractCard.vue'
import UserMembershipCard from '../components/UserMembershipCard.vue'
import UserPersonalCard from '../components/UserPersonalCard.vue'
import UserStudyInfoCard from '../components/UserStudyInfoCard.vue'
import UserPassportCard from '../components/UserPassportCard.vue'

const authStore = useAuthStore()
const userStore = useUserStore()

onMounted(async () => {
  if (authStore.token && !userStore.user) {
    await userStore.fetchUser()
  }
})

function handleUserUpdate(updatedUser) {
  userStore.user = updatedUser
}
</script>

<style scoped>
.profile-container {
  margin: 0 auto;
  background: var(--card-bg-solid);
  border-radius: 32px;
  box-shadow: var(--card-shadow);
  padding: 32px;
  display: flex;
  gap: 32px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.main-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  flex: 1;
  min-width: 0;
}
.loading {
  color: var(--text-color);
  text-align: center;
  padding: 2rem;
}
@media (max-width: 1024px) {
  .profile-container { padding: 24px; gap: 24px; }
}
@media (max-width: 768px) {
  .profile-container { flex-direction: column; padding: 16px; gap: 20px; }
  .main-content { grid-template-columns: 1fr; gap: 16px; }
}
</style>