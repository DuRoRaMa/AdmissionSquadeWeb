<template>
  <div class="container mt-5 align-middle" style="max-width: 400px">
    <AppCard>
      <template #header>
        <h3 class="text-center mb-0">Вход в аккаунт</h3>
      </template>

      <form @submit.prevent="handleSubmit">
        <AppInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          required
          :error="errors.email"
        />

        <AppInput
          v-model="password"
          label="Пароль"
          type="password"
          placeholder="••••••"
          required
          :error="errors.password"
        />

        <div class="d-flex justify-content-between align-items-center mb-3">
          <router-link to="/forgot-password" class="text-decoration-none"
            >Забыли пароль?</router-link
          >
        </div>

        <AppButton type="submit" variant="primary" :loading="authStore.isLoading" class="w-100">
          Войти
        </AppButton>

        <AppAlert
          v-if="errorMessage"
          variant="danger"
          class="mt-3"
          dismissible
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </AppAlert>
      </form>

      <template #footer>
        <p class="text-center mb-0">
          Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link>
        </p>
      </template>
    </AppCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import AppCard from '@/components/AppCard.vue'
import AppAlert from '@/components/AppAlert.vue'

const authStore = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const errors = ref({})
const errorMessage = ref('')

async function handleSubmit() {
  errors.value = {}
  errorMessage.value = ''

  if (!email.value) errors.value.email = 'Email обязателен'
  if (!password.value) errors.value.password = 'Пароль обязателен'
  if (Object.keys(errors.value).length) return

  const result = await authStore.login({ email: email.value, password: password.value })
  if (result.success) {
    router.push({ name: 'home' })
  } else {
    errorMessage.value = result.message || 'Ошибка входа'
  }
}
</script>
