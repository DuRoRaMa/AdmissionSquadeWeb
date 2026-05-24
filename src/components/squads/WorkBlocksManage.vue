<template>
  <section class="work-blocks-manage">
    <AppAlert
      v-if="alert.message"
      :variant="alert.variant"
      :message="alert.message"
      @close="clearAlert"
    />

    <AppCard class="work-blocks-card squad-controls">
      <template #header>
        <div class="work-blocks-header">
          <div>
            <h2>Блоки работ</h2>
            <p>
              Добавляйте и деактивируйте блоки работ для этого отряда. В настройке графиков отображаются только активные блоки.
            </p>
          </div>

          <AppButton
            type="button"
            variant="primary"
            :disabled="loading || saving || togglingId !== null"
            @click="fetchWorkBlocks"
          >
            Обновить
          </AppButton>
        </div>
      </template>

      <form class="work-blocks-form" @submit.prevent="handleCreateWorkBlock">
        <AppInput
          v-model="form.code"
          label="Код блока"
          placeholder="Например: ОЧН"
          :disabled="loading || saving || togglingId !== null"
        />

        <AppInput
          v-model="form.name"
          label="Название блока"
          placeholder="Например: Очный приём"
          :disabled="loading || saving || togglingId !== null"
        />

        <div class="work-blocks-form__actions">
          <span class="work-blocks-form__label-spacer" aria-hidden="true">Действие</span>

          <AppButton
            type="submit"
            variant="primary"
            :loading="saving"
            :disabled="loading || saving || togglingId !== null || !canSubmit"
          >
            Добавить блок
          </AppButton>
        </div>
      </form>

      <div v-if="loading" class="state-text">
        Загружаем блоки работ...
      </div>

      <div v-else-if="!workBlocks.length" class="state-text">
        Для этого отряда пока нет блоков работ.
      </div>

      <div v-else class="work-blocks-table-wrapper">
        <div class="work-blocks-table">
          <div class="work-blocks-table__head">
            <span>Код</span>
            <span>Название</span>
            <span>Статус</span>
            <span class="text-end">Действия</span>
          </div>

          <div
            v-for="block in sortedWorkBlocks"
            :key="block.id"
            class="work-blocks-row"
            :class="{ 'work-blocks-row--inactive': block.is_active === false }"
          >
            <div class="work-blocks-cell" data-label="Код">
              <strong>{{ block.code }}</strong>
            </div>

            <div class="work-blocks-cell" data-label="Название">
              {{ block.name }}
            </div>

            <div class="work-blocks-cell" data-label="Статус">
              <AppStatusBadge
                :text="block.is_active === false ? 'Неактивен' : 'Активен'"
                :variant="block.is_active === false ? 'danger' : 'success'"
              />
            </div>

            <div class="work-blocks-cell work-blocks-cell--actions" data-label="Действия">
              <AppIconButton
                v-if="block.is_active !== false"
                icon="close"
                title="Деактивировать блок"
                variant="danger"
                :disabled="loading || saving || togglingId !== null"
                :loading="String(togglingId) === String(block.id)"
                @click="handleToggleWorkBlock(block)"
              />

              <AppIconButton
                v-else
                icon="check"
                title="Вернуть блок в работу"
                variant="primary"
                :disabled="loading || saving || togglingId !== null"
                :loading="String(togglingId) === String(block.id)"
                @click="handleToggleWorkBlock(block)"
              />
            </div>
          </div>
        </div>
      </div>
    </AppCard>

    <ConfirmModal ref="confirmModalRef" />
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'

import apiClient from '@/axios'

import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppIconButton from '@/components/ui/AppIconButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const props = defineProps({
  squadId: {
    type: [Number, String],
    required: true,
  },
})

const workBlocks = ref([])
const loading = ref(false)
const saving = ref(false)
const togglingId = ref(null)
const confirmModalRef = ref(null)

const form = reactive({
  code: '',
  name: '',
})

const alert = reactive({
  variant: 'info',
  message: '',
})

const canSubmit = computed(() => form.code.trim().length > 0 && form.name.trim().length > 0)

const sortedWorkBlocks = computed(() => {
  return [...workBlocks.value].sort((a, b) => {
    const activeDiff = Number(b.is_active !== false) - Number(a.is_active !== false)

    if (activeDiff !== 0) {
      return activeDiff
    }

    return String(a.code || '').localeCompare(String(b.code || ''), 'ru')
  })
})

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data

  if (typeof data?.detail === 'string') return data.detail
  if (typeof data?.message === 'string') return data.message

  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0]

    if (Array.isArray(firstValue) && firstValue.length) return firstValue.join(' ')
    if (typeof firstValue === 'string') return firstValue
  }

  return fallback
}

function showAlert(variant, message) {
  alert.variant = variant
  alert.message = message
}

function clearAlert() {
  alert.message = ''
}

function resetForm() {
  form.code = ''
  form.name = ''
}

async function fetchWorkBlocks() {
  if (!props.squadId) {
    workBlocks.value = []
    return
  }

  loading.value = true

  try {
    const response = await apiClient.get('/api/v1/rosters/work-blocks/', {
      params: {
        squad: props.squadId,
        include_inactive: true,
      },
    })

    workBlocks.value = normalizeListResponse(response.data)
  } catch (error) {
    workBlocks.value = []
    showAlert('danger', getErrorMessage(error, 'Не удалось загрузить блоки работ'))
  } finally {
    loading.value = false
  }
}

async function handleCreateWorkBlock() {
  if (!canSubmit.value || saving.value) return

  const code = form.code.trim().toUpperCase()
  const name = form.name.trim()

  const confirmed = await confirmModalRef.value.open({
    title: 'Добавить блок работ?',
    message: `Будет создан блок “${code} · ${name}” для текущего отряда.`,
  })

  if (!confirmed) return

  saving.value = true

  try {
    await apiClient.post('/api/v1/rosters/work-blocks/', {
      squad: Number(props.squadId),
      code,
      name,
      is_active: true,
    })

    resetForm()
    await fetchWorkBlocks()
    showAlert('success', 'Блок работ добавлен')
  } catch (error) {
    showAlert('danger', getErrorMessage(error, 'Не удалось добавить блок работ'))
  } finally {
    saving.value = false
  }
}

async function handleToggleWorkBlock(block) {
  if (!block?.id || togglingId.value !== null) return

  const nextActive = block.is_active === false
  const actionText = nextActive ? 'вернуть в работу' : 'деактивировать'
  const resultText = nextActive ? 'Блок работ активирован' : 'Блок работ деактивирован'

  const confirmed = await confirmModalRef.value.open({
    title: nextActive ? 'Вернуть блок в работу?' : 'Деактивировать блок работ?',
    message: nextActive
      ? `Блок “${block.code} · ${block.name}” снова будет доступен при настройке графиков.`
      : `Блок “${block.code} · ${block.name}” больше не будет отображаться в списках выбора для новых графиков.`,
  })

  if (!confirmed) return

  togglingId.value = block.id

  try {
    await apiClient.patch(`/api/v1/rosters/work-blocks/${block.id}/`, {
      is_active: nextActive,
    })

    await fetchWorkBlocks()
    showAlert('success', resultText)
  } catch (error) {
    showAlert('danger', getErrorMessage(error, `Не удалось ${actionText} блок работ`))
  } finally {
    togglingId.value = null
  }
}

watch(
  () => props.squadId,
  () => {
    fetchWorkBlocks()
  },
  { immediate: true },
)
</script>

<style scoped>
.work-blocks-manage {
  display: grid;
  gap: 1rem;
}

.work-blocks-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.work-blocks-header h2 {
  margin: 0;
  color: var(--text-color);
}

.work-blocks-header p,
.state-text {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}

.work-blocks-form {
  display: grid;
  grid-template-columns: minmax(140px, 180px) minmax(220px, 1fr) max-content;
  gap: 0.75rem;
  align-items: start;
  margin-bottom: 1rem;
}

.work-blocks-form__actions {
  display: grid;
  gap: 0.35rem;
  justify-items: end;
  align-items: start;
}

.work-blocks-form__label-spacer {
  visibility: hidden;
  min-height: 1.15rem;
  font-size: 0.85rem;
  line-height: 1.2;
  font-weight: 600;
}

.work-blocks-table-wrapper {
  overflow-x: auto;
}

.work-blocks-table {
  display: grid;
  min-width: 720px;
}

.work-blocks-table__head,
.work-blocks-row {
  display: grid;
  grid-template-columns: 140px minmax(240px, 1fr) 140px 96px;
  gap: 0.75rem;
  align-items: center;
}

.work-blocks-table__head {
  padding-bottom: 0.45rem;
  border-bottom: 1px solid var(--card-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.work-blocks-row {
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--card-border);
}

.work-blocks-row:last-child {
  border-bottom: 0;
}

.work-blocks-row--inactive {
  color: var(--text-muted);
}

.work-blocks-cell {
  min-height: 36px;
  display: flex;
  align-items: center;
  min-width: 0;
}

.work-blocks-cell--actions {
  justify-content: flex-end;
}

.text-end {
  text-align: right;
}

.squad-controls :deep(.btn),
.squad-controls :deep(input),
.squad-controls :deep(select),
.squad-controls :deep(.app-select__trigger),
.squad-controls :deep(.select-trigger) {
  min-height: 36px;
  height: 36px;
  font-size: 0.85rem;
}

.squad-controls :deep(.btn) {
  padding: 0.4rem 0.8rem;
  box-shadow: none;
}

@media (max-width: 760px) {
  .work-blocks-header {
    flex-direction: column;
  }

  .work-blocks-form {
    grid-template-columns: 1fr;
  }

  .work-blocks-form__actions {
    justify-items: flex-start;
  }

  .work-blocks-form__label-spacer {
    display: none;
  }

  .work-blocks-table {
    min-width: 0;
  }

  .work-blocks-table__head {
    display: none;
  }

  .work-blocks-row {
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }

  .work-blocks-cell {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    gap: 0.75rem;
  }

  .work-blocks-cell::before {
    content: attr(data-label);
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .work-blocks-cell--actions {
    justify-content: stretch;
  }
}
</style>
