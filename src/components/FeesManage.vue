<template>
  <section class="fees-manage">
    <div class="fees-header">
      <div>
        <h3>Взносы участников</h3>
        <p class="fees-subtitle">
          Добавление и изменение взносов доступно только при наличии права на управление взносами.
        </p>
      </div>
    </div>

    <div v-if="!canManageFees" class="notice-card">
      У тебя нет прав на управление взносами этого отряда.
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="state-card">Загрузка...</div>
    <div v-else-if="members.length === 0" class="state-card">Нет участников</div>
    <div v-else>
      <div v-for="member in members" :key="member.id" class="member-fees">
        <div class="member-header">
          <h4>{{ member.user_detail?.full_name || member.user_detail?.email || member.user }}</h4>
          <button
            class="btn-add-fee"
            :disabled="!canManageFees"
            @click="addFee(member.id)"
          >
            + Добавить взнос
          </button>
        </div>

        <div v-if="member.fees && member.fees.length" class="fees-list">
          <div v-for="fee in member.fees" :key="fee.id" class="fee-item">
            <span class="fee-info">
              {{ fee.amount }} руб. (оплачен: {{ formatDate(fee.paid_at) }}, истекает: {{ formatDate(fee.expires_at) }})
            </span>

            <div class="fee-actions">
              <button :disabled="!canManageFees" class="btn-edit-fee" @click="editFee(fee, member.id)">✏️</button>
              <button :disabled="!canManageFees" class="btn-delete-fee" @click="deleteFee(fee)">🗑️</button>
            </div>
          </div>
        </div>

        <div v-else class="no-fees">Нет взносов</div>
      </div>
    </div>

    <ModalAddFee
      v-if="canManageFees"
      v-model:visible="showFeeModal"
      :membershipId="currentMembershipId"
      :fee="currentFee"
      @saved="fetchMembersWithFees"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import apiClient from '@/axios'
import ModalAddFee from '@/components/ModalAddFee.vue'
import { useConfirmModal } from '@/composables/useConfirmModal'
import useAccess from '@/composables/useAccess'
import { PERMISSIONS } from '@/constants/permissions'

const props = defineProps({ squadId: Number })
const { confirm } = useConfirmModal()
const { canSquad } = useAccess()

const members = ref([])
const loading = ref(false)
const showFeeModal = ref(false)
const currentMembershipId = ref(null)
const currentFee = ref(null)
const errorMessage = ref('')

const canManageFees = computed(() => {
  return (
    canSquad(PERMISSIONS.SQUAD_MANAGE, props.squadId) ||
    canSquad(PERMISSIONS.FEE_MANAGE, props.squadId)
  )
})

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function normalizeListPayload(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

async function fetchMembersWithFees() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await apiClient.get(`/api/v1/squads/${props.squadId}/members/`)
    members.value = normalizeListPayload(response.data)
  } catch (error) {
    console.error('Ошибка загрузки участников:', error)
    members.value = []
    errorMessage.value = 'Не удалось загрузить участников и взносы.'
  } finally {
    loading.value = false
  }
}

function addFee(membershipId) {
  if (!canManageFees.value) return
  currentMembershipId.value = membershipId
  currentFee.value = null
  showFeeModal.value = true
}

function editFee(fee, membershipId) {
  if (!canManageFees.value) return
  currentMembershipId.value = membershipId
  currentFee.value = fee
  showFeeModal.value = true
}

async function deleteFee(fee) {
  if (!canManageFees.value) return

  const ok = await confirm({
    title: 'Удаление взноса',
    message: `Удалить взнос на сумму ${fee.amount} руб.?`,
  })

  if (!ok) return

  try {
    await apiClient.delete(`/api/v1/squads/fees/${fee.id}/`)
    await fetchMembersWithFees()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Ошибка удаления взноса.'
  }
}

watch(
  () => props.squadId,
  () => {
    fetchMembersWithFees()
  }
)

onMounted(fetchMembersWithFees)
</script>

<style scoped>
.fees-manage {
  display: grid;
  gap: 16px;
  padding: 1rem;
}

.notice-card,
.alert,
.state-card,
.member-fees {
  background: var(--card-bg);
  border-radius: var(--card-border-radius);
  border: 1px solid var(--card-border);
}

.notice-card,
.alert,
.state-card {
  padding: 1rem;
}

.notice-card {
  color: var(--text-muted);
}

.alert-error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff5f5;
}

.fees-subtitle {
  color: var(--text-muted);
  margin: 0.35rem 0 0;
}

.member-fees {
  padding: 1rem;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
}

.member-header h4 {
  margin: 0;
  color: var(--text-color);
}

.btn-add-fee {
  background: var(--btn-primary-gradient);
  border: none;
  border-radius: 50px;
  padding: 0.3rem 0.8rem;
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: opacity 0.2s;
}

.btn-add-fee:disabled,
.fee-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fees-list {
  margin-top: 0.5rem;
}

.fee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--header-footer-bg);
  padding: 0.5rem;
  border-radius: 8px;
  margin-bottom: 0.3rem;
  gap: 1rem;
}

.fee-info {
  color: var(--text-color);
  font-size: 0.9rem;
}

.fee-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  margin-left: 0.5rem;
  transition: transform 0.1s;
}

.fee-actions button:hover:not(:disabled) {
  transform: scale(1.1);
}

.no-fees {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}
</style>