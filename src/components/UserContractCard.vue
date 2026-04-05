<template>
  <div class="card">
    <div class="card-header">
      <h3>Контактная информация</h3>
      <button v-if="!isEditing" @click="startEditing" class="edit-btn">Редактировать</button>
      <div v-else class="action-buttons">
        <button @click="saveChanges" class="save-btn" :disabled="isLoading">Сохранить</button>
        <button @click="cancelEditing" class="cancel-btn">Отмена</button>
      </div>
    </div>

    <div v-if="!isEditing" class="card-body">
      <div class="info-row"><strong>Email:</strong> {{ user.email }}</div>
      <div class="info-row"><strong>Телефон:</strong> {{ user.phone || '—' }}</div>
    </div>

    <div v-else class="card-body">
      <div class="form-row">
        <label>Email:</label>
        <span class="readonly-field">{{ user.email }}</span>
      </div>
      <div class="form-row">
        <label>Телефон:</label>
        <input v-model="editable.phone" type="tel" placeholder="+7XXXXXXXXXX" />
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({ user: { type: Object, required: true } })
const emit = defineEmits(['update:user'])
const userStore = useUserStore()

const isEditing = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const editable = ref({ phone: '' })

function startEditing() {
  editable.value.phone = props.user.phone || ''
  errorMessage.value = ''
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

async function saveChanges() {
  isLoading.value = true
  try {
    const updatedUser = await userStore.updateUser({ phone: editable.value.phone })
    emit('update:user', updatedUser)
    isEditing.value = false
  } catch (error) {
    errorMessage.value = error.response?.data?.phone?.[0] || 'Ошибка сохранения'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  border-radius: var(--card-border-radius);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.2s ease;
}
.card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--header-footer-bg);
  border-bottom: 1px solid var(--card-border);
}
.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color);
}
.card-body {
  padding: 16px;
  background: var(--card-bg-solid);
}
.info-row {
  margin-bottom: 8px;
  color: var(--text-color);
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.form-row label {
  width: 120px;
  font-weight: 500;
  color: var(--text-color);
}
.form-row input {
  flex: 1;
  padding: 6px 10px;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: var(--input-border-radius);
  color: var(--text-color);
}
.readonly-field {
  flex: 1;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--input-border-radius);
  color: var(--text-muted);
}
.dark-theme .readonly-field {
  background: rgba(255, 255, 255, 0.05);
}
.edit-btn, .save-btn, .cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
}
.edit-btn { background: #007bff; color: white; }
.save-btn { background: #28a745; color: white; margin-right: 8px; }
.cancel-btn { background: #6c757d; color: white; }
.error-message {
  color: var(--input-error-color);
  margin-top: 8px;
}
.edit-btn, .save-btn, .cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
/* Кнопка "Редактировать" – градиентная */
.edit-btn {
  background: var(--btn-primary-gradient);
  background-size: 200% 200%;
  background-position: 0% 0%;
  color: white;
}
.edit-btn:hover {
  background-position: 100% 100%;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
/* Кнопка "Сохранить" – зелёная (оставляем) */
.save-btn {
  background: #28a745;
  color: white;
  margin-right: 8px;
}
.save-btn:hover {
  background: #218838;
  transform: translateY(-2px);
}
/* Кнопка "Отмена" – серая */
.cancel-btn {
  background: #6c757d;
  color: white;
}
.cancel-btn:hover {
  background: #5a6268;
  transform: translateY(-2px);
}
</style>