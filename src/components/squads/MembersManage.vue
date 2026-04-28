<template>
  <section class="members-manage">
    <div class="members-header">
      <div>
        <h3 class="members-title">Участники отряда</h3>
        <p class="members-subtitle">
          Здесь можно менять номер билета, исключать участников и, для администратора, назначать роли.
        </p>
      </div>

      <button
        v-if="canAddMembers"
        class="btn btn-primary"
        @click="showAddModal = true"
      >
        + Добавить участника
      </button>
    </div>

    <div v-if="!canManageMembers" class="notice-card">
      У тебя нет прав на редактирование состава отряда. Доступен только просмотр участников.
    </div>

    <div v-else-if="canManageMembers && !canAssignRoles" class="notice-card">
      Ты можешь управлять составом отряда, но назначение ролей сейчас доступно только системному администратору.
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
                  <template v-if="canAssignRoles">
                    <AppSelect
                      v-model="member.role"
                      :options="roleOptions"
                      :disabled="savingRoleId === member.id"
                      @update:modelValue="handleRoleChange(member, $event)"
                    />

                    <div class="role-hint">
                      {{ savingRoleId === member.id ? 'Сохраняем роль...' : getRoleName(member.role) }}
                    </div>
                  </template>

                  <template v-else>
                    <div class="readonly-pill">
                      {{ getRoleName(member.role) }}
                    </div>
                    <div class="role-hint">
                      Роль доступна только для просмотра
                    </div>
                  </template>
                </div>
              </td>

              <td>
                <template v-if="canManageMembers">
                  <input
                    v-model="member.ticket_number"
                    class="ticket-input"
                    :disabled="savingTicketId === member.id"
                    placeholder="Например, 123456"
                    @blur="updateTicket(member)"
                  />
                </template>

                <template v-else>
                  <span class="readonly-text">
                    {{ member.ticket_number || '—' }}
                  </span>
                </template>
              </td>

              <td>
                {{ formatDate(member.joined_date) }}
              </td>

              <td>
                <template v-if="canManageMembers">
                  <button
                    class="btn btn-danger btn-small"
                    :disabled="removingId === member.id"
                    @click="removeMember(member)"
                  >
                    {{
                      removingId === member.id
                        ? 'Исключаем...'
                        : 'Исключить'
                    }}
                  </button>
                </template>

                <template v-else>
                  <span class="readonly-text">—</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalAddMember
      v-if="canAddMembers"
      v-model:visible="showAddModal"
      :squad-id="squadId"
      @added="handleMemberAdded"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import apiClient from '@/axios'
import AppSelect from '@/components/ui/AppSelect.vue'
import ModalAddMember from './ModalAddMember.vue'

import useAccess from '@/composables/useAccess'
import { useConfirmModal } from '@/composables/useConfirmModal'
import useUserStore from '@/stores/user'
import { PERMISSIONS } from '@/constants/permissions'

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
    canSquad(PERMISSIONS.SQUAD_MANAGE, props.squadId) ||
    canSquad(PERMISSIONS.MEMBERSHIP_MANAGE, props.squadId)
  )
})

const canAddMembers = computed(() => {
  return canManageMembers.value && userStore.isAdmin
})

const canAssignRoles = computed(() => {
  return canManageMembers.value && userStore.isAdmin && roles.value.length > 0
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
    role: member.role ?? member.role_detail?.id ?? null,
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
  if (!userStore.isAdmin) {
    roles.value = []
    return
  }

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
    await userStore.fetchUser()
  } catch (error) {
    console.error('Ошибка обновления текущего профиля после смены роли:', error)
  }
}

function getRoleName(roleId) {
  if (!roleId) return 'Без роли'
  return roles.value.find((role) => role.id === roleId)?.name || 'Роль не найдена'
}

async function handleRoleChange(member, nextValue) {
  if (!canAssignRoles.value) return

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

    successMessage.value = `Номер билета для «${member.user_detail?.full_name || member.user || member.id}» обновлён.`
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
    successMessage.value = 'Участник исключён из отряда.'
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
  if (!userStore.user) {
    await userStore.fetchUser()
  }

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
.readonly-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.42rem 0.72rem;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.08);
  border: 1px solid rgba(79, 70, 229, 0.18);
  color: var(--text-main, #1f2937);
  font-size: 0.85rem;
  font-weight: 600;
}

.readonly-text {
  color: var(--text-muted, #64748b);
  font-size: 0.95rem;
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
  text-align: left;
  border-bottom: 1px solid #edf2f7;
  vertical-align: top;
}

.members-table th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  background: #f8fafc;
}

.member-main {
  display: grid;
  gap: 4px;
}

.member-name {
  font-weight: 700;
  color: #1f2937;
}

.member-meta {
  font-size: 0.85rem;
  color: #64748b;
}

.role-cell {
  display: grid;
  gap: 8px;
  min-width: 220px;
}

.role-hint {
  font-size: 0.85rem;
  color: #64748b;
}

.ticket-input {
  width: 160px;
  border: 1px solid #dbe4f0;
  border-radius: 12px;
  padding: 10px 12px;
  font: inherit;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  font: inherit;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #2563eb);
  color: #ffffff;
}

.btn-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-small {
  padding: 8px 12px;
}
</style>