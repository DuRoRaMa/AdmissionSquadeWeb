<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Заявка на выход из отряда</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Вы действительно хотите покинуть отряд <strong>{{ squadName }}</strong>?</p>
          <div class="form-group">
            <label for="reason">Причина выхода (обязательно):</label>
            <textarea
              id="reason"
              v-model="reason"
              rows="4"
              placeholder="Опишите причину, по которой вы хотите выйти из отряда..."
              class="reason-input"
            ></textarea>
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="close" :disabled="isLoading">Отмена</button>
          <button class="btn-submit" @click="submit" :disabled="isLoading || !reason.trim()">
            {{ isLoading ? 'Отправка...' : 'Отправить заявку' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useExitRequestsStore } from '@/stores/exitRequests'

const props = defineProps({
  visible: Boolean,
  membershipId: Number,
  squadName: String
})

const emit = defineEmits(['close', 'success'])

const reason = ref('')
const error = ref('')
const isLoading = ref(false)

const exitRequestsStore = useExitRequestsStore()

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    reason.value = ''
    error.value = ''
  }
})

async function submit() {
  if (!reason.value.trim()) {
    error.value = 'Укажите причину выхода'
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    await exitRequestsStore.createExitRequest(props.membershipId, reason.value)
    emit('success')
    close()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function close() {
  emit('close')
}
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
  transition: color 0.2s;
}
.close-btn:hover {
  color: var(--text-color);
}
.modal-body {
  padding: 1rem;
}
.form-group {
  margin-top: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}
.reason-input {
  width: 100%;
  padding: 0.5rem;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: var(--input-border-radius);
  color: var(--text-color);
  resize: vertical;
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
  transition: opacity 0.2s;
}
.btn-cancel {
  background: #6c757d;
  color: white;
}
.btn-submit {
  background: var(--btn-primary-gradient);
  color: white;
}
.btn-submit:disabled, .btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-message {
  margin-top: 0.5rem;
  color: var(--input-error-color);
  font-size: 0.85rem;
}
</style>