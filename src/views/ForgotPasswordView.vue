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
const errors = ref({})
const errorMessage = ref('')

async function handleSubmit() {
  errors.value = {}
  errorMessage.value = ''

  if (!email.value) errors.value.email = 'Email обязателен'
  if (Object.keys(errors.value).length) return

  const result = await authStore.forgotPassword({ email: email.value })
  if (result.success) {
    router.push({ name: 'reset-password' })
  } else {
    errorMessage.value = result.message || 'Ошибка входа'
  }
}
</script>

<template>
  <div class="container mt-5 align-middle" style="max-width: 400px">
    <AppCard>
      <template #header>
        <h2 class="text-center mb-0">Забыли пароль?</h2>
        <p class="fs-6">Введите Email с которым вы входили в последний раз</p>
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
        <AppButton type="submit" variant="primary" :loading="authStore.isLoading" class="w-100">
          Продолжить
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
    </AppCard>
  </div>
</template>
