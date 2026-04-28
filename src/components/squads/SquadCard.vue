<template>
  <div class="squad-card" :class="{ joined: isUserMember }">
    <div class="card-header">
      <h3>{{ squad.name }}</h3>
      <span class="member-count">{{ squad.member_count }} участников</span>
    </div>

    <div class="card-body">
      <p class="description">{{ squad.description || 'Нет описания' }}</p>

      <div class="info-grid">
        <div><strong>Направление:</strong> {{ squad.lso_directions || '—' }}</div>
        <div><strong>Регион:</strong> {{ squad.region || '—' }}</div>
        <div><strong>Работодатель:</strong> {{ squad.employer || '—' }}</div>
      </div>
    </div>

    <div class="card-footer">
      <button
        v-if="canManage"
        class="btn-manage"
        @click="goToManage"
      >
        Управление
      </button>

      <button
        v-else-if="canJoin"
        class="btn-join"
        @click="handleJoin"
        :disabled="isJoining"
      >
        {{ isJoining ? 'Вступление...' : 'Вступить' }}
      </button>

      <span
        v-else-if="statusLabel"
        class="status-label"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>

      <span v-else class="loading-user">Загрузка...</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSquadsStore } from '@/stores/squads'
import { PERMISSIONS } from '@/constants/permissions'

const props = defineProps({
  squad: { type: Object, required: true },
})

const emit = defineEmits(['joined'])

const router = useRouter()
const userStore = useUserStore()
const squadsStore = useSquadsStore()
const isJoining = ref(false)

const userLoaded = computed(() => Boolean(userStore.user))

const activeMemberships = computed(() => {
  if (!Array.isArray(userStore.user?.memberships)) return []
  return userStore.user.memberships.filter((m) => m?.is_active === true)
})

const isUserMember = computed(() => {
  return activeMemberships.value.some((membership) => {
    const membershipSquadId = membership?.squad ?? membership?.squad_detail?.id
    return String(membershipSquadId) === String(props.squad.id)
  })
})

const hasOtherActiveMembership = computed(() => {
  return activeMemberships.value.length > 0 && !isUserMember.value
})

const canManage = computed(() => {
  if (!userLoaded.value) return false
  return userStore.hasSquadPermission(PERMISSIONS.SQUAD_MANAGE, props.squad.id)
})

const canJoin = computed(() => {
  if (!userLoaded.value) return false
  if (canManage.value) return false
  if (isUserMember.value) return false
  if (hasOtherActiveMembership.value) return false

  return true
})

const statusLabel = computed(() => {
  if (!userLoaded.value) return ''

  if (isUserMember.value) {
    return 'Вы уже участник'
  }

  if (hasOtherActiveMembership.value) {
    return 'Сначала выйдите из текущего отряда'
  }

  return ''
})

const statusClass = computed(() => {
  if (isUserMember.value) return 'is-success'
  if (hasOtherActiveMembership.value) return 'is-warning'
  return 'is-muted'
})

async function handleJoin() {
  if (isJoining.value || !canJoin.value) return

  isJoining.value = true

  try {
    await squadsStore.joinSquad(props.squad.id)
    emit('joined')
  } catch (err) {
    window.alert(err.message)
  } finally {
    isJoining.value = false
  }
}

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

.btn-join,
.btn-manage {
  background: var(--btn-primary-gradient);
  border: none;
  border-radius: 50px;
  padding: 0.4rem 1.2rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-join:hover:not(:disabled),
.btn-manage:hover {
  opacity: 0.9;
}

.btn-join:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-label {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-label.is-success {
  color: #15803d;
  background: rgba(22, 163, 74, 0.12);
}

.status-label.is-warning {
  color: #b45309;
  background: rgba(245, 158, 11, 0.16);
}

.status-label.is-muted {
  color: var(--text-muted);
  background: rgba(148, 163, 184, 0.12);
}

.loading-user {
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>