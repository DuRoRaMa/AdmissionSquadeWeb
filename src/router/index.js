// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ProfileView from '../views/ProfileView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import RegisterView from '../views/RegisterView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import SquadsView from '@/views/SquadsView.vue'
import MySquadsView from '@/views/MySquadsView.vue'
import SquadManageView from '@/views/SquadManageView.vue'
import AdminUsersView from '@/views/AdminUsersView.vue'
import AdminRolesView from '@/views/AdminRolesView.vue'
import MyAvailabilityView from '@/views/availability/MyAvailabilityView.vue'
import MyScheduleView from '@/views/schedule/MyScheduleView.vue'
import MyScheduleRequestsView from '@/views/schedule/MyScheduleRequestsView.vue'
import AdminAvailabilityFormsView from '@/views/admin/AdminAvailabilityFormsView.vue'
import AdminSchedulesView from '@/views/admin/AdminSchedulesView.vue'
import AdminChangeRequestsView from '@/views/admin/AdminChangeRequestsView.vue'
import AdminScannerView from '@/views/admin/AdminScannerView.vue'

import useAuthStore from '@/stores/auth'
import useUserStore from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { section: 'home' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordView,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      requiresAuth: true,
      section: 'profile',
    },
  },

  // Работа пользователя
  {
    path: '/availability',
    name: 'availability',
    component: MyAvailabilityView,
    meta: {
      requiresAuth: true,
      section: 'work',
      permissionsAny: ['availability.view_own', 'availability.submit_own'],
    },
  },
  {
    path: '/schedule',
    name: 'my-schedule',
    component: MyScheduleView,
    meta: {
      requiresAuth: true,
      section: 'work',
      permissionsAny: ['schedule.view_own', 'schedule.view_all'],
    },
  },
  {
    path: '/schedule/requests',
    name: 'schedule-requests',
    component: MyScheduleRequestsView,
    meta: {
      requiresAuth: true,
      section: 'work',
      permissionsAny: ['change_request.create_own', 'change_request.view_own'],
    },
  },

  // Отряды
  {
    path: '/my-squads',
    name: 'my-squads',
    component: MySquadsView,
    meta: {
      requiresAuth: true,
      section: 'squads',
      permissionsAny: ['squad.view_own', 'squad.manage'],
    },
  },
  {
    path: '/squads',
    name: 'squads',
    component: SquadsView,
    meta: {
      requiresAuth: true,
      section: 'squads',
    },
  },
  {
    path: '/squads/:id/manage',
    name: 'squad-manage',
    component: SquadManageView,
    meta: {
      requiresAuth: true,
      section: 'squads',
      squadPermission: 'squad.manage',
    },
  },

  // Управление
  {
    path: '/dashboard/availability',
    name: 'dashboard-availability',
    component: AdminAvailabilityFormsView,
    meta: {
      requiresAuth: true,
      section: 'manage',
      permissionsAny: ['availability.form.manage'],
    },
  },
  {
    path: '/dashboard/schedules',
    name: 'dashboard-schedules',
    component: AdminSchedulesView,
    meta: {
      requiresAuth: true,
      section: 'manage',
      permissionsAny: ['schedule.manage'],
    },
  },
  {
    path: '/dashboard/change-requests',
    name: 'dashboard-change-requests',
    component: AdminChangeRequestsView,
    meta: {
      requiresAuth: true,
      section: 'manage',
      permissionsAny: ['change_request.review'],
    },
  },
  {
    path: '/dashboard/scanner',
    name: 'dashboard-scanner',
    component: AdminScannerView,
    meta: {
      requiresAuth: true,
      section: 'manage',
      permissionsAny: ['attendance.scan'],
    },
  },
  {
    path: '/dashboard/users',
    name: 'dashboard-users',
    component: AdminUsersView,
    meta: {
      requiresAuth: true,
      section: 'manage',
      permissionsAny: ['user.manage'],
    },
  },
  {
    path: '/dashboard/roles',
    name: 'dashboard-roles',
    component: AdminRolesView,
    meta: {
      requiresAuth: true,
      section: 'manage',
      permissionsAny: ['role.manage'],
    },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'Not-found',
    component: NotFoundView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  if (authStore.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    next({ name: 'home' })
    return
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  if (authStore.isAuthenticated && !userStore.user) {
    await userStore.fetchUser()
  }

  if (to.meta.permissionsAny?.length && !userStore.hasAnyPermission(to.meta.permissionsAny)) {
    next({ name: 'home' })
    return
  }

  if (to.meta.permissionsAll?.length && !userStore.hasAllPermissions(to.meta.permissionsAll)) {
    next({ name: 'home' })
    return
  }

  if (to.meta.squadPermission) {
    const squadId = to.params.id
    if (!userStore.hasSquadPermission(to.meta.squadPermission, squadId)) {
      next({ name: 'squads' })
      return
    }
  }

  next()
})

export default router