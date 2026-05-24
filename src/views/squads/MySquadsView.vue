<template>
  <div class="my-squads-page">
    <h1 class="page-title">Мои отряды</h1>
    <div v-if="userStore.isLoading" class="loading">Загрузка...</div>
    <div v-else-if="!userStore.user" class="error">Не удалось загрузить профиль</div>
    <div v-else>
      <div v-if="activeMemberships.length === 0" class="empty">
        Вы не состоите ни в одном отряде.
        <router-link to="/squads" class="link">Перейти к списку отрядов</router-link>
      </div>
      <div v-else class="membership-card">
        <div class="card-header">
          <h3>{{ activeMemberships[0].squad_detail?.name || activeMemberships[0].squad?.name }}</h3>
          <span class="role">{{ activeMemberships[0].role_detail?.name || activeMemberships[0].role?.name }}</span>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div><strong>Номер билета:</strong> {{ activeMemberships[0].ticket_number || '—' }}</div>
            <div><strong>Университет:</strong> {{ activeMemberships[0].university }}</div>
            <div><strong>Дата вступления:</strong> {{ formatDate(activeMemberships[0].joined_date) }}</div>
          </div>
          <!-- Взносы -->
          <div v-if="activeMemberships[0].fees && activeMemberships[0].fees.length" class="fees-section">
            <h4>Взносы</h4>
            <ul>
              <li v-for="fee in activeMemberships[0].fees" :key="fee.id">
                {{ fee.amount }} руб. (оплачен: {{ formatDate(fee.paid_at) }}, истекает: {{ formatDate(fee.expires_at) }})
              </li>
            </ul>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn-leave" @click="openExitModal">Подать заявку на выход</button>
        </div>
      </div>
    </div>

    <ModalExitRequest
      :visible="showModal"
      :membershipId="activeMemberships[0]?.id"
      :squadName="activeMemberships[0]?.squad_detail?.name || activeMemberships[0]?.squad?.name"
      @close="showModal = false"
      @success="handleExitSuccess"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import ModalExitRequest from '@/components/squads/ModalExitRequest.vue'

const userStore = useUserStore()
const showModal = ref(false)

const activeMemberships = computed(() => {
  if (!userStore.user?.memberships) return []
  return userStore.user.memberships.filter(m => m.is_active === true)
})

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function openExitModal() {
  if (activeMemberships.value.length === 0) return
  showModal.value = true
}

async function handleExitSuccess() {
  // После успешной отправки заявки обновляем данные пользователя
  await userStore.fetchUser()
  showModal.value = false
  alert('Заявка на выход отправлена. Ожидайте решения командира отряда.')
}

onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchUser()
  }
})
</script>

<style scoped>
.my-squads-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.page-title {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
  text-align: center;
}
.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}
.link {
  color: var(--accent-gradient);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
.membership-card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  border-radius: var(--card-border-radius);
  border: 1px solid var(--card-border);
  overflow: hidden;
}
.card-header {
  padding: 1rem;
  background: var(--header-footer-bg);
  border-bottom: 1px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
}
.card-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}
.role {
  font-weight: 500;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  padding: 0.2rem 0.8rem;
  border-radius: 50px;
  font-size: 0.9rem;
}
.card-body {
  padding: 1rem;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}
.fees-section {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--card-border);
}
.fees-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-color);
}
ul {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--text-color);
}
.card-footer {
  padding: 1rem;
  background: var(--header-footer-bg);
  border-top: 1px solid var(--card-border);
  text-align: right;
}
.btn-leave {
  background: #dc3545;
  border: none;
  border-radius: 50px;
  padding: 0.4rem 1.2rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-leave:hover {
  opacity: 0.9;
}
</style>