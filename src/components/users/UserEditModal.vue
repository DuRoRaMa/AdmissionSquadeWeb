<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <div>
            <h3>Редактирование пользователя</h3>
            <p class="modal-subtitle">
              {{ form.email || 'Пользователь' }}
            </p>
          </div>
          <button class="close-btn" @click="close">&times;</button>
        </div>

        <div class="modal-body">
          <section class="modal-section">
            <div class="section-title">Основные данные</div>

            <div class="form-grid">
              <div class="form-row form-row--full">
                <label>Email</label>
                <input v-model="form.email" disabled />
                <small class="field-hint">Email меняется отдельно и здесь только для просмотра.</small>
              </div>

              <div class="form-row">
                <label>Фамилия</label>
                <input v-model="form.last_name" />
              </div>

              <div class="form-row">
                <label>Имя</label>
                <input v-model="form.first_name" />
              </div>

              <div class="form-row">
                <label>Отчество</label>
                <input v-model="form.middle_name" />
              </div>

              <div class="form-row">
                <label>Телефон</label>
                <input v-model="form.phone" />
              </div>

              <div class="form-row">
                <label>Пол</label>
                <AppSelect
                  v-model="form.gender"
                  :options="genderOptions"
                  placeholder="Не указан"
                />
              </div>

              <div class="form-row">
                <label>Дата рождения</label>
                <input v-model="form.birth_day" type="date" />
              </div>
            </div>
          </section>

          <section class="modal-section">
            <div class="section-title">Системные права</div>

            <label class="toggle-card">
              <div>
                <div class="toggle-title">Системный администратор</div>
                <div class="toggle-description">
                  Даёт доступ к системному управлению, пользователям и ролям.
                </div>
              </div>

              <input type="checkbox" v-model="form.is_staff" />
            </label>
          </section>

          <section class="modal-section">
            <div class="section-title">Статус аккаунта</div>

            <label class="toggle-card">
              <div>
                <div class="toggle-title">Заблокирован</div>
                <div class="toggle-description">
                  Заблокированный пользователь не сможет нормально пользоваться системой.
                </div>
              </div>

              <input type="checkbox" v-model="form.is_blocked" />
            </label>
          </section>

          <div v-if="error" class="error-message">{{ error }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="close">Отмена</button>
          <button class="btn-submit" @click="submit" :disabled="loading">
            {{ loading ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import apiClient from '@/axios'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps({
  visible: Boolean,
  user: Object,
  roles: Array,
})

const emit = defineEmits(['update:visible', 'updated'])

const form = ref({})
const loading = ref(false)
const error = ref('')

const genderOptions = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
]

function resetForm() {
  const user = props.user || {}

  form.value = {
    email: user.email || '',
    last_name: user.last_name || '',
    first_name: user.first_name || '',
    middle_name: user.middle_name || '',
    phone: user.phone || '',
    gender: user.gender || '',
    birth_day: user.birth_day || '',
    is_staff: Boolean(user.is_staff),
    is_blocked: Boolean(user.is_blocked),
  }
}

async function submit() {
  loading.value = true
  error.value = ''

  try {
    await apiClient.patch(`/api/v1/users/${props.user.id}/`, form.value)
    emit('updated')
    close()
  } catch (err) {
    error.value =
      err.response?.data?.detail ||
      err.response?.data?.non_field_errors?.[0] ||
      'Ошибка сохранения'
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (val) => {
    if (val) resetForm()
    else error.value = ''
  }
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 23, 0.58);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.modal-container {
  width: min(760px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--card-bg-solid);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: var(--header-footer-bg);
  border-bottom: 1px solid var(--card-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.close-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--card-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.02);
}

.section-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--text-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-row--full {
  grid-column: 1 / -1;
}

.form-row label {
  font-weight: 600;
  color: var(--text-color);
}

.form-row input,
.form-row select {
  width: 100%;
  padding: 0.7rem 0.85rem;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: 14px;
  color: var(--text-color);
}

.field-hint {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--card-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
}

.toggle-title {
  font-weight: 600;
  color: var(--text-color);
}

.toggle-description {
  margin-top: 0.2rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.toggle-card input[type='checkbox'] {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 1rem 1.25rem;
  background: var(--header-footer-bg);
  border-top: 1px solid var(--card-border);
}

.btn-cancel,
.btn-submit {
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1.1rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel {
  background: rgba(108, 117, 125, 0.18);
  color: var(--text-color);
}

.btn-submit {
  background: var(--btn-primary-gradient);
  color: #fff;
}

.error-message {
  color: var(--input-error-color);
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-container {
    width: 100%;
    max-height: 95vh;
  }

  .toggle-card {
    align-items: flex-start;
  }
}
</style>