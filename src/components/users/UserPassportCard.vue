<template>
  <div class="card">
    <div class="card-header">
      <h3>Паспортные данные</h3>
      <button v-if="!isEditing && !user.passport" @click="startCreate" class="edit-btn">Добавить</button>
      <button v-if="!isEditing && user.passport" @click="startEdit" class="edit-btn">Редактировать</button>
      <div v-else-if="isEditing" class="action-buttons">
        <button @click="saveChanges" class="save-btn" :disabled="isLoading">Сохранить</button>
        <button @click="cancelEditing" class="cancel-btn">Отмена</button>
      </div>
    </div>
    <div class="card-body">
      <!-- Режим просмотра -->
      <div v-if="!isEditing && user.passport" class="info-grid">
        <div><strong>Серия:</strong> {{ user.passport.series }}</div>
        <div><strong>Номер:</strong> {{ user.passport.number }}</div>
        <div><strong>Кем выдан:</strong> {{ user.passport.issued_by }}</div>
        <div><strong>Дата выдачи:</strong> {{ formatDate(user.passport.date_of_issue) }}</div>
        <div><strong>Код подразделения:</strong> {{ user.passport.unit_code }}</div>
        <div><strong>Адрес регистрации:</strong> {{ user.passport.registration_address }}</div>
      </div>
      <div v-else-if="!isEditing && !user.passport" class="empty">
        Паспортные данные не заполнены
      </div>

      <!-- Режим редактирования/создания -->
      <div v-else class="form">
        <div class="form-row">
          <label>Серия (4 цифры):</label>
          <input v-model="editable.series" type="text" maxlength="4" placeholder="1234" />
        </div>
        <div class="form-row">
          <label>Номер (6 цифр):</label>
          <input v-model="editable.number" type="text" maxlength="6" placeholder="567890" />
        </div>
        <div class="form-row">
          <label>Кем выдан:</label>
          <input v-model="editable.issued_by" type="text" placeholder="УФМС России по Приморскому краю" />
        </div>
        <div class="form-row">
          <label>Дата выдачи:</label>
          <input v-model="editable.date_of_issue" type="date" />
        </div>
        <div class="form-row">
          <label>Код подразделения:</label>
          <input v-model="editable.unit_code" type="text" placeholder="XXX-XXX или XXXXXX" />
        </div>
        <div class="form-row">
          <label>Адрес регистрации:</label>
          <textarea v-model="editable.registration_address" rows="3" placeholder="г. Владивосток, ул. Пушкина, д. 10"></textarea>
        </div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import apiClient from '@/axios'

const props = defineProps({
  user: { type: Object, required: true }
})
const emit = defineEmits(['update:user'])

const isEditing = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const editable = ref({
  series: '',
  number: '',
  issued_by: '',
  date_of_issue: '',
  unit_code: '',
  registration_address: ''
})

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function startCreate() {
  editable.value = {
    series: '', number: '', issued_by: '', date_of_issue: '', unit_code: '', registration_address: ''
  }
  isEditing.value = true
}

function startEdit() {
  if (props.user.passport) {
    editable.value = { ...props.user.passport }
  }
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  errorMessage.value = ''
}

async function saveChanges() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const method = props.user.passport ? 'patch' : 'post'
    const response = await apiClient[method]('/api/v1/users/me/passport/', editable.value)
    const updatedUser = { ...props.user, passport: response.data }
    emit('update:user', updatedUser)
    isEditing.value = false
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Ошибка сохранения паспортных данных'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* те же стили, что в UserStudyInfoCard */
.card { background: var(--card-bg); backdrop-filter: blur(var(--card-blur)); border-radius: var(--card-border-radius); box-shadow: 0 8px 20px rgba(0,0,0,0.15); overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--header-footer-bg); border-bottom: 1px solid var(--card-border); }
.card-header h3 { margin: 0; font-size: 1.2rem; color: var(--text-color); }
.card-body { padding: 16px; background: var(--card-bg-solid); }
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; color: var(--text-color); }
.empty { color: var(--text-muted); font-style: italic; }
.form-row { display: flex; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.form-row label { width: 140px; font-weight: 500; color: var(--text-color); }
.form-row input, .form-row textarea, .form-row select { flex: 1; padding: 6px 10px; background: var(--input-bg); border: var(--input-border); border-radius: var(--input-border-radius); color: var(--text-color); }
.error-message { color: var(--input-error-color); margin-top: 8px; }
@media (max-width: 768px) { .form-row { flex-direction: column; align-items: flex-start; } .form-row label { width: auto; margin-bottom: 4px; } }
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
