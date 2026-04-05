<!-- LoginView.vue -->
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
const passwordVisible = ref(false)
const errors = ref({})
const errorMessage = ref('')

async function handleSubmit() {
  errors.value = {}
  errorMessage.value = ''

  if (!email.value) errors.value.email = 'Email обязателен'
  if (!password.value) errors.value.password = 'Пароль обязателен'

  if (Object.keys(errors.value).length) return

  const result = await authStore.login({
    email: email.value,
    password: password.value,
  })

  if (result.success) {
    router.push({ name: 'profile' })
  } else {
    errorMessage.value = result.message || 'Ошибка входа'
  }
}
</script>

<template>
  <div class="container mt-5" style="max-width: 400px">
    <!-- Заголовок страницы (логотип и название) -->
    <div class="text-center mb-4">
      <h4 class="site-title">ССервО "СОПКа"</h4>
    </div>

    <!-- Анимированная карточка с формой входа -->
    <Transition name="fade-slide" appear>
      <AppCard>
        <template #header>
          <h3 class="text-center mb-0">Вход в аккаунт</h3>
        </template>

        <form @submit.prevent="handleSubmit">
          <!-- Поле Email -->
          <AppInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="your@email.com"
            icon="envelope"
            required
            :error="errors.email"
          />

          <!-- Поле Пароль с кнопкой показа/скрытия -->
          <AppInput
            v-model="password"
            label="Пароль"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="••••••"
            icon="lock"
            required
            :error="errors.password"
            autocomplete="new-password"
          >
            <template #right-icon>
              <button
                type="button"
                class="password-toggle"
                @click="passwordVisible = !passwordVisible"
                tabindex="-1"
              >
                <i :class="passwordVisible ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </template>
          </AppInput>

          <!-- Ссылка "Забыли пароль?" -->
          <div class="d-flex justify-content-end mb-3">
            <router-link to="/forgot-password" class="forgot-link">
              Забыли пароль?
            </router-link>
          </div>

          <!-- Кнопка отправки формы -->
          <AppButton type="submit" variant="primary" :loading="authStore.isLoading" class="w-100">
            Войти
          </AppButton>

          <!-- Сообщение об ошибке -->
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

        <!-- Подвал карточки: ссылка на регистрацию -->
        <template #footer>
          <p class="text-center mb-0">
            <span style="color: var(--text-muted);">Нет аккаунта?</span>
            <router-link to="/register" class="register-link">Зарегистрироваться</router-link>
          </p>
        </template>
      </AppCard>
    </Transition>

    <!-- Дополнительные ссылки в футере страницы -->
    <div class="footer-links text-center mt-4">
      <router-link to="/privacy" class="footer-link">Политика конфиденциальности</router-link>
      <span class="separator">•</span>
      <router-link to="/terms" class="footer-link">Условия использования</router-link>
    </div>
  </div>
</template>

<style scoped>
.site-title {
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0.5rem;
}
.forgot-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.forgot-link:hover {
  color: var(--accent-gradient);
  text-decoration: underline;
}
.register-link {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  margin-left: 0.25rem;
}
.register-link:hover { text-decoration: underline; }
.footer-links {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}
/* Кнопка показа пароля (используется в слоте right-icon) */
.password-toggle {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}
.footer-link {
  color: var(--text-muted);
  text-decoration: none;
}
.footer-link:hover { color: var(--text-color); text-decoration: underline; }
.fade-slide-enter-active { transition: all 0.3s ease-out; }
.fade-slide-leave-active { transition: all 0.2s ease-in; }
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
