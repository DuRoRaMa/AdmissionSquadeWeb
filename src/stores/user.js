// src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../axios'
import { useAuthStore } from './auth'

function normalizePermissionCode(permission) {
  if (!permission) return null

  if (typeof permission === 'string') {
    return permission.trim() || null
  }

  if (typeof permission === 'object') {
    return permission.code?.trim() || null
  }

  return null
}

function normalizePermissionList(value) {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizePermissionCode)
    .filter(Boolean)
}

function extractRolePermissions(roleDetail) {
  if (!roleDetail) return []

  const effectivePermissions =
    roleDetail.effective_permissions ??
    roleDetail.resolved_permissions ??
    roleDetail.permissions ??
    []

  return normalizePermissionList(effectivePermissions)
}

function extractEffectivePermissions(rawUser) {
  if (!rawUser) return []

  const direct = normalizePermissionList(rawUser.effective_permissions)

  const fromMemberships = Array.isArray(rawUser.memberships)
    ? rawUser.memberships.flatMap((membership) =>
        extractRolePermissions(membership?.role_detail)
      )
    : []

  return [...new Set([...direct, ...fromMemberships])]
}

function normalizeUser(rawUser) {
  if (!rawUser) return null

  return {
    ...rawUser,
    memberships: Array.isArray(rawUser.memberships) ? rawUser.memberships : [],
    permission_codes: extractEffectivePermissions(rawUser),
  }
}

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoading = ref(false)

  const permissionCodes = computed(() => user.value?.permission_codes ?? [])
  const isAdmin = computed(() => Boolean(user.value?.is_staff))

  function hasPermission(code) {
    if (!code) return true
    if (isAdmin.value) return true
    return permissionCodes.value.includes(code)
  }

  function hasAnyPermission(codes = []) {
    if (!codes.length) return true
    if (isAdmin.value) return true
    return codes.some((code) => hasPermission(code))
  }

  function hasAllPermissions(codes = []) {
    if (!codes.length) return true
    if (isAdmin.value) return true
    return codes.every((code) => hasPermission(code))
  }

  function hasSquadPermission(code, squadId) {
    if (!code) return true
    if (isAdmin.value) return true
    if (!user.value || !squadId) return false

    return user.value.memberships.some((membership) => {
      if (String(membership?.squad) !== String(squadId)) {
        return false
      }

      const rolePermissions = extractRolePermissions(membership?.role_detail)
      return rolePermissions.includes(code)
    })
  }

  async function fetchUser() {
    const authStore = useAuthStore()
    if (!authStore.token) return null

    isLoading.value = true

    try {
      const response = await apiClient.get('api/v1/users/me/')
      user.value = normalizeUser(response.data)
      return user.value
    } catch (error) {
      if (error.response?.status === 401) {
        authStore.logout()
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateUser(data) {
    isLoading.value = true

    try {
      const response = await apiClient.patch('api/v1/users/me/', data)
      user.value = normalizeUser(response.data)
      return user.value
    } catch (error) {
      console.error('Update user error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function clearUser() {
    user.value = null
  }

  return {
    user,
    isLoading,
    permissionCodes,
    isAdmin,
    fetchUser,
    updateUser,
    clearUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasSquadPermission,
  }
})

export default useUserStore