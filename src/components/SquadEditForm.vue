<template>
  <div class="squad-edit-form">
    <form @submit.prevent="save">
      <div class="form-row">
        <label>Название:</label>
        <input v-model="form.name" type="text" required />
      </div>
      <div class="form-row">
        <label>Описание:</label>
        <textarea v-model="form.description" rows="3"></textarea>
      </div>
      <div class="form-row">
        <label>Региональное отделение:</label>
        <input v-model="form.regional_office" type="text" />
      </div>
      <div class="form-row">
        <label>Регион:</label>
        <input v-model="form.region" type="text" />
      </div>
      <div class="form-row">
        <label>Работодатель:</label>
        <input v-model="form.employer" type="text" />
      </div>
      <div class="form-row">
        <label>Направление ЛСО:</label>
        <input v-model="form.lso_directions" type="text" />
      </div>
      <div class="actions">
        <button type="submit" class="btn-save" :disabled="isLoading">Сохранить</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import apiClient from '@/axios'

const props = defineProps({
  squad: Object
})
const emit = defineEmits(['updated'])

const form = ref({
  name: '',
  description: '',
  regional_office: '',
  region: '',
  employer: '',
  lso_directions: ''
})
const isLoading = ref(false)
const error = ref('')

watch(() => props.squad, (newSquad) => {
  if (newSquad) {
    form.value = { ...newSquad }
  }
}, { immediate: true })

async function save() {
  isLoading.value = true
  error.value = ''
  try {
    await apiClient.patch(`/api/v1/squads/${props.squad.id}/`, form.value)
    emit('updated')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Ошибка сохранения'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.squad-edit-form {
  padding: 1rem;
  background: var(--card-bg-solid);
  border-radius: var(--card-border-radius);
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.form-row label {
  width: 180px;
  font-weight: 500;
  color: var(--text-color);
}
.form-row input, .form-row textarea {
  flex: 1;
  padding: 0.5rem;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: var(--input-border-radius);
  color: var(--text-color);
}
.actions {
  text-align: right;
  margin-top: 1rem;
}
.btn-save {
  background: var(--btn-primary-gradient);
  border: none;
  border-radius: 50px;
  padding: 0.4rem 1.2rem;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-save:disabled {
  opacity: 0.6;
}
.error {
  color: var(--input-error-color);
  margin-top: 0.5rem;
}
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
  .form-row label {
    width: auto;
  }
}
</style>