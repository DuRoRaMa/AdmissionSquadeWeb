<script setup>
import { computed, onMounted } from 'vue'

import AppCard from '@/components/ui/AppCard.vue'
import UserQrCard from '@/components/users/UserQrCard.vue'

import useAuthStore from '@/stores/auth'
import useUserStore from '@/stores/user'
import { useScheduleStore } from '@/stores/schedule'
import { useAvailabilityStore } from '@/stores/availability'

const authStore = useAuthStore()
const userStore = useUserStore()
const scheduleStore = useScheduleStore()
const availabilityStore = useAvailabilityStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const nearestEntry = computed(() => scheduleStore.nearestEntry)
const activeForm = computed(() => availabilityStore.activeForm)

const displayName = computed(() => {
  const user = userStore.user

  return (
    user?.first_name ||
    user?.full_name ||
    user?.email ||
    'участник'
  )
})

const nearestShiftDate = computed(() => formatDate(nearestEntry.value?.date))
const nearestShiftWeekday = computed(() => formatWeekday(nearestEntry.value?.date))
const nearestShiftTime = computed(() => {
  const entry = nearestEntry.value

  if (!entry?.starts_at || !entry?.ends_at) {
    return 'Время не указано'
  }

  return `${formatTime(entry.starts_at)} — ${formatTime(entry.ends_at)}`
})

const nearestShiftBlock = computed(() => {
  const entry = nearestEntry.value

  return (
    entry?.work_block_name ||
    entry?.work_block?.name ||
    entry?.work_block_code ||
    entry?.work_block?.code ||
    'Блок работы не указан'
  )
})

const nearestShiftStatus = computed(() => {
  const entry = nearestEntry.value

  return (
    entry?.attendance_status_label ||
    entry?.status_label ||
    getScheduleStatusLabel(entry?.status || entry?.attendance_status)
  )
})

const activeFormPeriod = computed(() => {
  const form = activeForm.value

  if (!form?.period_start || !form?.period_end) {
    return 'Период не указан'
  }

  return `${formatDate(form.period_start)} — ${formatDate(form.period_end)}`
})

const activeFormDeadline = computed(() => {
  const form = activeForm.value
  const deadline =
    form?.deadline_at ||
    form?.deadline ||
    form?.available_until ||
    form?.closed_at

  if (!deadline) {
    return ''
  }

  return formatDateTime(deadline)
})

const activeFormStatus = computed(() => {
  if (!activeForm.value) {
    return 'Нет активной формы'
  }

  if (activeForm.value.is_submitted) {
    return 'Ответ отправлен'
  }

  return 'Ожидает заполнения'
})

const activeFormActionText = computed(() => {
  if (!activeForm.value) {
    return 'Перейти к доступности'
  }

  return activeForm.value.is_submitted
    ? 'Посмотреть ответ'
    : 'Заполнить форму'
})

const quickLinks = computed(() => [
  {
    title: 'Мой график',
    text: 'Посмотреть назначенные смены и отправить заявку на изменение.',
    icon: 'bi bi-calendar-week',
    to: '/schedule',
  },
  {
    title: 'Моя доступность',
    text: 'Заполнить или проверить ответ на активную форму доступности.',
    icon: 'bi bi-check2-square',
    to: '/availability',
  },
  {
    title: 'Мои отряды',
    text: 'Посмотреть отряды, роли и основную информацию по участию.',
    icon: 'bi bi-people',
    to: '/my-squads',
  },
])

const squadCards = [
  {
    title: 'Отряды',
    text: 'Участники работают в составе отрядов, получают роли, графики и видят свои зоны ответственности в одном интерфейсе.',
  },
  {
    title: 'Командиры',
    text: 'Командиры формируют формы доступности, составляют графики, обрабатывают заявки и контролируют работу участников.',
  },
  {
    title: 'Администрирование',
    text: 'Администратор управляет пользователями, ролями, доступами и общей структурой системы.',
  },
]

const featureCards = [
  {
    title: 'Единое рабочее пространство',
    text: 'Профиль, доступность, график, заявки и QR-отметка находятся в одном приложении.',
  },
  {
    title: 'Прозрачный процесс',
    text: 'Пользователь видит свои смены и статусы, а руководитель получает инструменты контроля и планирования.',
  },
  {
    title: 'Снижение ручной нагрузки',
    text: 'Система уменьшает число переписок, таблиц и несогласованностей при организации работы.',
  },
]

onMounted(async () => {
  if (!authStore.isAuthenticated) return

  await Promise.all([
    userStore.fetchUser(),
    scheduleStore.fetchMySchedule(),
    availabilityStore.fetchActiveForm(),
  ])
})

function formatDate(value) {
  if (!value) return ''

  const date = createDate(value)

  if (!date) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatWeekday(value) {
  if (!value) return ''

  const date = createDate(value)

  if (!date) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
  }).format(date)
}

function formatDateTime(value) {
  if (!value) return ''

  const date = createDate(value)

  if (!date) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatTime(value) {
  if (!value) return ''

  return String(value).slice(0, 5)
}

function createDate(value) {
  if (!value) return null

  const normalized = String(value).includes('T')
    ? value
    : `${value}T00:00:00`

  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function getScheduleStatusLabel(status) {
  const labels = {
    planned: 'Запланировано',
    active: 'Активно',
    completed: 'Завершено',
    attended: 'Посетил',
    visited: 'Посетил',
    missed: 'Не посетил',
    absent: 'Не посетил',
    cancelled: 'Отменено',
  }

  return labels[status] || 'Запланировано'
}
</script>

<template>
  <div v-if="!isAuthenticated" class="home-landing">
    <section class="landing-hero">
      <div class="landing-hero__content">
        <span class="landing-badge">Система управления отрядами</span>

        <h1 class="landing-title">
          Платформа для организации работы, доступности, графиков и отметки участников
        </h1>

        <p class="landing-text">
          Приложение объединяет участников, командиров и администраторов в одной системе:
          от заполнения доступности до назначения смен и отметки по QR-коду.
        </p>

        <div class="landing-actions">
          <router-link to="/login" class="landing-btn landing-btn--ghost">
            Войти
          </router-link>

          <router-link to="/register" class="landing-btn landing-btn--primary">
            Зарегистрироваться
          </router-link>
        </div>
      </div>
    </section>

    <section class="landing-section">
      <h2 class="landing-section__title">Как устроена работа в системе</h2>

      <div class="landing-grid landing-grid--three">
        <AppCard v-for="item in squadCards" :key="item.title">
          <template #header>{{ item.title }}</template>
          <p class="landing-card-text">{{ item.text }}</p>
        </AppCard>
      </div>
    </section>

    <section class="landing-section">
      <h2 class="landing-section__title">Возможности приложения</h2>

      <div class="landing-grid landing-grid--three">
        <AppCard v-for="item in featureCards" :key="item.title">
          <template #header>{{ item.title }}</template>
          <p class="landing-card-text">{{ item.text }}</p>
        </AppCard>
      </div>
    </section>
  </div>

  <div v-else class="home-dashboard">
    <section class="dashboard-hero">
      <div>
        <span class="dashboard-hero__badge">Главная</span>

        <h1 class="dashboard-hero__title">
          Добрый день, {{ displayName }}
        </h1>

        <p class="dashboard-hero__text">
          Здесь собрана ближайшая смена, активная форма доступности и быстрые действия.
        </p>
      </div>
    </section>

    <section class="dashboard-main-grid">
      <article class="summary-card summary-card--shift">
        <div class="summary-card__top">
          <div>
            <span class="summary-card__eyebrow">Ближайшая смена</span>
            <h2 class="summary-card__title">
              {{ nearestEntry ? nearestShiftDate : 'Смен пока нет' }}
            </h2>
          </div>

          <div class="summary-card__icon">
            <i class="bi bi-calendar-check" />
          </div>
        </div>

        <template v-if="nearestEntry">
          <p class="summary-card__subtitle">
            {{ nearestShiftWeekday }}
          </p>

          <div class="summary-card__details">
            <div class="summary-card__detail">
              <span>Время</span>
              <strong>{{ nearestShiftTime }}</strong>
            </div>

            <div class="summary-card__detail">
              <span>Блок работы</span>
              <strong>{{ nearestShiftBlock }}</strong>
            </div>

            <div class="summary-card__detail">
              <span>Статус</span>
              <strong>{{ nearestShiftStatus }}</strong>
            </div>
          </div>

          <router-link to="/schedule" class="dashboard-action dashboard-action--light">
            Перейти в мой график
            <i class="bi bi-arrow-right" />
          </router-link>
        </template>

        <template v-else>
          <p class="summary-card__empty">
            После публикации графика здесь появится ваша ближайшая назначенная смена.
          </p>

          <router-link to="/schedule" class="dashboard-action dashboard-action--light">
            Открыть мой график
            <i class="bi bi-arrow-right" />
          </router-link>
        </template>
      </article>

      <article class="summary-card summary-card--availability">
        <div class="summary-card__top">
          <div>
            <span class="summary-card__eyebrow">Форма доступности</span>
            <h2 class="summary-card__title">
              {{ activeForm?.title || 'Нет активной формы' }}
            </h2>
          </div>

          <div class="summary-card__icon">
            <i class="bi bi-check2-square" />
          </div>
        </div>

        <template v-if="activeForm">
          <div class="summary-card__details">
            <div class="summary-card__detail">
              <span>Период</span>
              <strong>{{ activeFormPeriod }}</strong>
            </div>

            <div v-if="activeFormDeadline" class="summary-card__detail">
              <span>Дедлайн</span>
              <strong>{{ activeFormDeadline }}</strong>
            </div>

            <div class="summary-card__detail">
              <span>Статус</span>
              <strong>{{ activeFormStatus }}</strong>
            </div>
          </div>

          <router-link to="/availability" class="dashboard-action dashboard-action--light">
            {{ activeFormActionText }}
            <i class="bi bi-arrow-right" />
          </router-link>
        </template>

        <template v-else>
          <p class="summary-card__empty">
            Когда командир откроет форму доступности, она появится в этом блоке.
          </p>

          <router-link to="/availability" class="dashboard-action dashboard-action--light">
            Открыть раздел доступности
            <i class="bi bi-arrow-right" />
          </router-link>
        </template>
      </article>
    </section>

    <section class="dashboard-secondary-grid">
      <UserQrCard
        :entry-id="nearestEntry?.id || null"
        title="QR для отметки"
        subtitle="Быстрый доступ к коду для ближайшей смены"
      />

      <AppCard class="quick-links-card">
        <template #header>Быстрые действия</template>

        <div class="quick-links">
          <router-link
            v-for="item in quickLinks"
            :key="item.to"
            :to="item.to"
            class="quick-link"
          >
            <span class="quick-link__icon">
              <i :class="item.icon" />
            </span>

            <span class="quick-link__content">
              <strong>{{ item.title }}</strong>
              <small>{{ item.text }}</small>
            </span>

            <i class="bi bi-chevron-right quick-link__arrow" />
          </router-link>
        </div>
      </AppCard>
    </section>
  </div>
</template>

<style scoped>
.home-dashboard,
.home-landing {
  width: 100%;
}

.dashboard-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
  padding: 30px 34px;
  border: var(--card-border);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(102, 126, 234, 0.2), transparent 30%),
    radial-gradient(circle at bottom left, rgba(118, 75, 162, 0.16), transparent 34%),
    var(--card-bg-solid);
  box-shadow: var(--card-shadow);
}

.dashboard-hero::after {
  content: '';
  position: absolute;
  right: -80px;
  bottom: -100px;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.09);
  filter: blur(18px);
  pointer-events: none;
}

.dashboard-hero__badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 13px;
  border: 1px solid rgba(127, 127, 127, 0.14);
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.08);
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: 800;
}

.dashboard-hero__title {
  position: relative;
  z-index: 1;
  margin: 0;
  color: var(--text-color);
  font-size: clamp(1.8rem, 3vw, 2.7rem);
  line-height: 1.1;
}

.dashboard-hero__text {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 12px 0 0;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.6;
}

.dashboard-main-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.dashboard-secondary-grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 24px;
  align-items: stretch;
}

.summary-card {
  position: relative;
  overflow: hidden;
  min-height: 330px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border: var(--card-border);
  border-radius: 26px;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.summary-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(102, 126, 234, 0.14), transparent 32%),
    radial-gradient(circle at bottom left, rgba(118, 75, 162, 0.1), transparent 36%);
  pointer-events: none;
}

.summary-card > * {
  position: relative;
  z-index: 1;
}

.summary-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.summary-card__eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-card__title {
  margin: 0;
  color: var(--text-color);
  font-size: clamp(1.35rem, 2.2vw, 2rem);
  line-height: 1.15;
}

.summary-card__subtitle {
  margin: -6px 0 18px;
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 700;
  text-transform: capitalize;
}

.summary-card__icon {
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 14px 28px rgba(102, 126, 234, 0.24);
  font-size: 1.35rem;
}

.summary-card__details {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card__detail {
  display: grid;
  gap: 4px;
  padding: 13px 14px;
  border: 1px solid rgba(127, 127, 127, 0.12);
  border-radius: 16px;
  background: rgba(127, 127, 127, 0.06);
}

.summary-card__detail span {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.summary-card__detail strong {
  color: var(--text-color);
  font-size: 0.98rem;
  font-weight: 850;
}

.summary-card__empty {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.dashboard-action {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding: 12px 16px;
  border-radius: 999px;
  font-weight: 800;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.dashboard-action:hover {
  transform: translateY(-1px);
}

.dashboard-action--light {
  color: var(--text-color);
  background: rgba(127, 127, 127, 0.1);
  border: 1px solid rgba(127, 127, 127, 0.14);
}

.dashboard-action--light:hover {
  background: rgba(127, 127, 127, 0.15);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.quick-links-card {
  height: 100%;
}

.quick-links {
  display: grid;
  gap: 12px;
}

.quick-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(127, 127, 127, 0.12);
  border-radius: 18px;
  background: rgba(127, 127, 127, 0.06);
  color: var(--text-color);
  text-decoration: none;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.quick-link:hover {
  transform: translateY(-1px);
  background: rgba(127, 127, 127, 0.1);
  border-color: rgba(127, 127, 127, 0.2);
}

.quick-link__icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--accent-gradient);
  color: #fff;
  font-size: 1.05rem;
}

.quick-link__content {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.quick-link__content strong {
  color: var(--text-color);
  font-size: 0.98rem;
}

.quick-link__content small {
  color: var(--text-muted);
  line-height: 1.4;
}

.quick-link__arrow {
  color: var(--text-muted);
}

/* =========================
   Landing
   ========================= */

.dashboard-grid,
.landing-grid {
  display: grid;
  gap: 24px;
}

.landing-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.landing-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 28px;
  padding: 48px 52px;
  border: var(--card-border);
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(102, 126, 234, 0.18), transparent 28%),
    radial-gradient(circle at bottom left, rgba(118, 75, 162, 0.18), transparent 34%),
    var(--card-bg-solid);
  box-shadow: var(--card-shadow);
}

.landing-hero::after {
  content: '';
  position: absolute;
  inset: auto -80px -80px auto;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.08);
  filter: blur(20px);
  pointer-events: none;
}

.landing-hero__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
}

.landing-badge {
  display: inline-flex;
  align-items: center;
  margin-bottom: 18px;
  padding: 9px 15px;
  border: 1px solid rgba(127, 127, 127, 0.12);
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.08);
  color: var(--text-color);
  font-size: 0.88rem;
  font-weight: 700;
}

.landing-title {
  width: 100%;
  max-width: none;
  margin: 0 0 18px;
  color: var(--text-color);
  font-size: clamp(2.2rem, 4vw, 3.5rem);
  line-height: 1.08;
}

.landing-text {
  width: 100%;
  max-width: none;
  margin: 0 0 28px;
  color: var(--text-muted);
  font-size: 1.05rem;
  line-height: 1.75;
}

.landing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.landing-btn {
  padding: 14px 20px;
  border-radius: 16px;
  font-weight: 800;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.landing-btn--ghost {
  color: var(--text-color);
  background: rgba(127, 127, 127, 0.08);
  border: 1px solid rgba(127, 127, 127, 0.14);
}

.landing-btn--ghost:hover {
  transform: translateY(-2px);
  background: rgba(127, 127, 127, 0.14);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.landing-btn--primary {
  color: #fff;
  background: var(--accent-gradient);
  box-shadow: 0 14px 30px rgba(102, 126, 234, 0.24);
}

.landing-btn--primary:hover {
  transform: translateY(-2px);
  opacity: 0.97;
  box-shadow: 0 18px 36px rgba(102, 126, 234, 0.32);
}

.landing-section {
  margin-top: 28px;
}

.landing-section__title {
  margin: 0 0 18px;
  color: var(--text-color);
  font-size: 1.45rem;
  font-weight: 800;
}

.landing-card-text {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.7;
}

:deep(.card),
:deep(.app-card) {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

:deep(.card:hover),
:deep(.app-card:hover) {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

@media (max-width: 1100px) {
  .dashboard-main-grid,
  .dashboard-secondary-grid,
  .landing-grid--three {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-hero,
  .landing-hero {
    padding: 24px;
    border-radius: 24px;
  }

  .summary-card {
    min-height: auto;
  }

  .summary-card__top {
    align-items: flex-start;
  }

  .summary-card__icon {
    width: 48px;
    height: 48px;
    flex-basis: 48px;
    border-radius: 16px;
  }
}

@media (max-width: 576px) {
  .landing-actions {
    flex-direction: column;
  }

  .landing-btn,
  .dashboard-action {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .quick-link {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .quick-link__arrow {
    display: none;
  }
}
</style>