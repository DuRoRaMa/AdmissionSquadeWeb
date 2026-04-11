<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ editing ? 'Редактировать роль' : 'Создать роль' }}</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Название</label>
            <input v-model="form.name" required />
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

const props = defineProps({
  visible: Boolean,
  role: Object
})
const emit = defineEmits(['update:visible', 'saved'])

const form = ref({ name: '' })
const loading = ref(false)
const error = ref('')
const editing = ref(false)

function reset() {
  if (props.role) {
    form.value = { name: props.role.name }
    editing.value = true
  } else {
    form.value = { name: '' }
    editing.value = false
  }
}

async function submit() {
  if (!form.value.name.trim()) {
    error.value = 'Название обязательно'
    return
  }
  loading.value = true
  error.value = ''
  try {
    if (editing.value) {
      await apiClient.patch(`/api/v1/users/roles/${props.role.id}/`, form.value)
    } else {
      await apiClient.post('/api/v1/users/roles/', form.value)
    }
    emit('saved')
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
  if (val) reset()
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