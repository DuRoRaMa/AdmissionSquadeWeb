<script setup>
import { computed, onMounted } from 'vue'

import AppCard from '@/components/ui/AppCard.vue'
import UserQrCard from '@/components/users/UserQrCard.vue'

import useAuthStore from '@/stores/auth'
import { useScheduleStore } from '@/stores/schedule'
import { useAvailabilityStore } from '@/stores/availability'

const authStore = useAuthStore()
const scheduleStore = useScheduleStore()
const availabilityStore = useAvailabilityStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

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

  await scheduleStore.fetchMySchedule()
  await availabilityStore.fetchActiveForm()
})
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
    <div class="dashboard-grid">
      <AppCard>
        <template #header>Ближайшая смена</template>

        <div v-if="scheduleStore.nearestEntry" class="info-list">
          <div><strong>Дата:</strong> {{ scheduleStore.nearestEntry.date }}</div>

          <div>
            <strong>Время:</strong>
            {{ scheduleStore.nearestEntry.starts_at }} — {{ scheduleStore.nearestEntry.ends_at }}
          </div>

          <div>
            <strong>Блок:</strong>
            {{ scheduleStore.nearestEntry.work_block_code }} — {{ scheduleStore.nearestEntry.work_block_name }}
          </div>

          <div><strong>Статус:</strong> {{ scheduleStore.nearestEntry.status }}</div>
        </div>

        <div v-else class="muted-state">
          У вас пока нет назначенных смен.
        </div>
      </AppCard>

      <UserQrCard
        :entry-id="scheduleStore.nearestEntry?.id || null"
        title="QR для отметки"
        subtitle="Быстрый доступ к коду для ближайшей смены"
      />

      <AppCard>
        <template #header>Форма доступности</template>

        <div v-if="availabilityStore.activeForm" class="info-list">
          <div><strong>Название:</strong> {{ availabilityStore.activeForm.title }}</div>

          <div>
            <strong>Период:</strong>
            {{ availabilityStore.activeForm.period_start }} — {{ availabilityStore.activeForm.period_end }}
          </div>

          <router-link to="/availability" class="action-link">
            Перейти к заполнению
          </router-link>
        </div>

        <div v-else class="muted-state">
          Сейчас нет открытой формы доступности.
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.home-dashboard,
.home-landing {
  width: 100%;
}

.dashboard-grid,
.landing-grid {
  display: grid;
  gap: 24px;
}

.dashboard-grid,
.landing-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--text-color);
}

.muted-state {
  color: var(--text-muted);
}

.action-link {
  margin-top: 8px;
  display: inline-block;
  color: var(--link-color, var(--text-color));
  font-weight: 600;
  text-decoration: none;
}

.action-link:hover {
  opacity: 0.85;
}

/* =========================
   Landing
   ========================= */

.landing-hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(102, 126, 234, 0.18), transparent 28%),
    radial-gradient(circle at bottom left, rgba(118, 75, 162, 0.18), transparent 34%),
    var(--card-bg-solid);
  border-radius: 32px;
  box-shadow: var(--card-shadow);
  border: var(--card-border);
  padding: 48px 52px;
  margin-bottom: 28px;
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
  padding: 9px 15px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-color);
  background: rgba(127, 127, 127, 0.08);
  margin-bottom: 18px;
  border: 1px solid rgba(127, 127, 127, 0.12);
}

.landing-title {
  margin: 0 0 18px;
  font-size: clamp(2.2rem, 4vw, 3.5rem);
  line-height: 1.08;
  color: var(--text-color);
  max-width: none;
  width: 100%;
}

.landing-text {
  margin: 0 0 28px;
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text-muted);
  max-width: none;
  width: 100%;
}

.landing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.landing-btn {
  text-decoration: none;
  padding: 14px 20px;
  border-radius: 16px;
  font-weight: 800;
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
  box-shadow: 0 18px 36px rgba(102, 126, 234, 0.32);
  opacity: 0.97;
}

.landing-section {
  margin-top: 28px;
}

.landing-section__title {
  margin: 0 0 18px;
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text-color);
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
  .dashboard-grid,
  .landing-grid--three {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .landing-hero {
    padding: 24px;
    border-radius: 24px;
  }

  .landing-title {
    max-width: none;
  }
}

@media (max-width: 576px) {
  .landing-actions {
    flex-direction: column;
  }

  .landing-btn {
    text-align: center;
  }
}
</style>