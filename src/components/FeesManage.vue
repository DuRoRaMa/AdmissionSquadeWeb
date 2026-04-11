<template>
  <div class="fees-manage">
    <h3>Взносы участников</h3>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="members.length === 0" class="empty">Нет участников</div>
    <div v-else>
      <div v-for="member in members" :key="member.id" class="member-fees">
        <div class="member-header">
          <h4>{{ member.user_detail?.full_name || member.user_detail?.email || member.user }}</h4>
          <button class="btn-add-fee" @click="addFee(member.id)">+ Добавить взнос</button>
        </div>
        <div v-if="member.fees && member.fees.length" class="fees-list">
          <div v-for="fee in member.fees" :key="fee.id" class="fee-item">
            <span class="fee-info">{{ fee.amount }} руб. (оплачен: {{ formatDate(fee.paid_at) }}, истекает: {{ formatDate(fee.expires_at) }})</span>
            <div class="fee-actions">
              <button class="btn-edit-fee" @click="editFee(fee, member.id)">✏️</button>
              <button class="btn-delete-fee" @click="deleteFee(fee)">🗑️</button>
            </div>
          </div>
        </div>
        <div v-else class="no-fees">Нет взносов</div>
      </div>
    </div>
    <ModalAddFee v-model:visible="showFeeModal" :membershipId="currentMembershipId" :fee="currentFee" @saved="fetchMembersWithFees" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '@/axios'
import ModalAddFee from '@/components/ModalAddFee.vue'
import { useConfirmModal } from '@/composables/useConfirmModal'

const props = defineProps({ squadId: Number })
const { confirm } = useConfirmModal()

const members = ref([])
const loading = ref(false)
const showFeeModal = ref(false)
const currentMembershipId = ref(null)
const currentFee = ref(null)

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

async function fetchMembersWithFees() {
  loading.value = true
  try {
    const response = await apiClient.get(`/api/v1/squads/${props.squadId}/members/`)
    let membersData = []
    if (response.data && Array.isArray(response.data.results)) {
      membersData = response.data.results
    } else if (Array.isArray(response.data)) {
      membersData = response.data
    }
    members.value = membersData
  } catch (error) {
    console.error('Ошибка загрузки участников:', error)
  } finally {
    loading.value = false
  }
}

function addFee(membershipId) {
  currentMembershipId.value = membershipId
  currentFee.value = null
  showFeeModal.value = true
}

function editFee(fee, membershipId) {
  currentMembershipId.value = membershipId
  currentFee.value = fee
  showFeeModal.value = true
}

async function deleteFee(fee) {
  const ok = await confirm({
    title: 'Удаление взноса',
    message: `Удалить взнос на сумму ${fee.amount} руб.?`
  })
  if (!ok) return
  try {
    await apiClient.delete(`/api/v1/squads/fees/${fee.id}/`)
    fetchMembersWithFees()
  } catch (error) {
    alert('Ошибка удаления взноса')
  }
}

onMounted(fetchMembersWithFees)
</script>

<style scoped>
.fees-manage {
  padding: 1rem;
}
.member-fees {
  background: var(--card-bg);
  border-radius: var(--card-border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--card-border);
}
.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
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
.btn-add-fee:hover {
  opacity: 0.9;
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
.fee-actions button:hover {
  transform: scale(1.1);
}
.no-fees {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}
.loading, .empty {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem;
}
</style>