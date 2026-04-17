export const ROLE_PERMISSION_GROUPS = [
  {
    key: 'squad',
    title: 'Отряды',
    description: 'Просмотр и управление отрядом.',
    permissions: [
      {
        code: 'squad.view_own',
        label: 'Просмотр своего отряда',
        description: 'Доступ к информации о своём отряде.',
      },
      {
        code: 'squad.manage',
        label: 'Управление отрядом',
        description: 'Редактирование отряда и доступ к экрану управления.',
      },
    ],
  },
  {
    key: 'membership',
    title: 'Состав отряда',
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
        description: 'Добавление, исключение и изменение данных участников.',
      },
    ],
  },
  {
    key: 'fee',
    title: 'Взносы',
    description: 'Просмотр и управление взносами участников.',
    permissions: [
      {
        code: 'fee.view_own',
        label: 'Просмотр своих взносов',
        description: 'Пользователь видит информацию по своим взносам.',
      },
      {
        code: 'fee.manage',
        label: 'Управление взносами',
        description: 'Добавление, изменение и удаление взносов.',
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
        label: 'Ответ на свою доступность',
        description: 'Пользователь может отправлять свою доступность.',
      },
      {
        code: 'availability.manage',
        label: 'Управление формами доступности',
        description: 'Создание, изменение и публикация форм доступности.',
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
        description: 'Пользователь видит свой график.',
      },
      {
        code: 'roster.view_all',
        label: 'Просмотр всех графиков',
        description: 'Просмотр опубликованных графиков всех участников.',
      },
      {
        code: 'roster.manage',
        label: 'Управление графиками',
        description: 'Создание, редактирование и сопровождение графиков.',
      },
      {
        code: 'roster.publish',
        label: 'Публикация графиков',
        description: 'Публикация и открытие графиков для участников.',
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