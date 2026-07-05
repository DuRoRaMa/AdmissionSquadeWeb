<template>
  <div class="container mt-5" style="max-width: 400px">
    <div class="text-center mb-4">
      <h4 class="mt-2">ССервО «СОПКа»</h4>
    </div>

    <Transition name="card">
      <AppCard>
        <template #header>
          <h3 class="text-center mb-0">Регистрация</h3>
        </template>

        <form novalidate @submit.prevent="handleSubmit">
          <AppInput
            v-model="username"
            label="Имя пользователя"
            type="text"
            placeholder="Username"
            icon="person"
            autocomplete="username"
            required
            :error="errors.username"
            hint="Придумайте уникальное имя"
            @update:model-value="clearFieldError('username')"
          />

          <AppInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="name@dvfu.ru"
            icon="envelope"
            autocomplete="email"
            required
            :error="errors.email"
            hint="Используйте корпоративную почту ДВФУ"
            @update:model-value="clearFieldError('email')"
          />

          <AppInput
            v-model="last_name"
            label="Фамилия"
            type="text"
            placeholder="Иванов"
            icon="person-badge"
            autocomplete="family-name"
            required
            :error="errors.last_name"
            @update:model-value="clearFieldError('last_name')"
          />

          <AppInput
            v-model="first_name"
            label="Имя"
            type="text"
            placeholder="Иван"
            icon="person"
            autocomplete="given-name"
            required
            :error="errors.first_name"
            @update:model-value="clearFieldError('first_name')"
          />

          <AppInput
            v-model="middle_name"
            label="Отчество"
            type="text"
            placeholder="Иванович"
            icon="person"
            autocomplete="additional-name"
            :error="errors.middle_name"
            @update:model-value="clearFieldError('middle_name')"
          />

          <AppInput
            v-model="password"
            label="Пароль"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="Введите пароль"
            icon="lock"
            autocomplete="new-password"
            required
            :error="errors.password"
            :hint="passwordHint"
            @update:model-value="handlePasswordInput"
          >
            <template #right-icon>
              <button
                type="button"
                class="password-toggle"
                :aria-label="passwordVisible ? 'Скрыть пароль' : 'Показать пароль'"
                @click="passwordVisible = !passwordVisible"
              >
                <i :class="passwordVisible ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </template>
          </AppInput>

          <div v-if="passwordStrength" class="password-strength mb-2">
            <div
              class="strength-bar"
              :class="strengthClass"
              :style="{ width: `${strengthPercent}%` }"
            ></div>
            <span class="strength-text">{{ strengthText }}</span>
          </div>

          <AppInput
            v-model="conf_password"
            label="Подтверждение пароля"
            :type="confPasswordVisible ? 'text' : 'password'"
            placeholder="Введите пароль ещё раз"
            icon="lock"
            autocomplete="new-password"
            required
            :error="errors.conf_password"
            hint="Пароли должны совпадать"
            @update:model-value="handleConfirmPasswordInput"
          >
            <template #right-icon>
              <button
                type="button"
                class="password-toggle"
                :aria-label="confPasswordVisible ? 'Скрыть подтверждение пароля' : 'Показать подтверждение пароля'"
                @click="confPasswordVisible = !confPasswordVisible"
              >
                <i :class="confPasswordVisible ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </template>
          </AppInput>

          <AppButton
            type="submit"
            variant="primary"
            :loading="authStore.isLoading"
            class="w-100"
          >
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
            <span style="color: var(--text-muted); font-size: 0.9rem">Есть аккаунт? </span>
            <router-link to="/login" class="login-link">Войти</router-link>
          </p>
        </template>
      </AppCard>
    </Transition>

    <ConfirmModal
      ref="emailCodeModal"
      :confirm-disabled="!canConfirmEmailCode"
      :loading="authStore.isLoading"
      loading-text="Проверка..."
    >
      <div class="email-confirmation">
        <AppInput
          v-model="emailCode"
          label="Код подтверждения"
          type="text"
          inputmode="numeric"
          maxlength="6"
          autocomplete="one-time-code"
          placeholder="Введите 6 цифр из письма"
          icon="shield-check"
          :error="emailCodeError"
          hint="Код отправлен на указанную почту"
          @update:model-value="handleEmailCodeInput"
        />

        <AppAlert
          v-if="emailCodeInfo"
          variant="info"
          class="mt-2"
          dismissible
          @close="emailCodeInfo = ''"
        >
          {{ emailCodeInfo }}
        </AppAlert>

        <button
          type="button"
          class="resend-code-button mt-2"
          :disabled="authStore.isLoading"
          @click="resendEmailCode"
        >
          Отправить код повторно
        </button>
      </div>
    </ConfirmModal>

    <div class="footer-links text-center mt-4">
      <router-link to="/privacy" class="footer-link">Политика конфиденциальности</router-link>
      <span class="separator">•</span>
      <router-link to="/terms" class="footer-link">Условия использования</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

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

const emailCodeModal = ref(null)
const emailCode = ref('')
const emailCodeError = ref('')
const emailCodeInfo = ref('')

const passwordHint =
  'Не менее 8 символов. Не используйте слишком простой пароль или только цифры.'

const passwordStrength = computed(() => {
  const value = password.value

  if (!value) {
    return 0
  }

  let score = 0

  if (value.length >= 8) score += 1
  if (/[a-zа-яё]/.test(value)) score += 1
  if (/[A-ZА-ЯЁ]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-zА-Яа-яЁё0-9]/.test(value)) score += 1

  return score
})

const strengthPercent = computed(() => passwordStrength.value * 20)

const strengthClass = computed(() => {
  if (passwordStrength.value <= 1) return 'weak'
  if (passwordStrength.value === 2) return 'medium'
  if (passwordStrength.value <= 4) return 'good'
  return 'strong'
})

const strengthText = computed(() => {
  if (passwordStrength.value <= 1) return 'Слабый'
  if (passwordStrength.value === 2) return 'Средний'
  if (passwordStrength.value <= 4) return 'Хороший'
  return 'Надёжный'
})

const canConfirmEmailCode = computed(() => /^\d{6}$/.test(emailCode.value.trim()))

function buildRegistrationData() {
  return {
    username: username.value.trim(),
    email: email.value.trim().toLowerCase(),
    last_name: last_name.value.trim(),
    first_name: first_name.value.trim(),
    middle_name: middle_name.value.trim(),
    password: password.value,
    conf_password: conf_password.value,
  }
}

function buildUserData() {
  return {
    ...buildRegistrationData(),
    email_code: emailCode.value.trim(),
  }
}

function applyFieldErrors(fieldErrors = {}) {
  errors.value = {
    ...errors.value,
    ...fieldErrors,
  }
}

function clearFieldError(fieldName) {
  if (!errors.value[fieldName]) {
    return
  }

  const updatedErrors = { ...errors.value }
  delete updatedErrors[fieldName]
  errors.value = updatedErrors
}

function handlePasswordInput() {
  clearFieldError('password')

  if (errors.value.conf_password && password.value === conf_password.value) {
    clearFieldError('conf_password')
  }
}

function handleConfirmPasswordInput() {
  clearFieldError('conf_password')
}

function handleEmailCodeInput(value) {
  const normalizedValue = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)

  if (emailCode.value !== normalizedValue) {
    emailCode.value = normalizedValue
  }

  emailCodeError.value = ''
}

function validateRegistrationForm() {
  const nextErrors = {}

  if (!username.value.trim()) {
    nextErrors.username = 'Введите имя пользователя'
  }

  if (!email.value.trim()) {
    nextErrors.email = 'Введите электронную почту'
  }

  if (!last_name.value.trim()) {
    nextErrors.last_name = 'Введите фамилию'
  }

  if (!first_name.value.trim()) {
    nextErrors.first_name = 'Введите имя'
  }

  if (!password.value) {
    nextErrors.password = 'Введите пароль'
  }

  if (!conf_password.value) {
    nextErrors.conf_password = 'Подтвердите пароль'
  } else if (password.value !== conf_password.value) {
    nextErrors.conf_password = 'Пароли не совпадают'
  }

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

async function resendEmailCode() {
  emailCodeError.value = ''
  emailCodeInfo.value = ''

  // Повторная отправка идет через тот же endpoint, который сначала
  // проверяет все регистрационные данные, а затем отправляет письмо.
  const result = await authStore.startRegistration(buildRegistrationData())

  if (result.success) {
    emailCodeInfo.value = result.message || 'Код отправлен повторно'
    return
  }

  const fieldErrors = result.errors || {}

  if (Object.keys(fieldErrors).length > 0) {
    applyFieldErrors(fieldErrors)
    emailCodeError.value =
      fieldErrors.email || 'Регистрационные данные изменились. Исправьте ошибки в форме.'
    return
  }

  emailCodeError.value = result.message || 'Не удалось отправить код повторно'
}

async function confirmEmailByCode() {
  emailCode.value = ''
  emailCodeError.value = ''
  emailCodeInfo.value = 'Введите код подтверждения из письма'

  while (true) {
    const confirmed = await emailCodeModal.value.open({
      title: 'Подтверждение почты',
      message: `Мы отправили код на ${email.value}`,
      confirmText: 'Зарегистрироваться',
      cancelText: 'Отмена',
    })

    if (!confirmed) {
      return false
    }

    if (!canConfirmEmailCode.value) {
      emailCodeError.value = 'Введите шестизначный код подтверждения'
      continue
    }

    const result = await authStore.register(buildUserData())

    if (result.success) {
      await router.push({ name: 'login' })
      return true
    }

    const fieldErrors = result.errors || {}

    if (fieldErrors.email_code) {
      emailCodeError.value = fieldErrors.email_code
      continue
    }

    // За время ввода кода регистрационные данные могли стать неактуальными,
    // например имя пользователя мог занять другой пользователь.
    if (Object.keys(fieldErrors).length > 0) {
      applyFieldErrors(fieldErrors)
      return false
    }

    errorMessage.value = result.message || 'Не удалось завершить регистрацию'
    return false
  }
}

async function handleSubmit() {
  errors.value = {}
  errorMessage.value = ''

  if (!validateRegistrationForm()) {
    return
  }

  // Пользователь на этом этапе еще не создается. Сервер только проверяет
  // регистрационные данные и отправляет код, если ошибок нет.
  const result = await authStore.startRegistration(buildRegistrationData())

  if (!result.success) {
    const fieldErrors = result.errors || {}
    applyFieldErrors(fieldErrors)

    // Всплывающее сообщение остается только для общей ошибки сервера
    // или соединения. Ошибки валидации показываются у соответствующих полей.
    if (Object.keys(fieldErrors).length === 0) {
      errorMessage.value = result.message || 'Не удалось проверить регистрационные данные'
    }

    return
  }

  await confirmEmailByCode()
}
</script>

<style scoped>
.card-enter-active,
.card-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

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

.email-confirmation {
  margin-top: 0.75rem;
}

.resend-code-button {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 0;
  cursor: pointer;
}

.resend-code-button:hover {
  color: var(--text-color);
  text-decoration: underline;
}

.resend-code-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
