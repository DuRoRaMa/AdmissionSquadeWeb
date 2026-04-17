<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/axios'
import RoleFormModal from '@/components/RoleFormModal.vue'
import { ROLE_PERMISSION_GROUPS, getPermissionLabel } from '@/config/rolePermissions'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const roles = ref([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const errorMessage = ref('')
const successMessage = ref('')

const modalOpen = ref(false)
const modalMode = ref('create')
const currentRole = ref(null)

const search = ref('')
const filter = ref('all')

const canViewRoles = computed(
  () => userStore.isAdmin || userStore.hasAnyPermission(['roles.view', 'roles.manage'])
)

const canManageRoles = computed(
  () => userStore.isAdmin || userStore.hasPermission('roles.manage')
)

const filteredRoles = computed(() => {
  let items = [...roles.value]

  if (filter.value === 'system') {
    items = items.filter((role) => role.is_system)
  } else if (filter.value === 'custom') {
    items = items.filter((role) => !role.is_system)
  } else if (filter.value === 'with-parent') {
    items = items.filter((role) => role.parent_id || role.parent?.id)
  }

  const query = search.value.trim().toLowerCase()
  if (!query) return items

  return items.filter((role) => {
    const haystack = [
      role.name,
      role.slug,
      role.description,
      role.parent?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const parentOptions = computed(() => {
  if (!currentRole.value?.id) return roles.value

  return roles.value.filter((role) => role.id !== currentRole.value.id)
})

async function fetchRoles() {
  if (!canViewRoles.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/users/roles/')
    roles.value = Array.isArray(data) ? data : data.results || []
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Не удалось загрузить список ролей.'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  currentRole.value = null
  modalMode.value = 'create'
  modalOpen.value = true
}

function openEditModal(role) {
  currentRole.value = role
  modalMode.value = 'edit'
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  currentRole.value = null
}

async function handleSave(payload) {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (modalMode.value === 'create') {
      await api.post('/users/roles/', payload)
      successMessage.value = 'Роль успешно создана.'
    } else {
      await api.patch(`/users/roles/${currentRole.value.id}/`, payload)
      successMessage.value = 'Роль успешно обновлена.'
    }

    closeModal()
    await fetchRoles()
  } catch (error) {
    console.error(error)
    errorMessage.value =
      error?.response?.data?.detail ||
      'Не удалось сохранить роль.'
  } finally {
    saving.value = false
  }
}

async function handleDelete(role) {
  if (role.is_system) {
    window.alert('Системную роль нельзя удалить.')
    return
  }

  const confirmed = window.confirm(`Удалить роль «${role.name}»?`)
  if (!confirmed) return

  deletingId.value = role.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await api.delete(`/users/roles/${role.id}/`)
    roles.value = roles.value.filter((item) => item.id !== role.id)
    successMessage.value = 'Роль удалена.'
  } catch (error) {
    console.error(error)
    errorMessage.value =
      error?.response?.data?.detail ||
      'Не удалось удалить роль.'
  } finally {
    deletingId.value = null
  }
}

function getParentLabel(role) {
  if (role.parent?.name) return role.parent.name

  const parentId = role.parent_id
  if (!parentId) return '—'

  return roles.value.find((item) => item.id === parentId)?.name || '—'
}

function getDirectPermissions(role) {
  return Array.isArray(role.permissions) ? role.permissions : []
}

function getResolvedPermissions(role) {
  if (Array.isArray(role.resolved_permissions) && role.resolved_permissions.length) {
    return role.resolved_permissions
  }
  return getDirectPermissions(role)
}

function cutPermissions(role, mode = 'resolved') {
  const permissions =
    mode === 'direct'
      ? getDirectPermissions(role)
      : getResolvedPermissions(role)

  return permissions.slice(0, 5)
}

function permissionCount(role, mode = 'resolved') {
  const permissions =
    mode === 'direct'
      ? getDirectPermissions(role)
      : getResolvedPermissions(role)

  return permissions.length
}

onMounted(fetchRoles)
</script>

<template>
  <section class="roles-page">
    <div class="roles-page__header">
      <div>
        <h1 class="roles-page__title">Роли и права</h1>
        <p class="roles-page__subtitle">
          Управляй ролями, наследованием и разрешениями пользователей.
        </p>
      </div>

      <button
        v-if="canManageRoles"
        type="button"
        class="btn btn-primary"
        @click="openCreateModal"
      >
        Создать роль
      </button>
    </div>

    <div v-if="!canViewRoles" class="state-card">
      <h2>Нет доступа</h2>
      <p>
        Для просмотра раздела нужны права <code>roles.view</code> или <code>roles.manage</code>.
      </p>
    </div>

    <template v-else>
      <div class="toolbar-card">
        <div class="toolbar-card__search">
          <label class="field-label">Поиск</label>
          <input
            v-model="search"
            type="text"
            class="field-input"
            placeholder="Название, slug, описание..."
          />
        </div>

        <div class="toolbar-card__filter">
          <label class="field-label">Фильтр</label>
          <select v-model="filter" class="field-input">
            <option value="all">Все роли</option>
            <option value="system">Системные</option>
            <option value="custom">Пользовательские</option>
            <option value="with-parent">С родительской ролью</option>
          </select>
        </div>
      </div>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div v-if="loading" class="state-card">
        <p>Загрузка ролей...</p>
      </div>

      <div v-else-if="!filteredRoles.length" class="state-card">
        <h2>Роли не найдены</h2>
        <p>Попробуй изменить фильтр или создай первую роль.</p>
      </div>

      <div v-else class="roles-grid">
        <article
          v-for="role in filteredRoles"
          :key="role.id"
          class="role-card"
        >
          <div class="role-card__top">
            <div>
              <div class="role-card__badges">
                <span class="badge badge-primary">{{ role.name }}</span>
                <span v-if="role.is_system" class="badge badge-dark">Системная</span>
                <span v-else class="badge badge-light">Пользовательская</span>
              </div>

              <div class="role-card__slug">
                {{ role.slug }}
              </div>
            </div>

            <div class="role-card__actions" v-if="canManageRoles">
              <button
                type="button"
                class="btn btn-secondary btn-small"
                @click="openEditModal(role)"
              >
                Изменить
              </button>

              <button
                type="button"
                class="btn btn-danger btn-small"
                :disabled="role.is_system || deletingId === role.id"
                @click="handleDelete(role)"
              >
                {{ deletingId === role.id ? 'Удаление...' : 'Удалить' }}
              </button>
            </div>
          </div>

          <p class="role-card__description">
            {{ role.description || 'Описание не заполнено.' }}
          </p>

          <div class="role-card__meta">
            <div class="meta-item">
              <span class="meta-item__label">Родительская роль</span>
              <span class="meta-item__value">{{ getParentLabel(role) }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-item__label">Прямые права</span>
              <span class="meta-item__value">{{ permissionCount(role, 'direct') }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-item__label">Эффективные права</span>
              <span class="meta-item__value">{{ permissionCount(role, 'resolved') }}</span>
            </div>
          </div>

          <div class="role-card__permissions">
            <div class="role-card__permissions-title">Основные права</div>

            <div class="chips">
              <span
                v-for="code in cutPermissions(role, 'resolved')"
                :key="code"
                class="chip"
              >
                {{ getPermissionLabel(code) }}
              </span>

              <span
                v-if="permissionCount(role, 'resolved') > 5"
                class="chip chip-muted"
              >
                +{{ permissionCount(role, 'resolved') - 5 }}
              </span>

              <span
                v-if="permissionCount(role, 'resolved') === 0"
                class="chip chip-muted"
              >
                Нет прав
              </span>
            </div>
          </div>
        </article>
      </div>
    </template>

    <RoleFormModal
      v-model="modalOpen"
      :mode="modalMode"
      :role="currentRole"
      :loading="saving"
      :parent-options="parentOptions"
      :permission-groups="ROLE_PERMISSION_GROUPS"
      @save="handleSave"
    />
  </section>
</template>

<style scoped>
.roles-page {
  display: grid;
  gap: 20px;
}

.roles-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.roles-page__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.roles-page__subtitle {
  margin: 8px 0 0;
  color: #64748b;
}

.toolbar-card,
.state-card,
.role-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.toolbar-card {
  padding: 18px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.field-input {
  width: 100%;
  border: 1px solid #dbe3ee;
  border-radius: 12px;
  padding: 12px 14px;
  font: inherit;
  background: #fff;
}

.state-card {
  padding: 24px;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.role-card {
  padding: 20px;
  display: grid;
  gap: 16px;
}

.role-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.role-card__badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.role-card__slug {
  margin-top: 10px;
  font-size: 0.92rem;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.role-card__description {
  margin: 0;
  color: #475569;
  line-height: 1.55;
}

.role-card__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  padding: 12px;
  border-radius: 14px;
  background: #f8fafc;
}

.meta-item__label {
  display: block;
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.meta-item__value {
  font-weight: 700;
}

.role-card__permissions-title {
  font-weight: 700;
  margin-bottom: 10px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 7px 12px;
  font-size: 0.88rem;
  font-weight: 600;
}

.chip-muted {
  background: #f1f5f9;
  color: #475569;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.82rem;
  font-weight: 700;
}

.badge-primary {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-dark {
  background: #0f172a;
  color: #fff;
}

.badge-light {
  background: #f1f5f9;
  color: #334155;
}

.alert {
  border-radius: 14px;
  padding: 14px 16px;
  font-weight: 500;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.alert-success {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.role-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary {
  background: #2b6cb0;
  color: #fff;
}

.btn-secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-small {
  padding: 8px 12px;
  font-size: 0.92rem;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 1100px) {
  .roles-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .roles-page__header {
    flex-direction: column;
  }

  .toolbar-card {
    grid-template-columns: 1fr;
  }

  .role-card__top {
    flex-direction: column;
  }

  .role-card__meta {
    grid-template-columns: 1fr;
  }

  .role-card__actions {
    width: 100%;
    justify-content: stretch;
  }

  .role-card__actions .btn {
    flex: 1 1 auto;
  }
}
</style>