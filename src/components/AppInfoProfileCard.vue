<template>
  <div class="user-profile-card">
    <section class="card-section">
      <h3>Личная информация</h3>
      <div class="info-grid">
        <div><strong>Фамилия:</strong> {{ user.last_name }}</div>
        <div><strong>Имя:</strong> {{ user.first_name }}</div>
        <div><strong>Отчество:</strong> {{ user.middle_name || '—' }}</div>
        <div><strong>Пол:</strong> {{ gender }}</div>
        <div><strong>Дата рождения:</strong> {{ formatDate(user.memberships[0]?.birth_day) }}</div>
        <div><strong>Статус:</strong> {{ user.is_blocked ? 'Заблокирован' : 'Активен' }}</div>
      </div>
    </section>
    <section class="card-section">
      <h3>Контактная информация</h3>
      <div class="info-grid">
        <div><strong>Email:</strong> {{ user.email }}</div>
        <div><strong>Телефон:</strong> {{ user.phone }}</div>
      </div>
    </section>
    <section class="card-section">
      <h3>Данные аккаунта</h3>
      <div class="info-grid">
        <div><strong>Имя пользователя:</strong> {{ user.username }}</div>
        <div><strong>Дата регистрации:</strong> {{ formatDate(user.created_at) }}</div>
        <div><strong>Последнее обновление:</strong> {{ formatDate(user.updated_at) }}</div>
      </div>
    </section>
        <section class="card-section" v-if="user.memberships?.length">
      <h3>Участие в отрядах</h3>
      <div v-for="(membership, idx) in user.memberships" :key="idx" class="membership-item">
        <h4>Отряд: {{ membership.squad.name }}</h4>
        <div class="info-grid">
          <div><strong>Роль:</strong> {{ membership.role.name }}</div>
          <div><strong>Региональное отделение:</strong> {{ membership.squad.regional_office }}</div>
          <div><strong>Регион:</strong> {{ membership.squad.region }}</div>
          <div><strong>Работодатель:</strong> {{ membership.squad.employer }}</div>
          <div><strong>Университет:</strong> {{ membership.university }}</div>
          <div><strong>Факультет:</strong> {{ membership.faculty }}</div>
          <div><strong>Группа:</strong> {{ membership.student_group }}</div>
          <div><strong>Форма обучения:</strong> {{ studyForm(membership.study_form) }}</div>
          <div><strong>Дата вступления:</strong> {{ formatDate(membership.joined_date) }}</div>
          <div><strong>Статус участия:</strong> {{ membership.is_active ? 'Активно' : 'Неактивно' }}</div>
        </div>

        <!-- Взносы (если есть) -->
        <div v-if="membership.fees?.length" class="fees-section">
          <h5>Взносы</h5>
          <ul>
            <li v-for="(fee, i) in membership.fees" :key="i">
              Сумма: {{ fee.amount }} руб. | Оплачен: {{ formatDate(fee.paid_at) }} | Истекает: {{ formatDate(fee.expires_at) }}
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true,
  }
});
const gender = computed(() => {
  const gender = props.user.memberships?.[0]?.gender;
  if (gender === 'male') return 'Мужской';
  if (gender === 'female') return 'Жеский';
  return 'Не указан'
})
function  formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}
function studyForm(form){
  const forms = {
    'Full-time': 'Очная',
    'Part-time': 'Заочная',
    'Full-part-time': 'Очно-заочная',
  }
  return forms[form] || form
}
</script>

<style scoped>
.user-profile-card {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
}

.card-section {
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
}

.card-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.2rem;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.membership-item {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.membership-item h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #2c3e50;
}

.fees-section {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed #ccc;
}

.fees-section h5 {
  margin: 8px 0;
  font-size: 1rem;
  color: #555;
}

ul {
  margin: 4px 0 0;
  padding-left: 20px;
}
</style>