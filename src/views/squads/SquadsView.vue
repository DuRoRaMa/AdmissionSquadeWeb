<template>
  <div class="squads-page">
    <div class="page-header">
      <h1 class="page-title">Отряды</h1>
      <button
        v-if="userStore.isAdmin"
        class="btn-create"
        @click="showCreateModal = true"
      >
        + Создать отряд
      </button>
    </div>
    <!-- остальной код -->
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

    <ModalCreateSquad
      v-model:visible="showCreateModal"
      @created="handleSquadCreated"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useSquadsStore } from '@/stores/squads'
import { useUserStore } from '@/stores/user'
import SquadCard from '@/components/squads/SquadCard.vue'
import ModalCreateSquad from '@/components/squads/ModalCreateSquad.vue'

const squadsStore = useSquadsStore()
const userStore = useUserStore()
const showCreateModal = ref(false)

onMounted(async () => {
  if (!userStore.user) await userStore.fetchUser()
  await squadsStore.fetchSquads()
})

async function handleJoined() {
  await Promise.all([
    squadsStore.fetchSquads(),
    userStore.fetchUser(),
  ])

  window.alert('Вы успешно вступили в отряд!')
}

function handleSquadCreated() {
  squadsStore.fetchSquads()
}
</script>

<style scoped>
/* добавляем стили для заголовка и кнопки */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.btn-create {
  background: var(--btn-primary-gradient);
  border: none;
  border-radius: 50px;
  padding: 0.5rem 1.2rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-create:hover {
  opacity: 0.9;
}
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