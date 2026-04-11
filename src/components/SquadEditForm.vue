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
        <button type="button" class="btn-delete" @click="confirmDelete" :disabled="isDeleting">Удалить отряд</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/axios'
import { useConfirmModal } from '@/composables/useConfirmModal'

const props = defineProps({
  squad: Object
})
const emit = defineEmits(['updated', 'deleted'])

const router = useRouter()
const { confirm } = useConfirmModal()
const form = ref({ ...props.squad })
const isLoading = ref(false)
const isDeleting = ref(false)
const error = ref('')

watch(() => props.squad, (newSquad) => {
  if (newSquad) form.value = { ...newSquad }
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

async function confirmDelete() {
  const ok = await confirm({
    title: 'Удаление отряда',
    message: 'Вы уверены, что хотите удалить этот отряд? Это действие необратимо.'
  })
  if (!ok) return
  isDeleting.value = true
  error.value = ''
  try {
    await apiClient.delete(`/api/v1/squads/${props.squad.id}/`)
    emit('deleted')
    router.push('/squads')
  } catch (err) {
    if (err.response?.status === 400) {
      error.value = err.response?.data?.detail || 'Нельзя удалить отряд с активными участниками'
    } else {
      error.value = 'Ошибка удаления'
    }
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
/* стили остаются без изменений */
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
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
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
.btn-save:disabled, .btn-delete:disabled {
  opacity: 0.6;
}
.btn-delete {
  background: #dc3545;
  border: none;
  border-radius: 50px;
  padding: 0.4rem 1.2rem;
  color: white;
  cursor: pointer;
}
.error {
  color: var(--input-error-color);
  margin-top: 0.5rem;
  text-align: center;
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