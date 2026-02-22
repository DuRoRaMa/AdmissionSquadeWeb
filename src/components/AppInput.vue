<template>
  <div class="mb-3">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <div class="input-wrapper" :class="{ 'with-icon': icon, 'with-right-icon': hasRightIcon }">
      <i v-if="icon" :class="['input-icon', `bi-${icon}`]"></i>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="form-control"
        :class="{ 'is-invalid': error }"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
        v-bind="$attrs"
      />
      <div v-if="$slots['right-icon']" class="right-icon">
        <slot name="right-icon" />
      </div>
    </div>
    <div v-if="error" class="invalid-feedback">{{ error }}</div>
    <div v-else-if="hint" class="form-text">{{ hint }}</div>
  </div>
</template>

<script setup>
import { useSlots, computed } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  id: String,
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  error: String,
  hint: String,
  icon: String
})

defineEmits(['update:modelValue', 'blur'])

const slots = useSlots()
const hasRightIcon = computed(() => !!slots['right-icon'])
</script>

<style scoped>
/* Стили для метки */
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--label-color);
  font-weight: 500;
  font-size: var(--label-font-size);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.text-danger {
  color: var(--input-error-color);
}

/* Обёртка поля */
.input-wrapper {
  position: relative;
  width: 100%;
}

/* Само поле */
.form-control {
  width: 100%;
  padding: var(--input-padding-y) var(--input-padding-x);
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: var(--input-border-radius);
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.5;
  transition: all 0.2s ease;
  outline: none;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.form-control:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}
.form-control:focus {
  border-color: transparent;
  background: rgba(255, 255, 255, 0.3);
  box-shadow: var(--input-focus-shadow);
}
.form-control:disabled {
  opacity: var(--input-disabled-opacity);
  pointer-events: none;
  background: rgba(0, 0, 0, 0.1);
}

/* Состояние ошибки */
.form-control.is-invalid {
  border-color: var(--input-error-color);
  box-shadow: var(--input-error-shadow);
}
.form-control.is-invalid:focus {
  box-shadow: var(--input-error-shadow);
}
.invalid-feedback {
  color: var(--input-error-color);
  font-size: 0.85rem;
  margin-top: 0.3rem;
  padding-left: 1rem;
}

/* Подсказка */
.form-text {
  color: var(--hint-color);
  font-size: 0.85rem;
  margin-top: 0.3rem;
  padding-left: 1rem;
}

/* Иконка слева */
.input-wrapper.with-icon .form-control {
  padding-left: calc(var(--input-padding-x) + 1.8rem);
}
.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 1.2rem;
  pointer-events: none;
  z-index: 2;
}

/* Иконка справа (например, кнопка показа пароля) */
.input-wrapper.with-right-icon .form-control {
  padding-right: calc(var(--input-padding-x) + 1.8rem);
}
.right-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
}
.right-icon button {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}
.right-icon button:hover {
  color: var(--text-color);
}
</style>