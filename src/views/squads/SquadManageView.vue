<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import apiClient from '@/axios'
import SquadEditForm from '@/components/squads/SquadEditForm.vue'
import MembersManage from '@/components/squads/MembersManage.vue'
import FeesManage from '@/components/squads/FeesManage.vue'
import WorkBlocksManage from '@/components/squads/WorkBlocksManage.vue'
import { useUserStore } from '@/stores/user'
import { PERMISSIONS } from '@/constants/permissions'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const squadId = ref(route.params.id)
const squadIdNumber = computed(() => Number(squadId.value))

const squad = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const activeTab = ref('info')

const canManagePage = computed(() => {
  return userStore.hasSquadPermission(PERMISSIONS.SQUAD_MANAGE, squadIdNumber.value)
})

const canManageMembers = computed(() => {
  return (
    canManagePage.value ||
    userStore.hasSquadPermission(PERMISSIONS.MEMBERSHIP_MANAGE, squadIdNumber.value)
  )
})

const canManageFees = computed(() => {
  return (
    canManagePage.value ||
    userStore.hasSquadPermission(PERMISSIONS.FEE_MANAGE, squadIdNumber.value)
  )
})

const canManageWorkBlocks = computed(() => {
  return canManagePage.value
})

const availableTabs = computed(() => {
  const tabs = []

  if (canManagePage.value) {
    tabs.push({ key: 'info', label: 'Информация' })
  }

  if (canManageMembers.value) {
    tabs.push({ key: 'members', label: 'Участники' })
  }

  if (canManageFees.value) {
    tabs.push({ key: 'fees', label: 'Взносы' })
  }

  if (canManageWorkBlocks.value) {
    tabs.push({ key: 'work-blocks', label: 'Блоки работ' })
  }

  return tabs
})

async function fetchSquad() {
  if (!canManagePage.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await apiClient.get(`/api/v1/squads/${squadIdNumber.value}/`)
    squad.value = response.data
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Проверь существование отряда и доступ к нему.'
  } finally {
    loading.value = false
  }
}

function handleDeleted() {
  router.push('/squads')
}

watch(
  () => route.params.id,
  async (newId) => {
    squadId.value = newId
    activeTab.value = 'info'

    if (!userStore.user) {
      await userStore.fetchUser()
    }

    await fetchSquad()
  }
)

watch(
  availableTabs,
  (tabs) => {
    if (!tabs.length) return

    const stillExists = tabs.some((tab) => tab.key === activeTab.value)
    if (!stillExists) {
      activeTab.value = tabs[0].key
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchUser()
  }

  await fetchSquad()
})
</script>

<template>
  <section class="squad-manage-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Управление отрядом
        </h1>
        <p class="page-subtitle">
          {{ squad?.name || 'Загрузка данных отряда...' }}
        </p>
      </div>

      <RouterLink to="/squads" class="back-link">
        ← К списку отрядов
      </RouterLink>
    </div>

    <div v-if="!canManagePage" class="state-card">
      <div class="state-title">Нет доступа</div>
      <div class="state-text">
        У вас нет прав на управление этим отрядом.
      </div>
    </div>

    <div v-else-if="loading" class="state-card">
      <div class="state-title">Загрузка</div>
      <div class="state-text">Получаем информацию об отряде…</div>
    </div>

    <div v-else-if="errorMessage" class="state-card state-card--error">
      <div class="state-title">Не удалось загрузить отряд</div>
      <div class="state-text">{{ errorMessage }}</div>
      <button class="btn btn-primary" @click="fetchSquad">Повторить</button>
    </div>

    <template v-else>
      <div class="tabs-card">
        <button
          v-for="tab in availableTabs"
          :key="tab.key"
          type="button"
          class="tab-button"
          :class="{ 'is-active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-panel">
        <template v-if="activeTab === 'info'">
          <SquadEditForm
            :squad="squad"
            @updated="fetchSquad"
            @deleted="handleDeleted"
          />
        </template>

        <template v-else-if="activeTab === 'members'">
          <MembersManage :squad-id="squadIdNumber" />
        </template>

        <template v-else-if="activeTab === 'fees'">
          <FeesManage :squad-id="squadIdNumber" />
        </template>

        <template v-else-if="activeTab === 'work-blocks'">
          <WorkBlocksManage :squad-id="squadIdNumber" />
        </template>
      </div>
    </template>
  </section>
</template>

<style scoped>
.squad-manage-page {
  display: grid;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-main, #1f2937);
}

.page-subtitle {
  margin: 8px 0 0;
  color: var(--text-muted, #6b7280);
  font-size: 1rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--brand-700, #1d4ed8);
  font-weight: 600;
}

.tabs-card,
.state-card,
.tab-panel {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--card-border, #e5e7eb);
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.tabs-card {
  display: flex;
  gap: 8px;
  padding: 12px;
  flex-wrap: wrap;
}

.tab-button {
  border: none;
  background: transparent;
  color: var(--text-muted, #6b7280);
  padding: 10px 14px;
  border-radius: 12px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.tab-button:hover {
  background: rgba(37, 99, 235, 0.08);
  color: var(--brand-700, #1d4ed8);
}

.tab-button.is-active {
  background: var(--brand-600, #2563eb);
  color: #fff;
}

.tab-panel {
  padding: 16px;
}

.state-card {
  padding: 24px;
  display: grid;
  gap: 12px;
}

.state-card--error {
  border-color: #fecaca;
  background: #fff7f7;
}

.state-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main, #1f2937);
}

.state-text {
  color: var(--text-muted, #6b7280);
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--brand-600, #2563eb);
  color: #fff;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .tab-panel {
    padding: 12px;
  }

  .tabs-card {
    padding: 10px;
  }

  .tab-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
