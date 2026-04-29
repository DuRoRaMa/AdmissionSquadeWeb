<template>
  <AppCard class="schedule-create-card">
    <template #header>
      <div class="card-heading">
        <div>
          <h2>Новый график</h2>
          <p>
            Выберите отряд и закрытую форму доступности. Период и время смен будут взяты из выбранной формы.
          </p>
        </div>
      </div>
    </template>

    <form class="schedule-form schedule-controls" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="field-block">
          <label class="field-label">Отряд</label>
          <AppSelect
            v-model="form.squad"
            :options="squadOptions"
            placeholder="Выберите отряд"
            :disabled="loading || saving"
            required
            @update:model-value="handleSquadChange"
          />
          <p class="field-hint">
            {{ selectedSquadName || 'Сначала выберите отряд для графика' }}
          </p>
        </div>

        <div class="field-block">
          <label class="field-label">Форма доступности</label>
          <AppSelect
            v-model="form.availabilityForm"
            :options="availabilityFormOptions"
            placeholder="Выберите форму"
            :disabled="!form.squad || loading || saving"
            required
            @update:model-value="handleAvailabilityFormChange"
          />
          <p class="field-hint">
            {{ selectedAvailabilityFormText || 'Будут показаны только закрытые формы выбранного отряда' }}
          </p>
        </div>

        <div class="field-block">
          <AppInput
            v-model="form.title"
            label="Название графика"
            placeholder="Например: График на апрель"
            :disabled="loading || saving"
            required
          />
          <p class="field-hint">
            Название будет отображаться в списке графиков.
          </p>
        </div>
      </div>

      <div v-if="selectedAvailabilityForm" class="selected-form-info">
        <span>Период работы: {{ formatDate(selectedAvailabilityForm.period_start) }} — {{ formatDate(selectedAvailabilityForm.period_end) }}</span>
        <span>Дней в форме: {{ selectedAvailabilityForm.days?.length || 0 }}</span>
      </div>

      <ScheduleNeedsEditor
        v-model="needs"
        :availability-form="selectedAvailabilityForm"
        :work-blocks="filteredWorkBlocks"
        :disabled="!selectedAvailabilityForm || loading || saving"
      />

      <div class="form-actions">
        <AppButton
          type="submit"
          variant="primary"
          :loading="saving"
          :disabled="loading || saving"
        >
          Создать график
        </AppButton>
      </div>
    </form>
  </AppCard>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ScheduleNeedsEditor from '@/components/schedules/ScheduleNeedsEditor.vue'

const props = defineProps({
  squads: {
    type: Array,
    default: () => [],
  },
  availabilityForms: {
    type: Array,
    default: () => [],
  },
  workBlocks: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['create', 'squad-change', 'validation-error'])

const form = reactive({
  squad: '',
  availabilityForm: '',
  title: '',
})

const needs = ref([])

const squadOptions = computed(() => props.squads.map((squad) => ({
  value: String(squad.id),
  label: squad.name,
})))

const selectedSquad = computed(() => props.squads.find(
  (squad) => String(squad.id) === String(form.squad),
) || null)

const selectedSquadName = computed(() => selectedSquad.value?.name || '')

const filteredAvailabilityForms = computed(() => {
  if (!form.squad) {
    return []
  }

  return props.availabilityForms
    .filter((item) => String(getEntityId(item.squad)) === String(form.squad))
    .filter((item) => item.status === 'closed')
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
})

const availabilityFormOptions = computed(() => filteredAvailabilityForms.value.map((item) => ({
  value: String(item.id),
  label: `${item.title} · ${formatDate(item.period_start)} — ${formatDate(item.period_end)}`,
})))

const selectedAvailabilityForm = computed(() => props.availabilityForms.find(
  (item) => String(item.id) === String(form.availabilityForm),
) || null)

const selectedAvailabilityFormText = computed(() => {
  if (!selectedAvailabilityForm.value) {
    return ''
  }

  return `${selectedAvailabilityForm.value.title} · ${formatDate(selectedAvailabilityForm.value.period_start)} — ${formatDate(selectedAvailabilityForm.value.period_end)}`
})

const filteredWorkBlocks = computed(() => {
  if (!form.squad) {
    return []
  }

  return props.workBlocks
    .filter((block) => block.is_active !== false)
    .filter((block) => String(getEntityId(block.squad)) === String(form.squad))
})

function getEntityId(value) {
  if (value && typeof value === 'object') {
    return value.id
  }

  return value
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

function normalizeTime(value) {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 5)
}

function getFormDays(availabilityForm) {
  return [...(availabilityForm?.days || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

function getShiftByKind(day, kind) {
  return (day?.shifts || []).find((shift) => shift.shift_kind === kind && shift.is_active !== false)
}

function createNeedRow() {
  return {
    localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    workBlock: '',
    primary: true,
    extra: false,
    requiredPeople: 1,
  }
}

function rebuildNeedsFromForm() {
  needs.value = [createNeedRow()]
}

function handleSquadChange(value) {
  form.squad = value
  form.availabilityForm = ''
  needs.value = []
  emit('squad-change', value)
}

function handleAvailabilityFormChange(value) {
  form.availabilityForm = value
  rebuildNeedsFromForm()

  if (!form.title && selectedAvailabilityForm.value?.title) {
    form.title = `График: ${selectedAvailabilityForm.value.title}`
  }
}

function buildNeedsPayload() {
  const availabilityForm = selectedAvailabilityForm.value

  if (!availabilityForm) {
    throw new Error('Выберите форму доступности')
  }

  const days = getFormDays(availabilityForm)
  const payload = []

  needs.value.forEach((row) => {
    if (!row.workBlock) {
      throw new Error('В каждой строке потребности нужно выбрать блок работ')
    }

    if (!row.primary && !row.extra) {
      throw new Error('В каждой строке потребности нужно выбрать хотя бы одну смену')
    }

    const requiredPeople = Number(row.requiredPeople)

    if (!Number.isFinite(requiredPeople) || requiredPeople < 1) {
      throw new Error('Количество людей в потребности должно быть больше нуля')
    }

    const selectedKinds = []

    if (row.primary) {
      selectedKinds.push('primary')
    }

    if (row.extra) {
      selectedKinds.push('extra')
    }

    days.forEach((day) => {
      selectedKinds.forEach((kind) => {
        const shift = getShiftByKind(day, kind)

        if (!shift) {
          return
        }

        payload.push({
          date: day.date,
          work_block: Number(row.workBlock),
          starts_at: normalizeTime(shift.starts_at),
          ends_at: normalizeTime(shift.ends_at),
          required_people: requiredPeople,
        })
      })
    })
  })

  return payload
}

function handleSubmit() {
  try {
    const title = form.title.trim()

    if (!form.squad) {
      throw new Error('Выберите отряд')
    }

    if (!form.availabilityForm) {
      throw new Error('Выберите форму доступности')
    }

    if (!title) {
      throw new Error('Введите название графика')
    }

    const payload = {
      squad: Number(form.squad),
      availability_form: Number(form.availabilityForm),
      title,
      needs: buildNeedsPayload(),
    }

    if (!payload.needs.length) {
      throw new Error('Добавьте хотя бы одну потребность')
    }

    emit('create', payload)
  } catch (error) {
    emit('validation-error', error.message || 'Проверьте заполнение графика')
  }
}
</script>

<style scoped>
.schedule-create-card {
  --schedule-control-height: 36px;
}

.card-heading h2 {
  margin: 0;
  color: var(--text-color);
}

.card-heading p {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}

.schedule-form {
  display: grid;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;
}

.field-block {
  display: grid;
  gap: 0.35rem;
  align-content: start;
}

.field-label {
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: 600;
}

.field-hint {
  min-height: 1.2rem;
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
}

.selected-form-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.schedule-controls :deep(.btn),
.schedule-controls :deep(input),
.schedule-controls :deep(select),
.schedule-controls :deep(.app-select__trigger),
.schedule-controls :deep(.select-trigger) {
  min-height: var(--schedule-control-height);
  height: var(--schedule-control-height);
  font-size: 0.85rem;
}

.schedule-controls :deep(.btn) {
  padding: 0.4rem 0.8rem;
  box-shadow: none;
}

.schedule-controls :deep(.app-select),
.schedule-controls :deep(.select-wrapper) {
  width: 100%;
  max-width: none;
}

@media (max-width: 992px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
