export const ROLE_PERMISSION_GROUPS = [
  {
    key: 'squad',
    title: 'Отряды',
    description: 'Просмотр и управление отрядами.',
    permissions: [
      {
        code: 'squad.view',
        label: 'Просмотр отрядов',
        description: 'Доступ к карточкам и данным отрядов.',
      },
      {
        code: 'squad.manage',
        label: 'Управление отрядом',
        description: 'Редактирование и управление отрядом.',
      },
    ],
  },
  {
    key: 'membership',
    title: 'Участники',
    description: 'Вступление и управление участниками.',
    permissions: [
      {
        code: 'membership.join_own',
        label: 'Вступление в отряд',
        description: 'Пользователь может вступить в отряд самостоятельно.',
      },
      {
        code: 'membership.manage',
        label: 'Управление участниками',
        description: 'Добавление, изменение и исключение участников.',
      },
    ],
  },
  {
    key: 'fee',
    title: 'Взносы',
    description: 'Просмотр и управление взносами.',
    permissions: [
      {
        code: 'fee.view_own',
        label: 'Просмотр своих взносов',
        description: 'Пользователь видит собственные взносы.',
      },
      {
        code: 'fee.manage',
        label: 'Управление взносами',
        description: 'Создание, изменение и удаление взносов.',
      },
    ],
  },
  {
    key: 'availability',
    title: 'Доступность',
    description: 'Работа с формами доступности.',
    permissions: [
      {
        code: 'availability.respond_own',
        label: 'Заполнение своей доступности',
        description: 'Пользователь отправляет свою доступность.',
      },
      {
        code: 'availability.manage',
        label: 'Управление доступностью',
        description: 'Создание и сопровождение форм доступности.',
      },
    ],
  },
  {
    key: 'roster',
    title: 'Графики',
    description: 'Просмотр и сопровождение графиков.',
    permissions: [
      {
        code: 'roster.view_own',
        label: 'Просмотр своего графика',
        description: 'Пользователь видит только свои смены.',
      },
      {
        code: 'roster.view_all',
        label: 'Просмотр общего графика',
        description: 'Просмотр общего графика отряда.',
      },
      {
        code: 'roster.manage',
        label: 'Управление графиками',
        description: 'Создание и редактирование графиков.',
      },
      {
        code: 'roster.publish',
        label: 'Публикация графиков',
        description: 'Публикация итогового графика.',
      },
    ],
  },
]

export function flattenRolePermissions() {
  return ROLE_PERMISSION_GROUPS.flatMap((group) => group.permissions)
}

export function getPermissionMap() {
  return flattenRolePermissions().reduce((acc, permission) => {
    acc[permission.code] = permission
    return acc
  }, {})
}

export function getPermissionLabel(code) {
  return getPermissionMap()[code]?.label || code
}