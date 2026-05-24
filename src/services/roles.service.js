import apiClient from '@/axios'

function sanitizeRolePayload(payload = {}) {
  return {
    name: String(payload.name || '').trim(),
    slug: String(payload.slug || '').trim(),
    description: String(payload.description || '').trim(),
    parent: payload.parent ? Number(payload.parent) : null,
    permissions: Array.isArray(payload.permissions)
      ? [...new Set(payload.permissions)].filter(Boolean)
      : [],
  }
}

async function getRoles(params = {}) {
  const { data } = await apiClient.get('/api/v1/users/roles/', { params })
  return data
}

async function getRole(roleId) {
  const { data } = await apiClient.get(`/api/v1/users/roles/${roleId}/`)
  return data
}

async function getPermissionCatalog() {
  const { data } = await apiClient.get('/api/v1/users/roles/permissions-catalog/')
  return data
}

async function createRole(payload) {
  const { data } = await apiClient.post(
    '/api/v1/users/roles/',
    sanitizeRolePayload(payload)
  )
  return data
}

async function updateRole(roleId, payload) {
  const { data } = await apiClient.patch(
    `/api/v1/users/roles/${roleId}/`,
    sanitizeRolePayload(payload)
  )
  return data
}

async function deleteRole(roleId) {
  await apiClient.delete(`/api/v1/users/roles/${roleId}/`)
}

export default {
  getRoles,
  getRole,
  getPermissionCatalog,
  createRole,
  updateRole,
  deleteRole,
}