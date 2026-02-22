<template>
  <div class="card shadow">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer text-muted">
      <slot name="footer" />
    </div>
  </div>
</template>
<style scoped>
.card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  border: var(--card-border);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
  background: var(--card-bg-solid);
}
.card-header {
  padding: var(--card-padding);
  background: var(--header-footer-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--text-color);
}
.card-header::after {
  content: '';
  display: block;
  width: 100%;
  height: 3px;
  background: var(--accent-gradient);
  border-radius: 3px;
  margin-top: 0.5rem;
}
.card-body {
  padding: var(--card-padding);
  color: var(--text-color);
  line-height: 1.6;
}
.card-footer {
  padding: calc(var(--card-padding) * 0.8) var(--card-padding);
  background: var(--header-footer-bg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  font-size: 0.9rem;
}
.card-footer button,
.card-footer .btn {
  background: var(--accent-gradient);
  border: none;
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 50px;
  font-weight: 500;
  transition: opacity 0.2s;
}
.card-footer button:hover,
.card-footer .btn:hover {
  opacity: 0.9;
  cursor: pointer;
}
.card-enter-active,
.card-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>