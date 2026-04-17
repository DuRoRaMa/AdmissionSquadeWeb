export const ROLE_PERMISSION_GROUPS = [
  {
    key: 'roles',
    title: 'Роли и права',
    description: 'Управление ролями, наследованием и доступом в системе.',
    permissions: [
      {
        code: 'roles.view',
        label: 'Просмотр ролей',
        description: 'Открывать список ролей и просматривать их состав.',
      },
      {
        code: 'roles.manage',
        label: 'Управление ролями',
        description: 'Создавать, редактировать и удалять роли.',
      },
    ],
  },
  {
    key: 'users',
    title: 'Пользователи',
    description: 'Работа с профилями и назначением ролей.',
    permissions: [
      {
        code: 'users.view',
        label: 'Просмотр пользователей',
        description: 'Открывать список пользователей и карточки профилей.',
      },
      {
        code: 'users.manage',
        label: 'Редактирование пользователей',
        description: 'Изменять данные пользователей.',
      },
      {
        code: 'users.assign_roles',
        label: 'Назначение ролей',
        description: 'Назначать и менять роли пользователям.',
      },
    ],
  },
  {
    key: 'squads',
    title: 'Отряды',
    description: 'Управление отрядами и их составом.',
    permissions: [
      {
        code: 'squads.view',
        label: 'Просмотр отрядов',
        description: 'Открывать список отрядов и карточки.',
      },
      {
        code: 'squads.manage',
        label: 'Управление отрядами',
        description: 'Создавать и редактировать отряды.',
      },
      {
        code: 'squads.members.manage',
        label: 'Управление составом отрядов',
        description: 'Добавлять и удалять участников отряда.',
      },
    ],
  },
  {
    key: 'availability',
    title: 'Доступность',
    description: 'Формирование и обработка доступностей.',
    permissions: [
      {
        code: 'availability.view',
        label: 'Просмотр доступностей',
        description: 'Смотреть формы и ответы по доступности.',
      },
      {
        code: 'availability.manage',
        label: 'Управление формами доступности',
        description: 'Создавать, изменять и публиковать формы.',
      },
      {
        code: 'availability.submit',
        label: 'Отправка своей доступности',
        description: 'Заполнять собственную форму доступности.',
      },
    ],
  },
  {
    key: 'rosters',
    title: 'Графики',
    description: 'Создание и сопровождение графиков.',
    permissions: [
      {
        code: 'rosters.view',
        label: 'Просмотр графиков',
        description: 'Открывать графики и смены.',
      },
      {
        code: 'rosters.manage',
        label: 'Управление графиками',
        description: 'Создавать и редактировать графики.',
      },
      {
        code: 'rosters.assign',
        label: 'Назначение в график',
        description: 'Распределять людей по сменам.',
      },
    ],
  },
  {
    key: 'applications',
    title: 'Заявки',
    description: 'Работа с пользовательскими заявками и запросами.',
    permissions: [
      {
        code: 'applications.view',
        label: 'Просмотр заявок',
        description: 'Смотреть список заявок и карточки.',
      },
      {
        code: 'applications.manage',
        label: 'Обработка заявок',
        description: 'Менять статусы и принимать решения по заявкам.',
      },
      {
        code: 'applications.create',
        label: 'Создание своих заявок',
        description: 'Пользователь может создавать собственные заявки.',
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