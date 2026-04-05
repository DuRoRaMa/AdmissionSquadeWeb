<template>
  <div class="members-manage">
    <div class="header">
      <h3>Участники отряда</h3>
      <button class="btn-add" @click="showAddModal = true">+ Добавить участника</button>
    </div>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="!members || members.length === 0" class="empty">Нет участников</div>
    <div v-else class="members-table-wrapper">
      <table class="members-table">
        <thead>
          <tr><th>ФИО</th><th>Роль</th><th>Номер билета</th><th>Дата вступления</th><th>Действия</th></tr>
        </thead>
        <tbody>
          <tr v-for="m in members" :key="m.id">
            <td>{{ m.user_detail?.full_name || m.user_detail?.email || m.user }}</td>
            <td>
              <select v-model="m.role" @change="updateRole(m)">
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
             </td>
            <td>
              <input v-model="m.ticket_number" @blur="updateTicket(m)" class="ticket-input" />
             </td>
            <td>{{ formatDate(m.joined_date) }}</td>
            <td>
              <button class="btn-remove" @click="removeMember(m)">Исключить</button>
             </td>
           </tr>
        </tbody>
      </table>
    </div>

    <ModalAddMember
      v-model:visible="showAddModal"
      :squadId="squadId"
      @added="fetchMembers"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '@/axios'
import ModalAddMember from './ModalAddMember.vue'

const props = defineProps({
  squadId: Number
})

const members = ref([])
const roles = ref([])
const loading = ref(false)
const showAddModal = ref(false)

async function fetchMembers() {
  loading.value = true
  try {
    const res = await apiClient.get(`/api/v1/squads/${props.squadId}/members/`)
    // Поддержка пагинации
    if (res.data && Array.isArray(res.data.results)) {
      members.value = res.data.results
    } else if (Array.isArray(res.data)) {
      members.value = res.data
    } else {
      members.value = []
    }
  } catch (err) {
    console.error('Ошибка загрузки участников:', err)
    members.value = []
  } finally {
    loading.value = false
  }
}

async function fetchRoles() {
  try {
    const res = await apiClient.get('/api/v1/users/roles/')
    roles.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('Ошибка загрузки ролей:', err)
    roles.value = []
  }
}

async function updateRole(member) {
  try {
    await apiClient.patch(`/api/v1/squads/members/${member.id}/`, { role: member.role })
  } catch (err) {
    alert('Ошибка обновления роли')
    fetchMembers()
  }
}

async function updateTicket(member) {
  try {
    await apiClient.patch(`/api/v1/squads/members/${member.id}/`, { ticket_number: member.ticket_number })
  } catch (err) {
    alert('Ошибка обновления билета')
  }
}

async function removeMember(member) {
  if (confirm(`Исключить ${member.user_detail?.full_name || member.user}?`)) {
    try {
      await apiClient.delete(`/api/v1/squads/members/${member.id}/`)
      fetchMembers()
    } catch (err) {
      alert('Ошибка исключения')
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

onMounted(() => {
  fetchMembers()
  fetchRoles()
})
</script>

<style scoped>
.members-manage {
  padding: 1rem;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.header h3 {
  margin: 0;
  color: var(--text-color);
}
.btn-add {
  background: var(--btn-primary-gradient);
  border: none;
  border-radius: 50px;
  padding: 0.4rem 1rem;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-add:hover {
  opacity: 0.9;
}
.members-table-wrapper {
  overflow-x: auto;
}
.members-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg-solid);
  border-radius: var(--card-border-radius);
  overflow: hidden;
}
.members-table th,
.members-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--card-border);
  color: var(--text-color);
}
.members-table th {
  background: var(--header-footer-bg);
  font-weight: 600;
}
.members-table select,
.ticket-input {
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: var(--input-border-radius);
  padding: 0.3rem 0.5rem;
  color: var(--text-color);
}
.btn-remove {
  background: #dc3545;
  border: none;
  border-radius: 50px;
  padding: 0.2rem 0.6rem;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-remove:hover {
  opacity: 0.9;
}
.loading,
.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem;
}
</style>