export const APP_SECTIONS = {
  work: {
    title: 'Работа',
    items: [
      {
        label: 'Доступность',
        to: '/availability',
        icon: 'bi-calendar-check',
        routeNames: ['availability'],
        permissionsAny: ['availability.view_own', 'availability.submit_own'],
      },
      {
        label: 'Мой график',
        to: '/schedule',
        icon: 'bi-calendar3',
        routeNames: ['my-schedule'],
        permissionsAny: ['schedule.view_own', 'schedule.view_all'],
      },
      {
        label: 'Мои заявки',
        to: '/schedule/requests',
        icon: 'bi-arrow-left-right',
        routeNames: ['schedule-requests'],
        permissionsAny: ['change_request.create_own', 'change_request.view_own'],
      },
    ],
  },

  squads: {
    title: 'Отряды',
    items: [
      {
        label: 'Мои отряды',
        to: '/my-squads',
        icon: 'bi-people',
        routeNames: ['my-squads'],
        permissionsAny: ['squad.view_own', 'squad.manage'],
      },
      {
        label: 'Все отряды',
        to: '/squads',
        icon: 'bi-diagram-3',
        routeNames: ['squads', 'squad-manage'],
      },
    ],
  },

  manage: {
    title: 'Управление',
    items: [
      {
        label: 'Формы доступности',
        to: '/dashboard/availability',
        icon: 'bi-ui-checks-grid',
        routeNames: ['dashboard-availability'],
        permissionsAny: ['availability.form.manage'],
      },
      {
        label: 'Графики',
        to: '/dashboard/schedules',
        icon: 'bi-table',
        routeNames: ['dashboard-schedules'],
        permissionsAny: ['schedule.manage'],
      },
      {
        label: 'Заявки на изменения',
        to: '/dashboard/change-requests',
        icon: 'bi-pencil-square',
        routeNames: ['dashboard-change-requests'],
        permissionsAny: ['change_request.review'],
      },
      {
        label: 'Сканер QR',
        to: '/dashboard/scanner',
        icon: 'bi-qr-code-scan',
        routeNames: ['dashboard-scanner'],
        permissionsAny: ['attendance.scan'],
      },
      {
        label: 'Пользователи',
        to: '/dashboard/users',
        icon: 'bi-person-gear',
        routeNames: ['dashboard-users'],
        permissionsAny: ['user.manage'],
      },
      {
        label: 'Роли',
        to: '/dashboard/roles',
        icon: 'bi-shield-lock',
        routeNames: ['dashboard-roles'],
        permissionsAny: ['role.manage'],
      },
    ],
  },
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

export function hasSectionItemAccess(item, access) {
  if (!item) return false

  const permissionsAny = normalizeList(item.permissionsAny)
  const permissionsAll = normalizeList(item.permissionsAll)

  if (!permissionsAny.length && !permissionsAll.length) {
    return true
  }

  if (!access) {
    return false
  }

  if (permissionsAny.length) {
    const ok = access.hasAnyPermission(permissionsAny)
    if (!ok) return false
  }

  if (permissionsAll.length) {
    const ok = access.hasAllPermissions(permissionsAll)
    if (!ok) return false
  }

  return true
}

export function filterSectionItems(section, access) {
  if (!section) return []

  return section.items.filter((item) => hasSectionItemAccess(item, access))
}