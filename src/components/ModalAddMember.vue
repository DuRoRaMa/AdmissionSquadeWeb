<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Добавить участника</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Пользователь:</label>
            <select v-model="form.user_id" required>
              <option value="">Выберите</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name || u.email }}</option>
            </select>
          </div>
          <div class="form-row">
            <label>Роль:</label>
            <select v-model="form.role_id" required>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="form-row">
            <label>Номер билета:</label>
            <input v-model="form.ticket_number" type="text" placeholder="Необязательно" />
          </div>
          <div class="form-row">
            <label>Университет:</label>
            <input v-model="form.university" type="text" placeholder="ДВФУ" />
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="close" :disabled="loading">Отмена</button>
          <button class="btn-submit" @click="submit" :disabled="loading || !form.user_id || !form.role_id">
            {{ loading ? 'Добавление...' : 'Добавить' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import apiClient from '@/axios'

const props = defineProps({
  visible: Boolean,
  squadId: Number
})
const emit = defineEmits(['close', 'added'])

const users = ref([])
const roles = ref([])
const form = ref({ user_id: '', role_id: '', ticket_number: '', university: 'ДВФУ' })
const loading = ref(false)
const error = ref('')

async function fetchUsers() {
  try {
    const res = await apiClient.get('/api/v1/users/')
    users.value = res.data.results || res.data
  } catch (err) {
    console.error(err)
  }
}

async function fetchRoles() {
  const res = await apiClient.get('/api/v1/users/roles/')
  roles.value = res.data
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await apiClient.post(`/api/v1/squads/${props.squadId}/members/`, {
      user: form.value.user_id,
      role: form.value.role_id,
      ticket_number: form.value.ticket_number,
      university: form.value.university
    })
    emit('added')
    close()
  } catch (err) {
    error.value = err.response?.data?.detail || 'Ошибка добавления'
  } finally {
    loading.value = false
  }
}

function close() {
  emit('close')
}

watch(() => props.visible, (val) => {
  if (val) {
    fetchUsers()
    fetchRoles()
    form.value = { user_id: '', role_id: '', ticket_number: '', university: 'ДВФУ' }
    error.value = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.modal-container {
  background: var(--card-bg-solid);
  border-radius: var(--card-border-radius);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--header-footer-bg);
  border-bottom: 1px solid var(--card-border);
}
.modal-header h3 {
  margin: 0;
  color: var(--text-color);
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--text-muted);
}
.modal-body {
  padding: 1rem;
}
.form-row {
  margin-bottom: 1rem;
}
.form-row label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: 500;
  color: var(--text-color);
}
.form-row select, .form-row input {
  width: 100%;
  padding: 0.5rem;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: var(--input-border-radius);
  color: var(--text-color);
}
.modal-footer {
  padding: 1rem;
  background: var(--header-footer-bg);
  border-top: 1px solid var(--card-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.btn-cancel, .btn-submit {
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
}
.btn-cancel {
  background: #6c757d;
  color: white;
}
.btn-submit {
  background: var(--btn-primary-gradient);
  color: white;
}
.error-message {
  color: var(--input-error-color);
  margin-top: 0.5rem;
}
</style>