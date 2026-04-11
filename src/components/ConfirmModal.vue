<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="close">Отмена</button>
          <button class="btn-submit" @click="confirm">Подтвердить</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
let resolvePromise = null

const title = ref('Подтверждение')
const message = ref('Вы уверены?')

function open(options = {}) {
  title.value = options.title || 'Подтверждение'
  message.value = options.message || 'Вы уверены?'
  visible.value = true
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

function confirm() {
  visible.value = false
  if (resolvePromise) resolvePromise(true)
  resolvePromise = null
}

function close() {
  visible.value = false
  if (resolvePromise) resolvePromise(false)
  resolvePromise = null
}

defineExpose({ open })
</script>

<style scoped>
/* стили аналогичны другим модальным окнам */
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
  z-index: 10001;
}
.modal-container {
  background: var(--card-bg-solid);
  border-radius: var(--card-border-radius);
  width: 90%;
  max-width: 400px;
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
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}
.modal-body {
  padding: 1rem;
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
</style>