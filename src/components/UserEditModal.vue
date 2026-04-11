<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Редактирование пользователя</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Email</label>
            <input v-model="form.email" disabled />
          </div>
          <div class="form-row">
            <label>Фамилия</label>
            <input v-model="form.last_name" />
          </div>
          <div class="form-row">
            <label>Имя</label>
            <input v-model="form.first_name" />
          </div>
          <div class="form-row">
            <label>Отчество</label>
            <input v-model="form.middle_name" />
          </div>
          <div class="form-row">
            <label>Телефон</label>
            <input v-model="form.phone" />
          </div>
          <div class="form-row">
            <label>Пол</label>
            <AppSelect v-model="form.gender" :options="genderOptions" placeholder="Не указан" />
          </div>
          <div class="form-row">
            <label>Дата рождения</label>
            <input v-model="form.birth_day" type="date" />
          </div>
          <div class="form-row">
            <label>Роль (админ)</label>
            <input type="checkbox" v-model="form.is_staff" /> Администратор
          </div>
          <div class="form-row">
            <label>Блокировка</label>
            <input type="checkbox" v-model="form.is_blocked" /> Заблокирован
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="close">Отмена</button>
            <button class="btn-submit" @click="submit" :disabled="loading">Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import apiClient from '@/axios'
import AppSelect from './AppSelect.vue'

const props = defineProps({
  visible: Boolean,
  user: Object,
  roles: Array
})
const emit = defineEmits(['update:visible', 'updated'])

const form = ref({})
const loading = ref(false)
const error = ref('')

const genderOptions = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' }
]

function resetForm() {
  if (props.user) {
    form.value = { ...props.user }
  } else {
    form.value = {}
  }
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await apiClient.patch(`/api/v1/users/${props.user.id}/`, form.value)
    emit('updated')
    close()
  } catch (err) {
    error.value = err.response?.data?.detail || 'Ошибка сохранения'
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:visible', false)
}

watch(() => props.visible, (val) => {
  if (val) resetForm()
  else error.value = ''
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
  max-width: 550px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
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
  overflow-y: auto;
  flex: 1;
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
.form-row input,
.form-row select {
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