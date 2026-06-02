<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import useAuthStore from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const isOpen = ref(false)
const dropdownRef = ref(null)

let refreshTimer = null

const visibleNotifications = computed(() => {
  return notificationStore.notifications.slice(0, 8)
})

const badgeText = computed(() => {
  if (notificationStore.unreadCount > 99) {
    return '99+'
  }

  return String(notificationStore.unreadCount)
})

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function toggleDropdown() {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    await notificationStore.fetchNotifications()
    await notificationStore.fetchUnreadCount()
  }
}

function closeDropdown() {
  isOpen.value = false
}

async function markAllAsRead() {
  await notificationStore.markAllAsRead()
}

async function handleNotificationClick(notification) {
  await notificationStore.markAsRead(notification.id)

  closeDropdown()

  if (notification.object_url) {
    router.push(notification.object_url)
  }
}

function handleDocumentClick(event) {
  if (!isOpen.value) {
    return
  }

  if (!dropdownRef.value) {
    return
  }

  if (!dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

function startAutoRefresh() {
  stopAutoRefresh()

  notificationStore.fetchUnreadCount()

  refreshTimer = window.setInterval(() => {
    notificationStore.fetchUnreadCount()
  }, 60000)

  document.addEventListener('click', handleDocumentClick)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }

  document.removeEventListener('click', handleDocumentClick)
}

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      startAutoRefresh()
      return
    }

    closeDropdown()
    stopAutoRefresh()
    notificationStore.reset()
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div ref="dropdownRef" class="notifications-dropdown">
    <button
    class="notifications-dropdown__trigger app-icon-btn"
    type="button"
    title="Уведомления"
    aria-label="Уведомления"
    @click.stop="toggleDropdown"
    >
    <i :class="notificationStore.unreadCount ? 'bi bi-bell-fill' : 'bi bi-bell'" />

    <span
        v-if="notificationStore.unreadCount"
        class="notifications-dropdown__badge"
    >
        {{ badgeText }}
    </span>
    </button>

    <div
      v-if="isOpen"
      class="notifications-dropdown__panel"
    >
      <div class="notifications-dropdown__header">
        <div>
          <div class="notifications-dropdown__title">
            Уведомления
          </div>

          <div class="notifications-dropdown__subtitle">
            {{ notificationStore.unreadCount ? `Непрочитанных: ${notificationStore.unreadCount}` : 'Новых уведомлений нет' }}
          </div>
        </div>

        <button
          v-if="notificationStore.unreadCount"
          class="notifications-dropdown__read-all"
          type="button"
          :disabled="notificationStore.isMarkingRead"
          @click.stop="markAllAsRead"
        >
          Прочитать все
        </button>
      </div>

      <div
        v-if="notificationStore.isLoading && !visibleNotifications.length"
        class="notifications-dropdown__state"
      >
        Загружаем уведомления...
      </div>

      <div
        v-else-if="notificationStore.lastError"
        class="notifications-dropdown__state notifications-dropdown__state--danger"
      >
        {{ notificationStore.lastError }}
      </div>

      <div
        v-else-if="!visibleNotifications.length"
        class="notifications-dropdown__state"
      >
        Уведомлений пока нет.
      </div>

      <div v-else class="notifications-dropdown__list">
        <button
          v-for="notification in visibleNotifications"
          :key="notification.id"
          class="notifications-dropdown__item"
          :class="{ 'is-unread': !notification.is_read }"
          type="button"
          @click="handleNotificationClick(notification)"
        >
          <span
            v-if="!notification.is_read"
            class="notifications-dropdown__dot"
            aria-hidden="true"
          ></span>

          <span class="notifications-dropdown__item-content">
            <span class="notifications-dropdown__item-title">
              {{ notification.title }}
            </span>

            <span
              v-if="notification.message"
              class="notifications-dropdown__item-message"
            >
              {{ notification.message }}
            </span>

            <span class="notifications-dropdown__item-footer">
              <span>{{ formatDateTime(notification.created_at) }}</span>

              <span v-if="notification.object_url">
                Открыть
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.notifications-dropdown__trigger {
  position: relative;
  flex-shrink: 0;

  width: 42px;
  height: 42px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border: none;
  border-radius: 14px;
  outline: none;

  color: var(--text-color);
  background: rgba(127, 127, 127, 0.08);

  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.notifications-dropdown__trigger:hover {
  background: rgba(127, 127, 127, 0.14);
  transform: translateY(-1px);
}

.notifications-dropdown__trigger i {
  font-size: 1.25rem;
  line-height: 1;
}

.notifications-dropdown__trigger:focus-visible {
  box-shadow: var(--input-focus-shadow);
}

.notifications-dropdown__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--danger-color, #dc3545);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}

.notifications-dropdown__panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(380px, calc(100vw - 24px));
  max-height: 520px;
  overflow: hidden;
  border: var(--card-border);
  border-radius: 18px;
  background: var(--card-bg-solid, var(--header-footer-bg));
  box-shadow: var(--card-shadow, 0 18px 40px rgba(15, 23, 42, 0.18));
  z-index: 1100;
}

.notifications-dropdown__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: var(--card-border);
}

.notifications-dropdown__title {
  color: var(--text-color);
  font-size: 0.98rem;
  font-weight: 850;
}

.notifications-dropdown__subtitle {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.notifications-dropdown__read-all {
  border: none;
  background: transparent;
  color: var(--primary-color, #667eea);
  font-size: 0.82rem;
  font-weight: 750;
  cursor: pointer;
  white-space: nowrap;
}

.notifications-dropdown__read-all:disabled {
  cursor: default;
  opacity: 0.6;
}

.notifications-dropdown__state {
  padding: 18px 16px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.notifications-dropdown__state--danger {
  color: var(--danger-color, #dc3545);
}

.notifications-dropdown__list {
  max-height: 420px;
  overflow-y: auto;
  padding: 6px;
}

.notifications-dropdown__item {
  position: relative;
  display: flex;
  width: 100%;
  gap: 10px;
  border: none;
  border-radius: 14px;
  background: transparent;
  padding: 11px 12px;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.notifications-dropdown__item:hover {
  background: rgba(127, 127, 127, 0.08);
}

.notifications-dropdown__item.is-unread {
  background: rgba(102, 126, 234, 0.09);
}

.notifications-dropdown__dot {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--primary-color, #667eea);
  flex-shrink: 0;
}

.notifications-dropdown__item-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.notifications-dropdown__item-title {
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.25;
}

.notifications-dropdown__item-message {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.35;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notifications-dropdown__item-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 650;
}

@media (max-width: 576px) {
  .notifications-dropdown {
    width: 100%;
  }

  .notifications-dropdown__trigger {
    width: 100%;
  }

  .notifications-dropdown__panel {
    position: static;
    width: 100%;
    margin-top: 8px;
  }
}
</style>
