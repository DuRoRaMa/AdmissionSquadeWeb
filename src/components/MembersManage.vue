<template>
  <section class="members-manage">
    <div class="members-header">
      <div>
        <h3 class="members-title">Участники отряда</h3>
        <p class="members-subtitle">
          Здесь можно назначать роли участникам, менять номер билета и исключать из отряда.
        </p>
      </div>

      <button
        class="btn btn-primary"
        :disabled="!canManageMembers"
        @click="showAddModal = true"
      >
        + Добавить участника
      </button>
    </div>

    <div v-if="!canManageMembers" class="notice-card">
      У тебя нет прав на изменение состава отряда. Доступен только просмотр.
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <div v-if="loadingMembers || loadingRoles" class="state-card">
      Загрузка участников и ролей…
    </div>

    <div v-else-if="members.length === 0" class="state-card">
      Пока нет участников в этом отряде.
    </div>

    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="members-table">
          <thead>
            <tr>
              <th>Участник</th>
              <th>Роль</th>
              <th>Номер билета</th>
              <th>Дата вступления</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="member in members" :key="member.id">
              <td>
                <div class="member-main">
                  <div class="member-name">
                    {{ member.user_detail?.full_name || member.user_detail?.email || member.user || 'Участник' }}
                  </div>
                  <div class="member-meta">
                    ID membership: {{ member.id }}
                  </div>
                </div>
              </td>

              <td>
                <div class="role-cell">
                  <AppSelect
                    v-model="member.role"
                    :options="roleOptions"
                    :disabled="!canManageMembers || savingRoleId === member.id"
                    @update:modelValue="handleRoleChange(member, $event)"
                  />

                  <div class="role-hint">
                    {{
                      savingRoleId === member.id
                        ? 'Сохраняем роль...'
                        : getRoleName(member.role)
                    }}
                  </div>
                </div>
              </td>

              <td>
                <input
                  v-model="member.ticket_number"
                  class="ticket-input"
                  :disabled="!canManageMembers || savingTicketId === member.id"
                  placeholder="Например, 123456"
                  @blur="updateTicket(member)"
                />
              </td>

              <td>
                {{ formatDate(member.joined_date) }}
              </td>

              <td>
                <button
                  class="btn btn-danger btn-small"
                  :disabled="!canManageMembers || removingId === member.id"
                  @click="removeMember(member)"
                >
                  {{
                    removingId === member.id
                      ? 'Исключаем...'
                      : 'Исключить'
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalAddMember
      v-model:visible="showAddModal"
      :squad-id="squadId"
      @added="handleMemberAdded"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import apiClient from '@/axios'
import AppSelect from '@/components/AppSelect.vue'
import ModalAddMember from './ModalAddMember.vue'

import useAccess from '@/composables/useAccess'
import { useConfirmModal } from '@/composables/useConfirmModal'
import useUserStore from '@/stores/user'

const props = defineProps({
  squadId: {
    type: Number,
    required: true,
  },
})

const { canSquad } = useAccess()
const { confirm } = useConfirmModal()
const userStore = useUserStore()

const members = ref([])
const roles = ref([])

const loadingMembers = ref(false)
const loadingRoles = ref(false)

const savingRoleId = ref(null)
const savingTicketId = ref(null)
const removingId = ref(null)

const showAddModal = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const canManageMembers = computed(() => {
  return (
    canSquad('squad.manage', props.squadId) ||
    canSquad('squads.members.manage', props.squadId)
  )
})

const roleOptions = computed(() => [
  { value: null, label: 'Без роли' },
  ...roles.value.map((role) => ({
    value: role.id,
    label: role.name,
  })),
])

function normalizeListPayload(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function normalizeMember(member) {
  return {
    ...member,
    role:
      member.role ??
      member.role_detail?.id ??
      null,
    ticket_number: member.ticket_number ?? '',
  }
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

async function fetchMembers() {
  loadingMembers.value = true
  clearMessages()

  try {
    const response = await apiClient.get(`/api/v1/squads/${props.squadId}/members/`)
    members.value = normalizeListPayload(response.data).map(normalizeMember)
  } catch (error) {
    console.error(error)
    members.value = []
    errorMessage.value = 'Не удалось загрузить участников отряда.'
  } finally {
    loadingMembers.value = false
  }
}

async function fetchRoles() {
  loadingRoles.value = true

  try {
    const response = await apiClient.get('/api/v1/users/roles/')
    roles.value = normalizeListPayload(response.data)
  } catch (error) {
    console.error(error)
    roles.value = []
    errorMessage.value = errorMessage.value || 'Не удалось загрузить список ролей.'
  } finally {
    loadingRoles.value = false
  }
}

async function refreshAccessIfNeeded() {
  try {
    await userStore.initialize()
  } catch (error) {
    console.error('Ошибка обновления текущего профиля после смены роли:', error)
  }
}

function getRoleName(roleId) {
  if (!roleId) return 'Без роли'
  return roles.value.find((role) => role.id === roleId)?.name || 'Роль не найдена'
}

async function handleRoleChange(member, nextValue) {
  if (!canManageMembers.value) return

  const previousValue = member.role
  member.role = nextValue ?? null
  savingRoleId.value = member.id
  clearMessages()

  try {
    await apiClient.patch(`/api/v1/squads/members/${member.id}/`, {
      role: member.role || null,
    })

    successMessage.value = `Роль участника «${member.user_detail?.full_name || member.user || member.id}» обновлена.`
    await refreshAccessIfNeeded()
  } catch (error) {
    console.error(error)
    member.role = previousValue
    errorMessage.value = 'Не удалось обновить роль участника.'
    await fetchMembers()
  } finally {
    savingRoleId.value = null
  }
}

async function updateTicket(member) {
  if (!canManageMembers.value) return

  savingTicketId.value = member.id
  clearMessages()

  try {
    await apiClient.patch(`/api/v1/squads/members/${member.id}/`, {
      ticket_number: member.ticket_number || '',
    })

    successMessage.value = `Номер билета для «${member.user_detail?.full_name || member.user || member.id}» обновлен.`
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Не удалось обновить номер билета.'
    await fetchMembers()
  } finally {
    savingTicketId.value = null
  }
}

async function removeMember(member) {
  if (!canManageMembers.value) return

  const approved = await confirm({
    title: 'Исключение участника',
    message: `Исключить ${member.user_detail?.full_name || member.user || 'участника'} из отряда?`,
  })

  if (!approved) return

  removingId.value = member.id
  clearMessages()

  try {
    await apiClient.delete(`/api/v1/squads/members/${member.id}/`)
    successMessage.value = 'Участник исключен из отряда.'
    await fetchMembers()
    await refreshAccessIfNeeded()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Не удалось исключить участника.'
  } finally {
    removingId.value = null
  }
}

async function handleMemberAdded() {
  showAddModal.value = false
  successMessage.value = 'Участник добавлен в отряд.'
  await fetchMembers()
  await refreshAccessIfNeeded()
}

async function bootstrap() {
  await Promise.all([fetchMembers(), fetchRoles()])
}

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

watch(
  () => props.squadId,
  async () => {
    await bootstrap()
  }
)

onMounted(bootstrap)
</script>

<style scoped>
.members-manage {
  display: grid;
  gap: 18px;
}

.members-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.members-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main, #1f2937);
}

.members-subtitle {
  margin: 8px 0 0;
  color: var(--text-muted, #6b7280);
  line-height: 1.5;
}

.notice-card,
.alert,
.state-card,
.table-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--card-border, #e5e7eb);
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.notice-card,
.alert,
.state-card {
  padding: 16px 18px;
}

.notice-card {
  background: #f8fafc;
  color: #475569;
}

.alert-error {
  background: #fff5f5;
  border-color: #fecaca;
  color: #b91c1c;
}

.alert-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.state-card {
  color: var(--text-muted, #6b7280);
}

.table-card {
  overflow: hidden;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

.members-table th,
.members-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--card-border, #e5e7eb);
  text-align: left;
  vertical-align: middle;
}

.members-table thead th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.92rem;
  font-weight: 700;
}

.members-table tbody tr:hover {
  background: rgba(37, 99, 235, 0.03);
}

.member-main {
  display: grid;
  gap: 4px;
}

.member-name {
  font-weight: 700;
  color: var(--text-main, #1f2937);
}

.member-meta {
  font-size: 0.85rem;
  color: var(--text-muted, #6b7280);
}

.role-cell {
  display: grid;
  gap: 8px;
}

.role-hint {
  font-size: 0.85rem;
  color: var(--text-muted, #6b7280);
}

.ticket-input {
  width: 100%;
  min-width: 160px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--card-border, #d1d5db);
  background: #fff;
  font: inherit;
}

.ticket-input:focus {
  outline: none;
  border-color: var(--brand-600, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: var(--brand-600, #2563eb);
  color: #fff;
}

.btn-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-small {
  padding: 8px 12px;
}

@media (max-width: 768px) {
  .members-header {
    flex-direction: column;
  }

  .members-header .btn {
    width: 100%;
  }
}
</style>