<template>
  <div class="card">
    <h2><span>{{ icon }}</span> {{ title }}</h2>
    <div class="card-content">
      <template v-for="(item, index) in items" :key="index">
        <!-- Строка -->
        <p v-if="typeof item === 'string'">{{ item }}</p>
        <!-- Объект с label и value -->
        <p v-else-if="item.label && item.value !== undefined">
          <strong>{{ item.label }}</strong> {{ item.value }}
        </p>
        <!-- Объект с icon и text -->
        <p v-else-if="item.icon && item.text">
          <span>{{ item.icon }}</span> {{ item.text }}
        </p>
        <!-- Объект только с text -->
        <p v-else-if="item.text">{{ item.text }}</p>
        <!-- Запасной вариант -->
        <p v-else>{{ item }}</p>
      </template>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '📄'
  },
  items: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #eef2f6;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 8px 20px -12px rgba(0, 0, 0, 0.08);
  transition: all 0.1s;
}

.card:hover {
  box-shadow: 0 16px 28px -12px rgba(0, 80, 200, 0.15);
  border-color: #d9e2ef;
}

.card h2 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 18px;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 2px solid #f1f4f9;
  padding-bottom: 12px;
}

.card h2 span {
  font-size: 1.5rem;
}

.card-content p {
  font-size: 0.98rem;
  color: #334155;
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.card-content p strong {
  font-weight: 600;
  color: #0f172a;
  min-width: 100px;
}

.card-footer {
  margin-top: 12px;
  border-top: 1px dashed #edf2f7;
  padding-top: 12px;
  font-size: 0.95rem;
}
</style>