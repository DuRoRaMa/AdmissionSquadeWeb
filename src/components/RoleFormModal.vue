<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'create',
  },
  role: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  parentOptions: {
    type: Array,
    default: () => [],
  },
  permissionGroups: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const emptyForm = () => ({
  name: '',
  slug: '',
  description: '',
  parent_id: '',
  permissions: [],
})

const form = reactive(emptyForm())

const isEditMode = computed(() => props.mode === 'edit')

const selectedPermissionCount = computed(() => form.permissions.length)

const groupedCount = computed(() =>
  props.permissionGroups.reduce((acc, group) => {
    acc[group.key] = form.permissions.filter((code) =>
      group.permissions.some((item) => item.code === code)
    ).length
    return acc
  }, {})
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return

    const role = props.role || {}

    form.name = role.name || ''
    form.slug = role.slug || ''
    form.description = role.description || ''
    form.parent_id =
      role.parent_id ?? role.parent?.id ?? ''
    form.permissions = Array.isArray(role.permissions)
      ? [...role.permissions]
      : []
  },
  { immediate: true }
)

function closeModal() {
  emit('update:modelValue', false)
}

function normalizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
}

function validateForm() {
  if (!form.name.trim()) {
    return 'Укажи название роли.'
  }

  if (!form.slug.trim()) {
    return 'Укажи slug.'
  }

  const normalized = normalizeSlug(form.slug)
  if (!normalized) {
    return 'Slug должен содержать латинские буквы, цифры, дефис или _.'
  }

  if (normalized !== form.slug.trim().toLowerCase()) {
    return 'Slug должен быть в lowercase и содержать только латиницу, цифры, дефис или _.'
  }

  return ''
}

function togglePermission(code) {
  if (form.permissions.includes(code)) {
    form.permissions = form.permissions.filter((item) => item !== code)
    return
  }

  form.permissions = [...form.permissions, code]
}

function groupIsFullySelected(group) {
  return group.permissions.every((permission) =>
    form.permissions.includes(permission.code)
  )
}

function groupIsPartiallySelected(group) {
  const selected = group.permissions.filter((permission) =>
    form.permissions.includes(permission.code)
  ).length

  return selected > 0 && selected < group.permissions.length
}

function toggleGroup(group) {
  const codes = group.permissions.map((item) => item.code)
  const fullySelected = codes.every((code) => form.permissions.includes(code))

  if (fullySelected) {
    form.permissions = form.permissions.filter((code) => !codes.includes(code))
    return
  }

  form.permissions = [...new Set([...form.permissions, ...codes])]
}

function submitForm() {
  const validationError = validateForm()
  if (validationError) {
    window.alert(validationError)
    return
  }

  emit('save', {
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase(),
    description: form.description.trim(),
    parent_id: form.parent_id || null,
    permissions: [...new Set(form.permissions)],
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="role-modal-overlay" @click.self="closeModal">
      <div class="role-modal">
        <div class="role-modal__header">
          <div>
            <h2 class="role-modal__title">
              {{ isEditMode ? 'Редактирование роли' : 'Создание роли' }}
            </h2>
            <p class="role-modal__subtitle">
              Настрой название, slug, родительскую роль и набор разрешений.
            </p>
          </div>

          <button
            type="button"
            class="role-modal__close"
            @click="closeModal"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div class="role-modal__body">
          <div class="role-form-grid">
            <div class="role-field">
              <label class="role-field__label">Название роли</label>
              <input
                v-model="form.name"
                type="text"
                class="role-field__input"
                placeholder="Например, Командир отряда"
              />
            </div>

            <div class="role-field">
              <label class="role-field__label">Slug</label>
              <input
                v-model="form.slug"
                type="text"
                class="role-field__input"
                placeholder="commander"
              />
              <p class="role-field__hint">
                Slug вводится вручную. Используй латиницу, цифры, дефис или _.
              </p>
            </div>
          </div>

          <div class="role-field">
            <label class="role-field__label">Описание</label>
            <textarea
              v-model="form.description"
              class="role-field__textarea"
              rows="3"
              placeholder="Кратко опиши, для чего нужна роль"
            />
          </div>

          <div class="role-field">
            <label class="role-field__label">Родительская роль</label>
            <select v-model="form.parent_id" class="role-field__input">
              <option value="">Без родительской роли</option>
              <option
                v-for="option in parentOptions"
                :key="option.id"
                :value="option.id"
              >
                {{ option.name }}
              </option>
            </select>
            <p class="role-field__hint">
              Если выбрать родительскую роль, ее права будут наследоваться.
            </p>
          </div>

          <div class="role-permissions-head">
            <div>
              <h3 class="role-permissions-head__title">Разрешения</h3>
              <p class="role-permissions-head__text">
                Выбрано: {{ selectedPermissionCount }}
              </p>
            </div>
          </div>

          <div class="role-permission-groups">
            <section
              v-for="group in permissionGroups"
              :key="group.key"
              class="role-permission-group"
            >
              <div class="role-permission-group__header">
                <div>
                  <h4 class="role-permission-group__title">
                    {{ group.title }}
                  </h4>
                  <p class="role-permission-group__description">
                    {{ group.description }}
                  </p>
                </div>

                <button
                  type="button"
                  class="role-group-toggle"
                  @click="toggleGroup(group)"
                >
                  {{
                    groupIsFullySelected(group)
                      ? 'Снять всё'
                      : 'Выбрать всё'
                  }}
                </button>
              </div>

              <div class="role-group-meta">
                <span class="role-group-meta__count">
                  Выбрано: {{ groupedCount[group.key] || 0 }}/{{ group.permissions.length }}
                </span>
                <span
                  v-if="groupIsPartiallySelected(group)"
                  class="role-group-meta__state"
                >
                  Частично выбрано
                </span>
              </div>

              <label
                v-for="permission in group.permissions"
                :key="permission.code"
                class="role-permission-item"
              >
                <input
                  :checked="form.permissions.includes(permission.code)"
                  type="checkbox"
                  @change="togglePermission(permission.code)"
                />
                <div class="role-permission-item__content">
                  <div class="role-permission-item__label">
                    {{ permission.label }}
                  </div>
                  <div class="role-permission-item__description">
                    {{ permission.description }}
                  </div>
                  <div class="role-permission-item__code">
                    {{ permission.code }}
                  </div>
                </div>
              </label>
            </section>
          </div>
        </div>

        <div class="role-modal__footer">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="loading"
            @click="closeModal"
          >
            Отмена
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="loading"
            @click="submitForm"
          >
            {{ loading ? 'Сохранение...' : isEditMode ? 'Сохранить' : 'Создать роль' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.role-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 27, 42, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.role-modal {
  width: min(980px, 100%);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
}

.role-modal__header,
.role-modal__footer {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.role-modal__footer {
  border-bottom: none;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.role-modal__body {
  padding: 24px;
  overflow-y: auto;
}

.role-modal__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.role-modal__subtitle {
  margin: 8px 0 0;
  color: #64748b;
}

.role-modal__close {
  border: none;
  background: transparent;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
  color: #64748b;
}

.role-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.role-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.role-field {
  margin-bottom: 16px;
}

.role-field__label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.role-field__input,
.role-field__textarea {
  width: 100%;
  border: 1px solid #dbe3ee;
  border-radius: 12px;
  padding: 12px 14px;
  font: inherit;
  background: #fff;
}

.role-field__input:focus,
.role-field__textarea:focus {
  outline: none;
  border-color: #2b6cb0;
  box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.12);
}

.role-field__hint {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: #64748b;
}

.role-permissions-head {
  margin: 8px 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-permissions-head__title {
  margin: 0;
  font-size: 1.05rem;
}

.role-permissions-head__text {
  margin: 4px 0 0;
  color: #64748b;
}

.role-permission-groups {
  display: grid;
  gap: 16px;
}

.role-permission-group {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  background: #f8fafc;
}

.role-permission-group__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.role-permission-group__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.role-permission-group__description {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

.role-group-toggle {
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.role-group-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 0.9rem;
}

.role-permission-item {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}

.role-permission-item + .role-permission-item {
  margin-top: 10px;
}

.role-permission-item__label {
  font-weight: 600;
}

.role-permission-item__description {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.92rem;
}

.role-permission-item__code {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: #2b6cb0;
  color: #fff;
}

.btn-secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .role-modal-overlay {
    padding: 12px;
  }

  .role-modal {
    max-height: calc(100vh - 24px);
  }

  .role-form-grid {
    grid-template-columns: 1fr;
  }

  .role-modal__header,
  .role-modal__body,
  .role-modal__footer {
    padding: 16px;
  }

  .role-permission-group__header {
    flex-direction: column;
  }

  .role-modal__footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>