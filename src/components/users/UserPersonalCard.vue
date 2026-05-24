<template>
  <div class="card">
    <div class="card-header">
      <h3>Личная информация</h3>
      <button v-if="!isEditing" @click="startEditing" class="edit-btn">Редактировать</button>
      <div v-else class="action-buttons">
        <button @click="saveChanges" class="save-btn" :disabled="isLoading">Сохранить</button>
        <button @click="cancelEditing" class="cancel-btn">Отмена</button>
      </div>
    </div>

    <div v-if="!isEditing" class="card-body">
      <div class="info-grid">
        <div><strong>Фамилия:</strong> {{ user.last_name }}</div>
        <div><strong>Имя:</strong> {{ user.first_name }}</div>
        <div><strong>Отчество:</strong> {{ user.middle_name || '—' }}</div>
        <div><strong>Пол:</strong> {{ genderLabel }}</div>
        <div><strong>Дата рождения:</strong> {{ formatDate(user.birth_day) }}</div>
        <div><strong>Статус:</strong> {{ user.is_blocked ? 'Заблокирован' : 'Активен' }}</div>
      </div>
    </div>

    <div v-else class="card-body">
      <div class="form-row">
        <label>Фамилия:</label>
        <input v-model="editable.last_name" type="text" />
      </div>
      <div class="form-row">
        <label>Имя:</label>
        <input v-model="editable.first_name" type="text" />
      </div>
      <div class="form-row">
        <label>Отчество:</label>
        <input v-model="editable.middle_name" type="text" />
      </div>
      <div class="form-row">
        <label>Пол:</label>
        <AppSelect
          v-model="editable.gender"
          :options="genderOptions"
          placeholder="Выберите пол"
        />
      </div>
      <div class="form-row">
        <label>Дата рождения:</label>
        <input v-model="editable.birth_day" type="date" />
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps({
  user: { type: Object, required: true }
})
const emit = defineEmits(['update:user'])
const userStore = useUserStore()

const isEditing = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const editable = ref({
  last_name: '', first_name: '', middle_name: '', gender: '', birth_day: ''
})

const genderOptions = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' }
]

const genderLabel = computed(() => {
  if (props.user.gender === 'male') return 'Мужской'
  if (props.user.gender === 'female') return 'Женский'
  return 'Не указан'
})

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function startEditing() {
  editable.value = {
    last_name: props.user.last_name,
    first_name: props.user.first_name,
    middle_name: props.user.middle_name || '',
    gender: props.user.gender || '',
    birth_day: props.user.birth_day || ''
  }
  errorMessage.value = ''
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

async function saveChanges() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const updatedUser = await userStore.updateUser({
      first_name: editable.value.first_name,
      last_name: editable.value.last_name,
      middle_name: editable.value.middle_name,
      gender: editable.value.gender,
      birth_day: editable.value.birth_day
    })
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
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  color: var(--text-color);
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
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
/* Кнопка "Сохранить" – зелёная */
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
.error-message {
  color: var(--input-error-color);
  margin-top: 8px;
}
</style>