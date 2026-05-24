import { computed } from 'vue'
import useAuthStore from '@/stores/auth'
import useUserStore from '@/stores/user'

export default function useAccess() {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isAdmin = computed(() => Boolean(userStore.user?.is_staff))

  function can(permission) {
    if (!permission) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.user?.is_staff) return true
    return userStore.hasPermission(permission)
  }

  function canAny(permissions = []) {
    if (!permissions.length) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.user?.is_staff) return true
    return userStore.hasAnyPermission(permissions)
  }

  function canAll(permissions = []) {
    if (!permissions.length) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.user?.is_staff) return true
    return userStore.hasAllPermissions(permissions)
  }

  function canSquad(permission, squadId) {
    if (!permission) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.user?.is_staff) return true
    return userStore.hasSquadPermission(permission, squadId)
  }

  return {
    isAuthenticated,
    isAdmin,
    can,
    canAny,
    canAll,
    canSquad,
  }
}