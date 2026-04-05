<template>
  <div class="card">
    <div class="card-header">
      <h3>Участие в отрядах</h3>
    </div>
    <div class="card-body">
      <div v-if="!memberships || memberships.length === 0" class="empty">
        Вы не состоите ни в одном отряде
      </div>
      <div v-for="(membership, idx) in memberships" :key="idx" class="membership-item">
        <h4>{{ membership.squad_detail?.name || membership.squad?.name }}</h4>
        <div class="info-grid">
          <div><strong>Роль:</strong> {{ membership.role_detail?.name || membership.role?.name }}</div>
          <div><strong>Номер билета:</strong> {{ membership.ticket_number || '—' }}</div>
          <div><strong>Университет:</strong> {{ membership.university }}</div>
          <div><strong>Дата вступления:</strong> {{ formatDate(membership.joined_date) }}</div>
          <div><strong>Статус:</strong> {{ membership.is_active ? 'Активно' : 'Неактивно' }}</div>
        </div>

        <div v-if="membership.fees && membership.fees.length" class="fees-section">
          <h5>Взносы</h5>
          <ul>
            <li v-for="(fee, i) in membership.fees" :key="i">
              {{ fee.amount }} руб. (оплачен: {{ formatDate(fee.paid_at) }}, истекает: {{ formatDate(fee.expires_at) }})
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ memberships: { type: Array, default: () => [] } })

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  border-radius: var(--card-border-radius);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.2s ease;
}
.card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
}
.card-header {
  padding: 12px 16px;
  background: var(--header-footer-bg);
  border-bottom: 1px solid var(--card-border);
}
.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color);
}
.card-body {
  padding: 16px;
  background: var(--card-bg-solid);
}
.empty {
  color: var(--text-muted);
  font-style: italic;
}
.membership-item {
  background: rgba(0, 0, 0, 0.02);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
}
.dark-theme .membership-item {
  background: rgba(255, 255, 255, 0.05);
}
.membership-item h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
  color: var(--text-color);
}
.fees-section {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--card-border);
}
.fees-section h5 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: var(--text-muted);
}
ul {
  margin: 4px 0 0;
  padding-left: 20px;
  color: var(--text-color);
}
@media (max-width: 768px) {
  .membership-item {
    padding: 12px;
  }
  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>