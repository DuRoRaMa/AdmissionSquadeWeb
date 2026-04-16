<script setup>
import { ref, watch } from 'vue'
import rolesService from '@/services/roles.service'

const props = defineProps({
  visible: Boolean,
  role: Object
})

const emit = defineEmits(['update:visible', 'saved'])

const form = ref({
  name: '',
  slug: ''
})

const loading = ref(false)
const error = ref('')
const editing = ref(false)
const slugTouched = ref(false)

const ruMap = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
}

function transliterate(text) {
  return String(text || '')
    .toLowerCase()
    .split('')
    .map(char => ruMap[char] ?? char)
    .join('')
}

function buildSlugFromName(value) {
  return transliterate(value)
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeManualSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function reset() {
  if (props.role) {
    form.value = {
      name: props.role.name || '',
      slug: props.role.slug || ''
    }
    editing.value = true
  } else {
    form.value = {
      name: '',
      slug: ''
    }
    editing.value = false
  }

  slugTouched.value = false
  error.value = ''
}

function handleNameInput() {
  if (!slugTouched.value) {
    form.value.slug = buildSlugFromName(form.value.name)
  }
}

function handleSlugInput() {
  slugTouched.value = true
  form.value.slug = normalizeManualSlug(form.value.slug)
}

function extractErrorMessage(err) {
  return (
    err.response?.data?.slug?.[0] ||
    err.response?.data?.name?.[0] ||
    err.response?.data?.detail ||
    'Ошибка сохранения'
  )
}

async function submit() {
  if (!form.value.name.trim()) {
    error.value = 'Название обязательно'
    return
  }

  if (!form.value.slug.trim()) {
    error.value = 'Slug обязателен'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (editing.value) {
      await rolesService.updateRole(props.role.id, form.value)
    } else {
      await rolesService.createRole(form.value)
    }

    emit('saved')
    close()
  } catch (err) {
    error.value = extractErrorMessage(err)
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:visible', false)
}

watch(() => props.visible, (val) => {
  if (val) reset()
  else error.value = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ editing ? 'Редактировать роль' : 'Создать роль' }}</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-row">
            <label>Название</label>
            <input
              v-model="form.name"
              required
              placeholder="Например: Командир"
              @input="handleNameInput"
            />
          </div>

          <div class="form-row">
            <label>Slug</label>
            <input
              v-model="form.slug"
              required
              placeholder="Например: commander"
              @input="handleSlugInput"
            />
            <small class="hint">
              Поле можно заполнять вручную. Рекомендуется короткое латинское значение,
              например: <code>commander</code>, <code>member</code>, <code>admin</code>.
            </small>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="close" :disabled="loading">
              Отмена
            </button>
            <button class="btn-submit" @click="submit" :disabled="loading">
              {{ loading ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
}

.modal-container {
  background: var(--card-bg-solid);
  border-radius: var(--card-border-radius);
  width: 100%;
  max-width: 560px;
  max-height: min(90vh, 820px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  background: var(--header-footer-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: clamp(1rem, 1.2vw, 1.15rem);
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
  padding: 1rem 1.2rem 1.2rem;
  overflow-y: auto;
}

.form-row {
  margin-bottom: 1rem;
}

.form-row label {
  display: block;
  margin-bottom: 0.45rem;
  color: var(--text-color);
  font-weight: 600;
}

.form-row input {
  width: 100%;
  padding: 0.8rem 0.95rem;
  border-radius: 14px;
  border: var(--card-border);
  background: var(--header-footer-bg);
  color: var(--text-color);
  outline: none;
}

.form-row input:focus {
  box-shadow: 0 0 0 3px rgba(120, 120, 255, 0.15);
}

.hint {
  display: block;
  margin-top: 0.4rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.error-message {
  margin-top: 0.5rem;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background: rgba(220, 53, 69, 0.12);
  color: #ff9aa5;
}

.modal-footer {
  margin-top: 1.2rem;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-cancel,
.btn-submit {
  border: none;
  border-radius: 14px;
  padding: 0.8rem 1rem;
  font-weight: 600;
  min-width: 120px;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-color);
}

.btn-submit {
  background: var(--btn-primary-gradient, var(--accent-gradient));
  color: white;
}

.btn-cancel:disabled,
.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 576px) {
  .modal-container {
    max-width: 100%;
    border-radius: 22px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
}
</style>