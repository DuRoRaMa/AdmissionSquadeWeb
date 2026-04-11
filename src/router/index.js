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
import useUserStore from '@/stores/user' // ← добавлен импорт
import AdminUsersView from '@/views/AdminUsersView.vue'
import AdminRolesView from '@/views/AdminRolesView.vue'

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
  { path: '/:pathMatch(.*)*', name: 'Not-found', component: NotFoundView },
  { path: '/dashboard/users', name: 'dashboard-users', component: AdminUsersView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/dashboard/roles', name: 'dashboard-roles', component: AdminRolesView, meta: { requiresAuth: true, requiresAdmin: true } },
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
  if (to.meta.requiresAdmin && !userStore.user?.is_staff) {
    next({ name: 'home' })
    return
  }
  if (to.meta.requiresCommander && authStore.isAuthenticated) {
    if (!userStore.user) {
      await userStore.fetchUser()
    }
    const squadId = to.params.id
    const isCommander = userStore.user?.is_staff ||
      userStore.user?.memberships?.some(m => m.squad == squadId && m.role_detail?.name === 'Командир')
    if (!isCommander) {
      next({ name: 'squads' })
      return
    }
  }

  next()
})

export default router