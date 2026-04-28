<template>
  <div class="admin-users">
    <div class="page-header">
      <h1>Пользователи</h1>
      <div v-if="!canViewUsers" class="empty">
        Раздел пользователей доступен только администратору системы.
      </div>

      <div v-else-if="errorMessage" class="empty">
        {{ errorMessage }}
      </div>
      <div class="filters">
        <input
          v-model="filters.search"
          placeholder="Поиск по email/имени"
          @input="debounceSearch"
        />
        <select v-model="filters.is_blocked">
          <option value="">Все статусы</option>
          <option value="true">Заблокированы</option>
          <option value="false">Активны</option>
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
            <th>Роли и отряды</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.full_name }}</td>
            <td class="roles-cell">
              <div class="roles-stack">
                <span
                  v-if="u.is_staff"
                  class="role-pill role-pill--admin"
                >
                  Системный администратор
                </span>

                <template v-if="getMembershipSummary(u).length">
                  <div
                    v-for="item in getMembershipSummary(u)"
                    :key="`${u.id}-${item.squad_id}-${item.role_slug || 'no-role'}`"
                    class="role-entry"
                  >
                    <span class="role-pill">
                      {{ item.role_name || 'Без роли' }}
                    </span>
                    <span class="role-squad">
                      {{ item.squad_name }}
                    </span>
                  </div>
                </template>

                <span
                  v-else-if="!u.is_staff"
                  class="role-empty"
                >
                  Нет членства в отрядах
                </span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', u.is_blocked ? 'blocked' : 'active']">
                {{ u.is_blocked ? 'Заблокирован' : 'Активен' }}
              </span>
            </td>
            <td class="actions-cell">
              <div class="row-actions">
                <button
                  type="button"
                  class="table-action"
                  @click="openEditModal(u)"
                >
                  Редактировать
                </button>

                <button
                  v-if="!u.is_staff"
                  type="button"
                  class="table-action table-action--danger"
                  @click="toggleBlock(u)"
                >
                  {{ u.is_blocked ? 'Разблокировать' : 'Заблокировать' }}
                </button>
              </div>
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
      :roles="[]"
      @updated="fetchUsers"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import apiClient from '@/axios'
import UserEditModal from '@/components/users/UserEditModal.vue'
import { useConfirmModal } from '@/composables/useConfirmModal'
import { useUserStore } from '@/stores/user'

const { confirm } = useConfirmModal()
const userStore = useUserStore()

const users = ref([])
const loading = ref(false)
const errorMessage = ref('')
const filters = ref({ search: '', is_blocked: '' })
const pagination = ref({ page: 1, totalPages: 1 })
const showEditModal = ref(false)
const selectedUser = ref(null)

const canViewUsers = computed(() => userStore.isAdmin)

let searchTimeout = null

async function fetchUsers() {
  if (!canViewUsers.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const params = {
      page: pagination.value.page,
      search: filters.value.search || undefined,
      is_blocked: filters.value.is_blocked || undefined,
    }

    const res = await apiClient.get('/api/v1/users/', { params })

    if (res.data.results) {
      users.value = res.data.results
      pagination.value.totalPages = Math.max(1, Math.ceil(res.data.count / 20))
    } else {
      users.value = Array.isArray(res.data) ? res.data : []
      pagination.value.totalPages = 1
    }
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Не удалось загрузить список пользователей.'
  } finally {
    loading.value = false
  }
}

function getMembershipSummary(user) {
  const summary = user?.role_summary

  if (!summary || summary.kind !== 'membership') {
    return []
  }

  return Array.isArray(summary.memberships) ? summary.memberships : []
}

async function toggleBlock(user) {
  const action = user.is_blocked ? 'разблокировать' : 'заблокировать'
  const ok = await confirm({
    title: `${action} пользователя`,
    message: `Вы уверены, что хотите ${action} пользователя ${user.full_name || user.email}?`,
  })

  if (!ok) return

  try {
    await apiClient.patch(`/api/v1/users/${user.id}/`, {
      is_blocked: !user.is_blocked,
    })
    await fetchUsers()
  } catch (err) {
    console.error(err)
    window.alert('Ошибка изменения статуса')
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
  }, 400)
}

watch(
  () => filters.value.is_blocked,
  () => {
    pagination.value.page = 1
    fetchUsers()
  }
)

onMounted(() => {
  if (canViewUsers.value) {
    fetchUsers()
  }
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
.actions-cell {
  white-space: nowrap;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.table-action {
  border: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-color);
  border-radius: 12px;
  padding: 0.45rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.table-action:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.table-action--danger {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.2);
  background: rgba(220, 53, 69, 0.05);
}

.table-action--danger:hover {
  background: rgba(220, 53, 69, 0.09);
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}
.roles-cell {
  min-width: 260px;
}

.roles-stack {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.role-entry {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.24rem 0.7rem;
  border-radius: 999px;
  background: rgba(107, 119, 229, 0.14);
  border: 1px solid rgba(107, 119, 229, 0.28);
  color: var(--text-color);
  font-size: 0.82rem;
  font-weight: 600;
}

.role-pill--admin {
  background: rgba(240, 82, 82, 0.12);
  border-color: rgba(240, 82, 82, 0.24);
}

.role-squad {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.role-empty {
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>