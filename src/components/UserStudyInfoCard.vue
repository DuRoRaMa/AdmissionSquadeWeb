<template>
  <div class="card">
    <div class="card-header">
      <h3>Учебная информация</h3>
      <button v-if="!isEditing && !user.study_info" @click="startCreate" class="edit-btn">Добавить</button>
      <button v-if="!isEditing && user.study_info" @click="startEdit" class="edit-btn">Редактировать</button>
      <div v-else-if="isEditing" class="action-buttons">
        <button @click="saveChanges" class="save-btn" :disabled="isLoading">Сохранить</button>
        <button @click="cancelEditing" class="cancel-btn">Отмена</button>
      </div>
    </div>

    <div class="card-body">
      <!-- Режим просмотра -->
      <div v-if="!isEditing && user.study_info" class="info-grid">
        <div><strong>Факультет:</strong> {{ user.study_info.faculty_display }}</div>
        <div><strong>Группа:</strong> {{ user.study_info.student_group }}</div>
        <div><strong>Форма обучения:</strong> {{ user.study_info.study_form_display }}</div>
      </div>
      <div v-else-if="!isEditing && !user.study_info" class="empty">
        Учебная информация не заполнена
      </div>

      <!-- Режим редактирования/создания -->
      <div v-else class="form">
        <div class="form-row">
          <label>Факультет:</label>
          <AppSelect
            v-model="editable.faculty"
            :options="faculties"
            placeholder="Выберите факультет"
          />
        </div>
        <div class="form-row">
          <label>Номер группы:</label>
          <input v-model="editable.student_group" type="text" placeholder="Б9120-09.03.01" />
        </div>
        <div class="form-row">
          <label>Форма обучения:</label>
          <AppSelect
            v-model="editable.study_form"
            :options="studyForms"
            placeholder="Выберите форму обучения"
          />
        </div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import apiClient from '@/axios'
import AppSelect from '@/components/AppSelect.vue'

const props = defineProps({
  user: { type: Object, required: true }
})
const emit = defineEmits(['update:user'])

const isEditing = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const editable = ref({
  faculty: '',
  student_group: '',
  study_form: 'Full-time'
})

const faculties = [
  { value: 'IMKT', label: 'ИМКТ' },
  { value: 'VI', label: 'ВИ' },
  { value: 'PISH', label: 'ПИШ' },
  { value: 'SHIGN', label: 'ШИГН' },
  { value: 'IMO', label: 'ИМО' },
  { value: 'PI', label: 'ПИ' },
  { value: 'ITPM', label: 'ИТПМ' },
  { value: 'SHMINZ', label: 'ШМИНЖ' },
  { value: 'IFKS', label: 'ИФКС' },
  { value: 'USH', label: 'ЮШ' },
  { value: 'SHEM', label: 'ШЭМ' },
  { value: 'SHP', label: 'ШП' }
]

const studyForms = [
  { value: 'Full-time', label: 'Очная' },
  { value: 'Full-part-time', label: 'Очно-заочная' },
  { value: 'Part-time', label: 'Заочная' }
]

function startCreate() {
  editable.value = {
    faculty: '',
    student_group: '',
    study_form: 'Full-time'
  }
  isEditing.value = true
  errorMessage.value = ''
}

function startEdit() {
  if (props.user.study_info) {
    editable.value = {
      faculty: props.user.study_info.faculty,
      student_group: props.user.study_info.student_group,
      study_form: props.user.study_info.study_form
    }
  }
  isEditing.value = true
  errorMessage.value = ''
}

function cancelEditing() {
  isEditing.value = false
  errorMessage.value = ''
}

async function saveChanges() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const method = props.user.study_info ? 'patch' : 'post'
    const response = await apiClient[method]('/api/v1/users/me/study-info/', editable.value)
    const updatedUser = { ...props.user, study_info: response.data }
    emit('update:user', updatedUser)
    isEditing.value = false
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Ошибка сохранения'
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
  box-shadow: var(--card-shadow);
  border: var(--card-border);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
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
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  color: var(--text-color);
}
.empty {
  color: var(--text-muted);
  font-style: italic;
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.form-row label {
  width: 140px;
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
.edit-btn, .save-btn, .cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}
.edit-btn {
  background: var(--btn-primary-gradient);
  color: white;
}
.save-btn {
  background: #28a745;
  color: white;
  margin-right: 8px;
}
.cancel-btn {
  background: #6c757d;
  color: white;
}
.edit-btn:hover, .save-btn:hover, .cancel-btn:hover {
  opacity: 0.9;
}
.error-message {
  color: var(--input-error-color);
  margin-top: 8px;
}
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .form-row label {
    width: auto;
    margin-bottom: 4px;
  }
}
</style>