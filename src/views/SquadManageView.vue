<template>
  <div class="squad-manage">
    <h1>Управление отрядом: {{ squad?.name }}</h1>
    <div class="tabs">
      <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Информация</button>
      <button :class="{ active: activeTab === 'members' }" @click="activeTab = 'members'">Участники</button>
      <button :class="{ active: activeTab === 'fees' }" @click="activeTab = 'fees'">Взносы</button>
    </div>

    <div v-if="activeTab === 'info'">
      <SquadEditForm :squad="squad" @updated="fetchSquad" />
    </div>
    <div v-if="activeTab === 'members'">
      <MembersManage :squadId="squadIdNumber" />
    </div>
    <div v-if="activeTab === 'fees'">
      <FeesManage :squadId="squadIdNumber" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '@/axios'
import SquadEditForm from '@/components/SquadEditForm.vue'
import MembersManage from '@/components/MembersManage.vue'
import FeesManage from '@/components/FeesManage.vue'

const route = useRoute()
const squadId = ref(route.params.id)           // строка
const squadIdNumber = computed(() => Number(squadId.value))  // число
const squad = ref(null)
const activeTab = ref('info')

async function fetchSquad() {
  try {
    const response = await apiClient.get(`/api/v1/squads/${squadIdNumber.value}/`)
    squad.value = response.data
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchSquad)
</script>

<style scoped>
/* стили остаются без изменений */
.squad-manage {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--card-border);
}
.tabs button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-muted);
  transition: color 0.2s;
}
.tabs button.active {
  color: var(--accent-gradient);
  border-bottom: 2px solid var(--accent-gradient);
}
</style>