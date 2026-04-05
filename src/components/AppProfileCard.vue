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
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: Object,
  location: { type: String, default: '' }
})

const fullName = computed(() => {
  const { last_name = '', first_name = '', middle_name = '' } = props.user
  return `${last_name} ${first_name} ${middle_name}`.trim()
})

const initials = computed(() => {
  const first = props.user.first_name?.[0] || ''
  const last = props.user.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
})

const userRole = computed(() => {
  if (props.user.memberships?.length) {
    return props.user.memberships[0].role_detail?.name || props.user.memberships[0].role?.name || 'Участник'
  }
  return 'Участник'
})
</script>

<style scoped>
.profile-sidebar {
  flex: 0 0 280px;
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  border-radius: 28px;
  padding: 20px;
  border: 1px solid var(--card-border);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: all 0.2s ease;
}
.profile-sidebar:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
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
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  font-weight: 500;
  color: white;
  box-shadow: 0 12px 22px -8px rgba(102, 126, 234, 0.5);
  border: 4px solid var(--card-bg-solid);
  margin-bottom: 16px;
}
.avatar-block h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}
.avatar-block .role {
  font-weight: 500;
  color: #2563eb;
  margin-bottom: 8px;
  background: rgba(37, 99, 235, 0.15);
  padding: 4px 16px;
  border-radius: 40px;
  display: inline-block;
}
.dark-theme .avatar-block .role {
  background: rgba(37, 99, 235, 0.3);
  color: #60a5fa;
}
.avatar-block .location {
  color: var(--text-muted);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
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