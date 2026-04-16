// src/composables/usePermissions.js
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export function usePermissions() {
  const userStore = useUserStore()

  const user = computed(() => userStore.user)
  const permissionCodes = computed(() => userStore.permissionCodes)
  const isAdmin = computed(() => userStore.isAdmin)

  const can = (code) => userStore.hasPermission(code)
  const canAny = (codes) => userStore.hasAnyPermission(codes)
  const canAll = (codes) => userStore.hasAllPermissions(codes)
  const canInSquad = (code, squadId) => userStore.hasSquadPermission(code, squadId)

  return {
    user,
    permissionCodes,
    isAdmin,
    can,
    canAny,
    canAll,
    canInSquad,
  }
}