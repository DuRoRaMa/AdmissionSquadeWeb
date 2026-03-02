<template>
  <div class="container mt-5" style="max-width: 400px">
    <div class="text-center mb-4">
      <h4 class="mt-2">ССервО "СОПКа"</h4>
    </div>

    <Transition name="card">
      <AppCard>
        <template #header>
          <h3 class="text-center mb-0">Регистрация</h3>
        </template>

        <form @submit.prevent="handleSubmit">
          <AppInput
            v-model="username"
            label="Имя пользователя"
            type="text"
            placeholder="Username"
            icon="person"
            required
            :error="errors.username"
            hint="Придумайте уникальное имя"
          />

          <AppInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="your@email.com"
            icon="envelope"
            required
            :error="errors.email"
            hint="Используйте корпаративную почту для регистрации"
          />

          <AppInput
            v-model="last_name"
            label="Фамилия"
            type="text"
            placeholder="Иванов"
            icon="person-badge"
            required
            :error="errors.last_name"
          />

          <AppInput
            v-model="first_name"
            label="Имя"
            type="text"
            placeholder="Иван"
            icon="person"
            required
            :error="errors.first_name"
          />

          <AppInput
            v-model="middle_name"
            label="Отчество"
            type="text"
            placeholder="Иванович"
            icon="person"
            :error="errors.middle_name"
          />

          <AppInput
            v-model="password"
            label="Пароль"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="Введите пароль"
            icon="lock"
            required
            :error="errors.password"
            :hint="passwordHint"
          >
            <template #right-icon>
              <button type="button" class="password-toggle" @click="passwordVisible = !passwordVisible">
                <i :class="passwordVisible ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </template>
          </AppInput>

          <div v-if="passwordStrength" class="password-strength mb-2">
            <div class="strength-bar" :class="strengthClass" :style="{ width: strengthPercent + '%' }"></div>
            <span class="strength-text">{{ strengthText }}</span>
          </div>

          <AppInput
            v-model="conf_password"
            label="Подтверждение пароля"
            :type="confPasswordVisible ? 'text' : 'password'"
            placeholder="Введите пароль ещё раз"
            icon="lock"
            required
            :error="errors.conf_password"
            hint="Пароли должны совпадать"
          >
            <template #right-icon>
              <button type="button" class="password-toggle" @click="confPasswordVisible = !confPasswordVisible">
                <i :class="confPasswordVisible ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </template>
          </AppInput>

          <AppButton type="submit" variant="primary" :loading="authStore.isLoading" class="w-100">
            Зарегистрироваться
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
            <span style="color: var(--text-muted); font-size: 0.9rem;">Есть аккаунт? </span>
            <router-link to="/login" class="login-link">Войти</router-link>
          </p>
        </template>
      </AppCard>
    </Transition>
    <div class="footer-links text-center mt-4">
      <router-link to="/privacy" class="footer-link">Политика конфиденциальности</router-link>
      <span class="separator">•</span>
      <router-link to="/terms" class="footer-link">Условия использования</router-link>
    </div>
  </div>
            
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import AppCard from '@/components/AppCard.vue'
import AppAlert from '@/components/AppAlert.vue'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const last_name = ref('')
const first_name = ref('')
const middle_name = ref('')
const password = ref('')
const conf_password = ref('')
const passwordVisible = ref(false)
const confPasswordVisible = ref(false)
const errors = ref({})
const errorMessage = ref('')

async function handleSubmit() {
  errors.value = {}
  errorMessage.value = ''

  // Проверка совпадения паролей
  if (conf_password.value !== password.value) {
    errors.value.password = 'Пароли не совпадают'
    errors.value.conf_password = 'Пароли не совпадают'
    return
  }

  // Проверка обязательных полей
  if (!username.value) errors.value.username = 'Имя пользователя обязательно'
  if (!email.value) errors.value.email = 'Email обязателен'
  if (!password.value) errors.value.password = 'Пароль обязателен'
  if (!last_name.value) errors.value.last_name = 'Фамилия обязательна'
  if (!first_name.value) errors.value.first_name = 'Имя обязательно'

  if (Object.keys(errors.value).length) return

  const UserData = {
    email: email.value,
    password: password.value,
    username: username.value,
    last_name: last_name.value,
    first_name: first_name.value,
    middle_name: middle_name.value,
    conf_password: conf_password.value,
  }
  const result = await authStore.register(UserData)
  if (result.success) {
    router.push({ name: 'login' })
  } else {
    errorMessage.value = result.message || 'Ошибка регистрации'
  }
}
</script>

<style scoped>
/* Анимация появления карточки */
.card-enter-active,
.card-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Кнопка показа пароля (можно перенести в глобальные стили) */
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
.password-toggle:hover {
  color: var(--text-color);
}

/* Индикатор сложности пароля */
.password-strength {
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.strength-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--accent-gradient);
  transition: width 0.2s;
}
.strength-bar.weak {
  background: #f56565;
}
.strength-bar.medium {
  background: #fbbf24;
}
.strength-bar.good {
  background: #48bb78;
}
.strength-bar.strong {
  background: var(--accent-gradient);
}
.strength-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  min-width: 60px;
}

/* Ссылки в футере */
/* Стили для футерных ссылок внизу страницы */
.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.footer-link {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: var(--text-color);
  text-decoration: underline;
}

.separator {
  color: var(--text-muted);
  font-size: 0.9rem;
}
.login-link {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  margin-left: 0.25rem;
}
.login-link:hover {
  text-decoration: underline;
}
</style>