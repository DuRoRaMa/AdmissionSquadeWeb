<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Заявка на выход</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Вы действительно хотите покинуть отряд <strong>{{ squadName }}</strong>?</p>
          <div class="form-row">
            <label>Причина выхода (обязательно)</label>
            <textarea v-model="reason" rows="4" placeholder="Опишите причину..."></textarea>
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="close" :disabled="loading">Отмена</button>
            <button class="btn-submit" @click="submit" :disabled="loading || !reason.trim()">
              {{ loading ? 'Отправка...' : 'Отправить заявку' }}
            </button>
          </div>
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
const emit = defineEmits(['update:visible', 'success'])

const reason = ref('')
const error = ref('')
const loading = ref(false)
const exitRequestsStore = useExitRequestsStore()

async function submit() {
  if (!reason.value.trim()) {
    error.value = 'Укажите причину выхода'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await exitRequestsStore.createExitRequest(props.membershipId, reason.value)
    emit('success')
    close()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:visible', false)
}

watch(() => props.visible, (val) => {
  if (!val) {
    reason.value = ''
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
  max-width: 550px;
  max-height: 90vh;            /* ограничиваем высоту */
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
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
  line-height: 1;
}
.modal-body {
  padding: 1rem;
  overflow-y: auto;            /* вертикальная прокрутка */
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
.form-row textarea,
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
  flex-shrink: 0;
}
.btn-cancel,
.btn-submit {
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
  margin-bottom: 0.5rem;
}
@media (max-width: 576px) {
  .modal-container {
    width: 95%;
    max-height: 85vh;
  }
}
</style>