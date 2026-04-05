<template>
  <div class="squad-card" :class="{ 'joined': isUserMember }">
    <div class="card-header">
      <h3>{{ squad.name }}</h3>
      <span class="member-count">{{ squad.member_count }} участников</span>
    </div>
    <div class="card-body">
      <p class="description">{{ squad.description || 'Нет описания' }}</p>
      <div class="info-grid">
        <div><strong>Направление:</strong> {{ squad.lso_directions }}</div>
        <div><strong>Регион:</strong> {{ squad.region }}</div>
        <div><strong>Работодатель:</strong> {{ squad.employer }}</div>
      </div>
    </div>
    <div class="card-footer">
      <!-- Кнопка управления (для командира или админа) -->
      <button
        v-if="canManage"
        class="btn-manage"
        @click="goToManage"
      >
        Управление
      </button>
      <!-- Кнопка вступления (для обычного пользователя, не состоящего в отряде) -->
      <button
        v-else-if="!isUserMember && userLoaded"
        class="btn-join"
        @click="handleJoin"
        :disabled="isJoining"
      >
        {{ isJoining ? 'Вступление...' : 'Вступить' }}
      </button>
      <!-- Сообщение, если уже участник -->
      <span v-else-if="isUserMember && userLoaded" class="already-member">Вы участник</span>
      <span v-else class="loading-user">Загрузка...</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSquadsStore } from '@/stores/squads'

const props = defineProps({
  squad: { type: Object, required: true }
})

const emit = defineEmits(['joined'])

const router = useRouter()
const userStore = useUserStore()
const squadsStore = useSquadsStore()
const isJoining = ref(false)

// Флаг загрузки пользователя
const userLoaded = computed(() => !!userStore.user)

// Является ли пользователь участником этого отряда
const isUserMember = computed(() => {
  if (!userLoaded.value) return false
  return userStore.user.memberships?.some(m => m.squad === props.squad.id && m.is_active === true)
})

// Может ли пользователь управлять отрядом (админ или командир)
const canManage = computed(() => {
  if (!userLoaded.value) return false
  if (userStore.user.is_staff) return true
  return userStore.user.memberships?.some(
    m => m.squad === props.squad.id && m.role_detail?.name === 'Командир'
  )
})

// Вступление в отряд
async function handleJoin() {
  if (isJoining.value) return
  isJoining.value = true
  try {
    await squadsStore.joinSquad(props.squad.id)
    emit('joined')
  } catch (err) {
    alert(err.message)
  } finally {
    isJoining.value = false
  }
}

// Переход на страницу управления отрядом
function goToManage() {
  router.push(`/squads/${props.squad.id}/manage`)
}
</script>

<style scoped>
.squad-card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  border-radius: var(--card-border-radius);
  border: 1px solid var(--card-border);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.squad-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}
.card-header {
  padding: 1rem;
  background: var(--header-footer-bg);
  border-bottom: 1px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
}
.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}
.member-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.card-body {
  padding: 1rem;
}
.description {
  color: var(--text-color);
  margin-bottom: 1rem;
  line-height: 1.4;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-color);
}
.card-footer {
  padding: 0.75rem 1rem;
  background: var(--header-footer-bg);
  border-top: 1px solid var(--card-border);
  text-align: right;
}
.btn-join, .btn-manage {
  background: var(--btn-primary-gradient);
  border: none;
  border-radius: 50px;
  padding: 0.4rem 1.2rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-join:hover:not(:disabled), .btn-manage:hover {
  opacity: 0.9;
}
.btn-join:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.already-member {
  color: var(--text-muted);
  font-style: italic;
}
.loading-user {
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>