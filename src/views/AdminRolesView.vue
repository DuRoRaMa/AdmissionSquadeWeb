<template>
  <div class="admin-roles">
    <div class="page-header">
      <h1>Роли</h1>
      <button class="btn-create" @click="openCreateModal">+ Создать роль</button>
    </div>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="roles.length === 0" class="empty">Нет ролей</div>
    <div v-else class="table-wrapper">
      <table class="roles-table">
        <thead>
          <tr><th>ID</th><th>Название</th><th>Действия</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in roles" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.name }}</td>
            <td>
              <button class="btn-edit" @click="openEditModal(r)">✏️</button>
              <button class="btn-delete" @click="deleteRole(r)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <RoleFormModal
      v-model:visible="showModal"
      :role="selectedRole"
      @saved="fetchRoles"
    />
  </div>
</template>

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

<style scoped>
/* аналогично AdminUsersView */
.admin-roles { padding: 1rem; }
.page-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
.btn-create { background: var(--btn-primary-gradient); border: none; border-radius: 50px; padding: 0.4rem 1rem; color: white; cursor: pointer; }
.roles-table { width: 100%; border-collapse: collapse; background: var(--card-bg-solid); }
.roles-table th, .roles-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--card-border); }
.btn-edit, .btn-delete { background: none; border: none; cursor: pointer; font-size: 1.1rem; margin-right: 0.5rem; }
.btn-delete { color: #dc3545; }
</style>