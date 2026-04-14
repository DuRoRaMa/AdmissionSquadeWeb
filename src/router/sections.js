export const APP_SECTIONS = {
  work: {
    title: 'Работа',
    items: [
      {
        label: 'Доступность',
        to: '/availability',
        icon: 'bi-calendar-check',
        routeNames: ['availability'],
      },
      {
        label: 'Мой график',
        to: '/schedule',
        icon: 'bi-calendar3',
        routeNames: ['my-schedule'],
      },
      {
        label: 'Мои заявки',
        to: '/schedule/requests',
        icon: 'bi-arrow-left-right',
        routeNames: ['schedule-requests'],
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
        requiresCommander: true,
      },
      {
        label: 'Графики',
        to: '/dashboard/schedules',
        icon: 'bi-table',
        routeNames: ['dashboard-schedules'],
        requiresCommander: true,
      },
      {
        label: 'Заявки на изменения',
        to: '/dashboard/change-requests',
        icon: 'bi-pencil-square',
        routeNames: ['dashboard-change-requests'],
        requiresCommander: true,
      },
      {
        label: 'Сканер QR',
        to: '/dashboard/scanner',
        icon: 'bi-qr-code-scan',
        routeNames: ['dashboard-scanner'],
        requiresCommander: true,
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

export function filterSectionItems(section, access) {
  if (!section) return []

  return section.items.filter(item => {
    if (item.requiresAdmin && !access.isAdmin) return false
    if (item.requiresCommander && !access.isCommander) return false
    return true
  })
}