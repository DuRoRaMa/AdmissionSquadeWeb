<template>
  <div class="squads-page">
    <h1 class="page-title">Отряды</h1>
    <div v-if="squadsStore.isLoading" class="loading">Загрузка...</div>
    <div v-else-if="squadsStore.error" class="error">{{ squadsStore.error }}</div>
    <div v-else-if="!squadsStore.squads || squadsStore.squads.length === 0" class="empty">
      Пока нет ни одного отряда
    </div>
    <div v-else class="squads-grid">
      <SquadCard
        v-for="squad in squadsStore.squads"
        :key="squad.id"
        :squad="squad"
        @joined="handleJoined"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSquadsStore } from '@/stores/squads'
import { useUserStore } from '@/stores/user'
import SquadCard from '@/components/SquadCard.vue'

const squadsStore = useSquadsStore()
const userStore = useUserStore()

onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchUser()
  }
  await squadsStore.fetchSquads()
})

function handleJoined() {
  squadsStore.fetchSquads()
  userStore.fetchUser()
  alert('Вы успешно вступили в отряд!')
}
</script>

<style scoped>
.squads-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
.page-title {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
  text-align: center;
}
.squads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}
.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: var(--text-muted);
}
.error {
  color: var(--input-error-color);
}
</style>