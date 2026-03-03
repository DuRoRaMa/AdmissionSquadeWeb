<template>
  <div class="profile-sidebar">
    <div class="avatar-block">
      <div class="avatar">{{ initials }}</div>
      <h2>{{ fullName }}</h2>
      <div class="role">{{ userRole }}</div>
      <div class="location" v-if="location">
        {{ location }}
      </div>
    </div>
    <!-- Блок с QR пока убран по условию задачи -->
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: ''
  }
})

// Полное имя
const fullName = computed(() => {
  const { last_name = '', first_name = '', middle_name = '' } = props.user
  return `${last_name} ${first_name} ${middle_name}`.trim()
})

// Инициалы (первая буква имени и фамилии)
const initials = computed(() => {
  const first = props.user.first_name?.[0] || ''
  const last = props.user.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
})

// Роль: если передана через пропс — используем её, иначе пытаемся взять из memberships
const userRole = computed(() => {
  if (props.role) return props.role
  if (props.user.memberships?.length) {
    return props.user.memberships[0].role.name || 'Участник'
  }
  return 'Участник'
})
</script>

<style scoped>
.profile-sidebar {
  flex: 0 0 280px;
  background: #ffffff;
  border-radius: 28px;
  padding: 20px;
  border: 1px solid #eef2f6;
  box-shadow: 0 10px 25px -12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar {
  width: 140px;
  height: 140px;
  background: linear-gradient(145deg, #2563eb, #38bdf8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  font-weight: 500;
  color: white;
  box-shadow: 0 12px 22px -8px #2563eb80;
  border: 4px solid white;
  margin-bottom: 16px;
}

.avatar-block h2 {
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin-bottom: 4px;
}

.avatar-block .role {
  font-weight: 500;
  color: #2563eb;
  margin-bottom: 8px;
  background: #eef6ff;
  padding: 4px 16px;
  border-radius: 40px;
  display: inline-block;
}

.avatar-block .location {
  color: #475569;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .profile-sidebar {
    flex: 0 0 auto;
    width: 100%;
    max-width: 450px;
    margin: 0 auto;
  }
  .avatar {
    width: 120px;
    height: 120px;
    font-size: 44px;
  }
}
</style>