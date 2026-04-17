import { ACCESS_GROUPS } from '@/constants/permissions'

export const APP_SECTIONS = {
  work: {
    title: 'Работа',
    items: [
      {
        label: 'Доступность',
        to: '/availability',
        icon: 'bi-calendar-check',
        routeNames: ['availability'],
        permissionsAny: ACCESS_GROUPS.AVAILABILITY_PAGE,
      },
      {
        label: 'Мой график',
        to: '/schedule',
        icon: 'bi-calendar3',
        routeNames: ['my-schedule'],
        permissionsAny: ACCESS_GROUPS.MY_SCHEDULE_PAGE,
      },
      {
        label: 'Мои заявки',
        to: '/schedule/requests',
        icon: 'bi-arrow-left-right',
        routeNames: ['schedule-requests'],
        permissionsAny: ACCESS_GROUPS.MY_CHANGE_REQUESTS_PAGE,
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
        permissionsAny: ACCESS_GROUPS.MANAGE_AVAILABILITY,
      },
      {
        label: 'Графики',
        to: '/dashboard/schedules',
        icon: 'bi-table',
        routeNames: ['dashboard-schedules'],
        permissionsAny: ACCESS_GROUPS.MANAGE_SCHEDULES,
      },
      {
        label: 'Заявки на изменения',
        to: '/dashboard/change-requests',
        icon: 'bi-pencil-square',
        routeNames: ['dashboard-change-requests'],
        permissionsAny: ACCESS_GROUPS.MANAGE_CHANGE_REQUESTS,
      },
      {
        label: 'Сканер QR',
        to: '/dashboard/scanner',
        icon: 'bi-qr-code-scan',
        routeNames: ['dashboard-scanner'],
        permissionsAny: ACCESS_GROUPS.MANAGE_SCANNER,
      },
      {
        label: 'Пользователи',
        to: '/dashboard/users',
        icon: 'bi-person-gear',
        routeNames: ['dashboard-users'],
        requiresAdmin: true,
      },
      {
        label: 'Роли',
        to: '/dashboard/roles',
        icon: 'bi-shield-lock',
        routeNames: ['dashboard-roles'],
        requiresAdmin: true,
      },
    ],
  },
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

export function hasSectionItemAccess(item, access) {
  if (!item) return false

  if (item.requiresAdmin) {
    return Boolean(access?.isAdmin)
  }

  const permissionsAny = normalizeList(item.permissionsAny)
  const permissionsAll = normalizeList(item.permissionsAll)

  if (!permissionsAny.length && !permissionsAll.length) {
    return true
  }

  if (!access) {
    return false
  }

  if (permissionsAny.length && !access.hasAnyPermission(permissionsAny)) {
    return false
  }

  if (permissionsAll.length && !access.hasAllPermissions(permissionsAll)) {
    return false
  }

  return true
}

export function filterSectionItems(section, access) {
  if (!section) return []

  return section.items.filter((item) => hasSectionItemAccess(item, access))
}