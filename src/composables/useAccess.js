import { computed } from 'vue'
import useAuthStore from '@/stores/auth'
import useUserStore from '@/stores/user'

export default function useAccess() {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isAdmin = computed(() => Boolean(userStore.isAdmin))

  function can(permission) {
    if (!permission) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.isAdmin) return true
    return userStore.hasPermission(permission)
  }

  function canAny(permissions = []) {
    if (!permissions.length) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.isAdmin) return true
    return userStore.hasAnyPermission(permissions)
  }

  function canAll(permissions = []) {
    if (!permissions.length) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.isAdmin) return true
    return userStore.hasAllPermissions(permissions)
  }

  function canSquad(permission, squadId) {
    if (!permission) return true
    if (!authStore.isAuthenticated) return false
    if (userStore.isAdmin) return true
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