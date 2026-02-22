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
const last_name = ref('')
const first_name = ref('')
const middle_name = ref('')
const password = ref('')
const conf_password = ref('')
const username = ref('')
const errors = ref({})
const errorMessage = ref('')

async function handleSubmit() {
  errors.value = {}
  errorMessage.value = ''
  if (conf_password.value != password.value)
    return (
      (errors.value.password = 'Пароли не совпадают'),
      (errors.value.conf_password = 'Пароли не совпадают')
    )
  if (!email.value) errors.value.email = 'Email обязателен'
  if (!password.value) errors.value.password = 'Пароль обязателен'
  if (Object.keys(errors.value).length) return
  const UserData = {
    email: email.value,
    password: password.value,
    username: username.value,
    last_name: last_name.value,
    first_name: first_name.value,
    middle_name: middle_name.value,
  }
  const result = await authStore.register(UserData)
  if (result.success) {
    router.push({ name: 'home' })
  } else {
    errorMessage.value = result.message || 'Ошибка входа'
  }
}
</script>
<template>
  <div class="container mt-5 align-middle" style="max-width: 400px">
    <AppCard>
      <template #header>
        <h3 class="text-center mb-0">Регистрация</h3>
      </template>
      <form @submit.prevent="handleSubmit">
        <app-input
          v-model="username"
          label="Имя пользователя"
          type="text"
          placeholder="Username"
          required
          :error="errors.username"
        />
        <app-input
          v-model="email"
          label="email"
          type="email"
          placeholder="your@email.com"
          required
          :error="errors.email"
        />
        <app-input
          v-model="last_name"
          label="Фамилия"
          type="text"
          placeholder="Иванов"
          required
          :error="errors.last_name"
        />
        <app-input
          v-model="first_name"
          label="Имя"
          type="text"
          placeholder="Иван"
          required
          :error="errors.first_name"
        />
        <app-input
          v-model="middle_name"
          label="Отчество"
          type="text"
          placeholder="Иванович"
          :error="errors.middle_name"
        />

        <app-input
          v-model="password"
          label="Пароль"
          type="password"
          placeholder="Введите пароль"
          required
          :error="errors.password"
        />
        <app-input
          v-model="conf_password"
          label="Подтверждение пароля"
          type="password"
          placeholder="Введите пароль"
          required
          :error="errors.conf_password"
        />
        <app-button type="submit" variant="primary" :loading="authStore.isLoading" class="w-100">
          Зарегистрироваться
        </app-button>
        <app-alert
          v-if="errorMessage"
          variant="danger"
          class="mt-3"
          dismissible
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </app-alert>
      </form>
      <template #footer>
        <p>Есть аккаунт? <router-link to="/login">Войти</router-link></p>
      </template>
    </AppCard>
  </div>
</template>
