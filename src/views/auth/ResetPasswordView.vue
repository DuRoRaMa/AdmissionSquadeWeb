<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Новый пароль</h1>

      <p class="auth-subtitle">
        Придумайте новый пароль для входа в систему.
      </p>

      <AppAlert
        v-if="message"
        :variant="isSuccess ? 'success' : 'error'"
        class="mb-3"
        dismissible
        @close="message = ''"
      >
        {{ message }}
      </AppAlert>

      <AppAlert
        v-if="!hasResetParams"
        variant="error"
        class="mb-3"
      >
        Ссылка для восстановления пароля некорректна.
      </AppAlert>

      <form
        v-if="hasResetParams && !isSuccess"
        class="auth-form"
        @submit.prevent="handleSubmit"
      >
        <AppInput
          v-model="password"
          label="Новый пароль"
          type="password"
          placeholder="Введите новый пароль"
          icon="lock"
          :error="passwordError"
        />

        <AppInput
          v-model="confPassword"
          label="Повторите пароль"
          type="password"
          placeholder="Повторите новый пароль"
          icon="lock"
          :error="confPasswordError"
        />

        <AppButton
          type="submit"
          variant="primary"
          :loading="authStore.isLoading"
          block
        >
          Сменить пароль
        </AppButton>
      </form>

      <div class="auth-links">
        <RouterLink :to="{ name: 'login' }">
          Вернуться ко входу
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import useAuthStore from '@/stores/auth'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const route = useRoute()
const authStore = useAuthStore()

const password = ref('')
const confPassword = ref('')

const passwordError = ref('')
const confPasswordError = ref('')

const message = ref('')
const isSuccess = ref(false)

const uid = computed(() => route.query.uid || '')
const token = computed(() => route.query.token || '')

const hasResetParams = computed(() => Boolean(uid.value && token.value))

function validateForm() {
  passwordError.value = ''
  confPasswordError.value = ''

  let isValid = true

  if (!password.value) {
    passwordError.value = 'Введите новый пароль'
    isValid = false
  } else if (password.value.length < 8) {
    passwordError.value = 'Пароль должен содержать не менее 8 символов'
    isValid = false
  }

  if (!confPassword.value) {
    confPasswordError.value = 'Повторите пароль'
    isValid = false
  } else if (password.value !== confPassword.value) {
    confPasswordError.value = 'Пароли не совпадают'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  message.value = ''
  isSuccess.value = false

  if (!validateForm()) return

  const result = await authStore.resetPassword({
    uid: uid.value,
    token: token.value,
    password: password.value,
    conf_password: confPassword.value,
  })

  message.value = result.message
  isSuccess.value = result.success
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background: var(--card-bg-solid);
  border: 1px solid var(--card-border);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.auth-title {
  margin: 0 0 0.5rem;
  color: var(--text-color);
  font-size: 1.5rem;
}

.auth-subtitle {
  margin: 0 0 1.25rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.auth-form {
  display: grid;
  gap: 1rem;
}

.auth-links {
  margin-top: 1rem;
  text-align: center;
}

.auth-links a {
  color: var(--primary-color);
  text-decoration: none;
}

.auth-links a:hover {
  text-decoration: underline;
}

.mb-3 {
  margin-bottom: 1rem;
}
</style>
