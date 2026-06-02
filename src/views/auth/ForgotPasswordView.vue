<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Восстановление пароля</h1>

      <p class="auth-subtitle">
        Введите email, указанный при регистрации. Мы отправим ссылку для смены пароля.
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

      <form class="auth-form" @submit.prevent="handleSubmit">
        <AppInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="example@students.dvfu.ru"
          icon="mail"
          :error="emailError"
        />

        <AppButton
          type="submit"
          variant="primary"
          :loading="authStore.isLoading"
          block
        >
          Отправить ссылку
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
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import useAuthStore from '@/stores/auth'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const authStore = useAuthStore()

const email = ref('')
const emailError = ref('')
const message = ref('')
const isSuccess = ref(false)

function validateEmail() {
  emailError.value = ''

  if (!email.value.trim()) {
    emailError.value = 'Введите email'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email.value)) {
    emailError.value = 'Введите корректный email'
    return false
  }

  return true
}

async function handleSubmit() {
  message.value = ''
  isSuccess.value = false

  if (!validateEmail()) return

  const result = await authStore.forgotPassword(email.value.trim())

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
