<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ editing ? 'Редактировать взнос' : 'Добавить взнос' }}</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Сумма (руб.):</label>
            <input v-model="form.amount" type="number" step="0.01" required />
          </div>
          <div class="form-row">
            <label>Дата оплаты:</label>
            <input v-model="form.paid_at" type="date" required />
          </div>
          <div class="form-row">
            <label>Дата истечения:</label>
            <input v-model="form.expires_at" type="date" required />
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="close" :disabled="loading">Отмена</button>
          <button class="btn-submit" @click="submit" :disabled="loading || !form.amount || !form.paid_at || !form.expires_at">
            {{ loading ? 'Сохранение...' : 'Сохранить' }}
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
  membershipId: Number,
  fee: Object
})
const emit = defineEmits(['close', 'saved'])

const form = ref({ amount: '', paid_at: '', expires_at: '' })
const loading = ref(false)
const error = ref('')
const editing = ref(false)

function resetForm() {
  form.value = { amount: '', paid_at: '', expires_at: '' }
  editing.value = false
}

function setFee(fee) {
  if (fee) {
    form.value = {
      amount: fee.amount,
      paid_at: fee.paid_at,
      expires_at: fee.expires_at
    }
    editing.value = true
  } else {
    resetForm()
  }
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    if (editing.value) {
      await apiClient.patch(`/api/v1/squads/fees/${props.fee.id}/`, form.value)
    } else {
      await apiClient.post(`/api/v1/squads/members/${props.membershipId}/fees/`, form.value)
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
  emit('close')
}

watch(() => props.visible, (val) => {
  if (val) {
    setFee(props.fee)
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