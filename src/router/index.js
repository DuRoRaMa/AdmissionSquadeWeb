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
import useAuthStore from '@/stores/auth'
import useUserStore from '@/stores/user'
import AdminUsersView from '@/views/AdminUsersView.vue'
import AdminRolesView from '@/views/AdminRolesView.vue'

import MyAvailabilityView from '@/views/availability/MyAvailabilityView.vue'
import MyScheduleView from '@/views/schedule/MyScheduleView.vue'
import MyScheduleRequestsView from '@/views/schedule/MyScheduleRequestsView.vue'
import AdminAvailabilityFormsView from '@/views/admin/AdminAvailabilityFormsView.vue'
import AdminSchedulesView from '@/views/admin/AdminSchedulesView.vue'
import AdminChangeRequestsView from '@/views/admin/AdminChangeRequestsView.vue'
import AdminScannerView from '@/views/admin/AdminScannerView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView },

  { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/squads', name: 'squads', component: SquadsView, meta: { requiresAuth: true } },
  { path: '/my-squads', name: 'my-squads', component: MySquadsView, meta: { requiresAuth: true } },
  {
    path: '/squads/:id/manage',
    name: 'squad-manage',
    component: SquadManageView,
    meta: { requiresAuth: true, requiresCommander: true }
  },

  { path: '/availability', name: 'availability', component: MyAvailabilityView, meta: { requiresAuth: true } },
  { path: '/schedule', name: 'my-schedule', component: MyScheduleView, meta: { requiresAuth: true } },
  { path: '/schedule/requests', name: 'schedule-requests', component: MyScheduleRequestsView, meta: { requiresAuth: true } },

  {
    path: '/dashboard/availability',
    name: 'dashboard-availability',
    component: AdminAvailabilityFormsView,
    meta: { requiresAuth: true, requiresCommander: true }
  },
  {
    path: '/dashboard/schedules',
    name: 'dashboard-schedules',
    component: AdminSchedulesView,
    meta: { requiresAuth: true, requiresCommander: true }
  },
  {
    path: '/dashboard/change-requests',
    name: 'dashboard-change-requests',
    component: AdminChangeRequestsView,
    meta: { requiresAuth: true, requiresCommander: true }
  },
  {
    path: '/dashboard/scanner',
    name: 'dashboard-scanner',
    component: AdminScannerView,
    meta: { requiresAuth: true, requiresCommander: true }
  },

  {
    path: '/dashboard/users',
    name: 'dashboard-users',
    component: AdminUsersView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/dashboard/roles',
    name: 'dashboard-roles',
    component: AdminRolesView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  { path: '/:pathMatch(.*)*', name: 'Not-found', component: NotFoundView },
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

  if (to.meta.requiresAdmin && !userStore.user?.is_staff) {
    next({ name: 'home' })
    return
  }

  if (to.meta.requiresCommander && authStore.isAuthenticated) {
    const squadId = to.params.id

    const isCommander =
      userStore.user?.is_staff ||
      userStore.user?.memberships?.some(
        m => (
          squadId
            ? String(m.squad) === String(squadId)
            : true
        ) && (m.role_detail?.slug === 'commander' || m.role_detail?.name === 'Командир')
      )

    if (!isCommander) {
      next({ name: 'squads' })
      return
    }
  }

  next()
})

export default router