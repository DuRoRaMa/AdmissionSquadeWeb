<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '@/axios'
import RoleFormModal from '@/components/RoleFormModal.vue'
import { useConfirmModal } from '@/composables/useConfirmModal'

const { confirm } = useConfirmModal()

const roles = ref([])
const loading = ref(false)
const showModal = ref(false)
const selectedRole = ref(null)

async function fetchRoles() {
  loading.value = true
  try {
    const res = await apiClient.get('/api/v1/users/roles/')
    roles.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  selectedRole.value = null
  showModal.value = true
}

function openEditModal(role) {
  selectedRole.value = role
  showModal.value = true
}

async function deleteRole(role) {
  const ok = await confirm({
    title: 'Удаление роли',
    message: `Удалить роль "${role.name}"? Это может повлиять на участников.`
  })

  if (!ok) return

  try {
    await apiClient.delete(`/api/v1/users/roles/${role.id}/`)
    fetchRoles()
  } catch (err) {
    alert('Ошибка удаления')
  }
}

onMounted(fetchRoles)
</script>

<template>
  <div class="admin-roles">
    <div class="page-header">
      <div>
        <h1>Роли</h1>
        <p class="page-subtitle">Управление ролями доступа в системе</p>
      </div>
      <button class="btn-create" @click="openCreateModal">+ Создать роль</button>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="roles.length === 0" class="empty">Нет ролей</div>

    <div v-else class="table-wrapper desktop-table">
      <table class="roles-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Slug</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in roles" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.name }}</td>
            <td><code>{{ r.slug }}</code></td>
            <td class="actions">
              <button class="btn-edit" @click="openEditModal(r)">✏️</button>
              <button class="btn-delete" @click="deleteRole(r)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="roles.length" class="mobile-cards">
      <div v-for="r in roles" :key="r.id" class="role-card">
        <div class="role-main">
          <div class="role-name">{{ r.name }}</div>
          <div class="role-meta">ID: {{ r.id }}</div>
          <div class="role-meta">Slug: <code>{{ r.slug }}</code></div>
        </div>

        <div class="role-actions">
          <button class="btn-edit" @click="openEditModal(r)">Редактировать</button>
          <button class="btn-delete text-btn" @click="deleteRole(r)">Удалить</button>
        </div>
      </div>
    </div>

    <RoleFormModal
      v-model:visible="showModal"
      :role="selectedRole"
      @saved="fetchRoles"
    />
  </div>
</template>

<style scoped>
.admin-roles {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
}

.page-subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}

.btn-create {
  background: var(--btn-primary-gradient);
  border: none;
  border-radius: 50px;
  padding: 0.6rem 1rem;
  color: white;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.table-wrapper {
  overflow-x: auto;
}

.roles-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg-solid);
  border-radius: 20px;
  overflow: hidden;
}

.roles-table th,
.roles-table td {
  padding: 0.85rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--card-border);
}

.roles-table th {
  color: var(--text-muted);
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-color);
}

.btn-delete {
  color: #dc3545;
}

.mobile-cards {
  display: none;
}

.role-card {
  background: var(--card-bg-solid);
  border: var(--card-border);
  border-radius: 18px;
  padding: 1rem;
  box-shadow: var(--card-shadow);
  margin-bottom: 0.9rem;
}

.role-name {
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.4rem;
}

.role-meta {
  color: var(--text-muted);
  margin-bottom: 0.3rem;
}

.role-actions {
  margin-top: 0.9rem;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.text-btn {
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  border: var(--card-border);
}

.loading,
.empty {
  color: var(--text-muted);
  padding: 1rem 0;
}

@media (max-width: 768px) {
  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: block;
  }

  .btn-create {
    width: 100%;
  }
}
</style>