<template>
  <div class="card">
    <div class="card-header">
      <h3>Данные аккаунта</h3>
    </div>
    <div class="card-body">
      <div class="info-row"><strong>Имя пользователя:</strong> {{ user.username }}</div>
      <div class="info-row"><strong>Дата регистрации:</strong> {{ formatDateTime(user.created_at) }}</div>
      <div class="info-row"><strong>Последнее обновление:</strong> {{ formatDateTime(user.updated_at) }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ user: { type: Object, required: true } })

function formatDateTime(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
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
.info-row {
  margin-bottom: 8px;
  color: var(--text-color);
}
</style>