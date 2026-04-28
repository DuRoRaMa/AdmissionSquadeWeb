<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useScheduleStore } from '@/stores/schedule'

import AppProfileCard from '@/components/AppProfileCard.vue'
import UserAccountCard from '@/components/users/UserAccountCard.vue'
import UserContractCard from '@/components/users/UserContractCard.vue'
import UserMembershipCard from '@/components/users/UserMembershipCard.vue'
import UserPersonalCard from '@/components/users/UserPersonalCard.vue'
import UserStudyInfoCard from '@/components/users/UserStudyInfoCard.vue'
import UserPassportCard from '@/components/users/UserPassportCard.vue'
import UserQrCard from '@/components/users/UserQrCard.vue'

const authStore = useAuthStore()
const userStore = useUserStore()
const scheduleStore = useScheduleStore()

onMounted(async () => {
  if (authStore.token && !userStore.user) {
    await userStore.fetchUser()
  }

  await scheduleStore.fetchMySchedule()
})

function handleUserUpdate(updatedUser) {
  userStore.user = updatedUser
}
</script>

<template>
  <div class="profile-page">
    <div v-if="userStore.user" class="profile-top">
      <div class="profile-top__main">
        <AppProfileCard :user="userStore.user" />
      </div>

      <div class="profile-top__qr">
        <UserQrCard
          :entry-id="scheduleStore.nearestEntry?.id || null"
          title="Личный QR-код"
          subtitle="Быстрый доступ к отметке прямо из профиля"
        />
      </div>
    </div>

    <div v-else class="loading">
      Загрузка профиля...
    </div>

    <div v-if="userStore.user" class="profile-grid">
      <UserPersonalCard :user="userStore.user" @update:user="handleUserUpdate" />
      <UserStudyInfoCard :user="userStore.user" @update:user="handleUserUpdate" />
      <UserContractCard :user="userStore.user" @update:user="handleUserUpdate" />
      <UserPassportCard :user="userStore.user" @update:user="handleUserUpdate" />
      <UserAccountCard :user="userStore.user" />
      <UserMembershipCard :memberships="userStore.user.memberships" />
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-top {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 420px);
  gap: 24px;
  align-items: start;
}

.profile-top__main,
.profile-top__qr {
  min-width: 0;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.loading {
  color: var(--text-color);
  text-align: center;
  padding: 2rem;
  background: var(--card-bg-solid);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
}

@media (max-width: 1100px) {
  .profile-top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .profile-page {
    gap: 16px;
  }
}
</style>