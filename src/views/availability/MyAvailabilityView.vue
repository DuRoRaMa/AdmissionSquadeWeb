<script setup>
import { onMounted, ref, computed } from 'vue'
import AppCard from '@/components/AppCard.vue'
import { useAvailabilityStore } from '@/stores/availability'

const availabilityStore = useAvailabilityStore()
const answers = ref({})

onMounted(async () => {
  await availabilityStore.fetchActiveForm()
})

function setAnswer(shiftId, value) {
  answers.value[shiftId] = value
}

const preparedSlots = computed(() => {
  return Object.entries(answers.value).map(([shiftId, isAvailable]) => ({
    shift_id: Number(shiftId),
    is_available: isAvailable,
    comment: ''
  }))
})

async function submit() {
  if (!availabilityStore.activeForm) return
  const result = await availabilityStore.submitForm(
    availabilityStore.activeForm.id,
    preparedSlots.value
  )
  alert(result.message)
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Моя доступность</template>

      <div v-if="availabilityStore.isLoading">Загрузка...</div>

      <div v-else-if="!availabilityStore.activeForm" class="muted-state">
        Сейчас нет открытой формы доступности.
      </div>

      <div v-else class="availability-layout">
        <div class="form-meta">
          <div><strong>Форма:</strong> {{ availabilityStore.activeForm.title }}</div>
          <div>
            <strong>Период:</strong>
            {{ availabilityStore.activeForm.period_start }} — {{ availabilityStore.activeForm.period_end }}
          </div>
        </div>

        <div
          v-for="day in availabilityStore.activeForm.days"
          :key="day.id"
          class="day-block"
        >
          <div class="day-title">{{ day.date }}</div>

          <label
            v-for="shift in day.shifts"
            :key="shift.id"
            class="shift-row"
          >
            <input
              type="checkbox"
              :checked="answers[shift.id] || false"
              @change="setAnswer(shift.id, $event.target.checked)"
            />
            <span>
              {{ shift.title || (shift.shift_kind === 'primary' ? 'Основная смена' : 'Дополнительная смена') }}
              <span v-if="shift.starts_at && shift.ends_at" class="shift-time">
                ({{ shift.starts_at }} — {{ shift.ends_at }})
              </span>
            </span>
          </label>
        </div>

        <button class="submit-btn" @click="submit">Отправить форму</button>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.availability-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-color);
}

.day-block {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: var(--card-border);
}

.day-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 12px;
}

.shift-row {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--text-color);
  margin-bottom: 10px;
}

.shift-time {
  color: var(--text-muted);
}

.submit-btn {
  align-self: flex-start;
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  background: var(--accent-gradient);
  color: white;
  font-weight: 600;
}

.muted-state {
  color: var(--text-muted);
}
</style>