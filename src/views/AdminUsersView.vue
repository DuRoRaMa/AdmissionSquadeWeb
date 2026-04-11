<template>
  <div class="admin-users">
    <div class="page-header">
      <h1>Пользователи</h1>
      <div class="filters">
        <input v-model="filters.search" placeholder="Поиск по email/имени" @input="debounceSearch" />
        <select v-model="filters.is_blocked">
          <option value="">Все статусы</option>
          <option value="true">Заблокированы</option>
          <option value="false">Активны</option>
        </select>
        <select v-model="filters.role">
          <option value="">Все роли</option>
          <option v-for="r in roles" :key="r.id" :value="r.name">{{ r.name }}</option>
        </select>
        <button @click="fetchUsers" class="btn-filter">Применить</button>
      </div>
    </div>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="users.length === 0" class="empty">Нет пользователей</div>
    <div v-else class="table-wrapper">
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>ФИО</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.full_name }}</td>
            <td>{{ getUserRole(u) }}</td>
            <td>
              <span :class="['status-badge', u.is_blocked ? 'blocked' : 'active']">
                {{ u.is_blocked ? 'Заблокирован' : 'Активен' }}
              </span>
            </td>
            <td>
              <button class="btn-edit" @click="openEditModal(u)">✏️</button>
              <button class="btn-block" @click="toggleBlock(u)" v-if="!u.is_staff">
                {{ u.is_blocked ? 'Разблокировать' : 'Заблокировать' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">←</button>
        <span>Страница {{ pagination.page }} из {{ pagination.totalPages }}</span>
        <button :disabled="pagination.page === pagination.totalPages" @click="changePage(pagination.page + 1)">→</button>
      </div>
    </div>

    <UserEditModal
      v-model:visible="showEditModal"
      :user="selectedUser"
      :roles="roles"
      @updated="fetchUsers"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import apiClient from '@/axios'
import UserEditModal from '@/components/UserEditModal.vue'
import { useConfirmModal } from '@/composables/useConfirmModal'

const { confirm } = useConfirmModal()

const users = ref([])
const roles = ref([])
const loading = ref(false)
const filters = ref({ search: '', is_blocked: '', role: '' })
const pagination = ref({ page: 1, totalPages: 1 })
const showEditModal = ref(false)
const selectedUser = ref(null)

let searchTimeout = null

async function fetchUsers() {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      search: filters.value.search || undefined,
      is_blocked: filters.value.is_blocked || undefined,
      role: filters.value.role || undefined
    }
    const res = await apiClient.get('/api/v1/users/', { params })
    // Предполагаем пагинированный ответ от DRF
    if (res.data.results) {
      users.value = res.data.results
      pagination.value.totalPages = Math.ceil(res.data.count / 20) // если page_size=20
    } else {
      users.value = res.data
      pagination.value.totalPages = 1
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function fetchRoles() {
  const res = await apiClient.get('/api/v1/users/roles/')
  roles.value = res.data
}

function getUserRole(user) {
  if (user.is_staff) return 'Администратор'
  if (user.memberships?.length) {
    return user.memberships[0].role_detail?.name || 'Участник'
  }
  return 'Участник'
}

async function toggleBlock(user) {
  const action = user.is_blocked ? 'разблокировать' : 'заблокировать'
  const ok = await confirm({
    title: `${action} пользователя`,
    message: `Вы уверены, что хотите ${action} пользователя ${user.full_name || user.email}?`
  })
  if (!ok) return
  try {
    await apiClient.patch(`/api/v1/users/${user.id}/`, { is_blocked: !user.is_blocked })
    fetchUsers()
  } catch (err) {
    alert('Ошибка изменения статуса')
  }
}

function openEditModal(user) {
  selectedUser.value = user
  showEditModal.value = true
}

function changePage(page) {
  pagination.value.page = page
  fetchUsers()
}

function debounceSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchUsers()
  }, 500)
}

watch(() => [filters.value.is_blocked, filters.value.role], () => {
  pagination.value.page = 1
  fetchUsers()
})

onMounted(() => {
  fetchRoles()
  fetchUsers()
})
</script>

<style scoped>
.admin-users {
  padding: 1rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.filters input, .filters select {
  padding: 0.4rem 0.8rem;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: 50px;
  color: var(--text-color);
}
.btn-filter {
  background: var(--btn-primary-gradient);
  border: none;
  border-radius: 50px;
  padding: 0.4rem 1rem;
  color: white;
  cursor: pointer;
}
.table-wrapper {
  overflow-x: auto;
}
.users-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg-solid);
  border-radius: var(--card-border-radius);
}
.users-table th, .users-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--card-border);
}
.users-table th {
  background: var(--header-footer-bg);
}
.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 50px;
  font-size: 0.8rem;
}
.status-badge.active {
  background: #28a74520;
  color: #28a745;
}
.status-badge.blocked {
  background: #dc354520;
  color: #dc3545;
}
.btn-edit, .btn-block {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  margin-right: 0.5rem;
}
.btn-block {
  color: #dc3545;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}
</style>