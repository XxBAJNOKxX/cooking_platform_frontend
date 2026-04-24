<!-- Eszköz kártya skeleton loading placeholder. -->

<script setup>
defineProps({
  index: { type: Number, default: 0 },
})
</script>

<template>
  <div class="tskel-card" :style="{ '--skel-delay': `${index * 45}ms` }">
    <div class="tskel-img" />
    <div class="tskel-body">
      <div class="tskel-line tskel-title" />
      <div class="tskel-line tskel-loc" />
      <div class="tskel-foot">
        <div class="tskel-price" />
        <div class="tskel-owner" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tskel-card {
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1.5px solid var(--color-stroke);
  background: var(--color-bg);
  overflow: hidden;
  animation: tskelIn 250ms var(--ease-ui-out) var(--skel-delay, 0ms) both;
}

@keyframes tskelIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.tskel-line,
.tskel-img,
.tskel-price,
.tskel-owner {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-hover) 40%,
    var(--color-surface) 80%
  );
  background-size: 400% 100%;
  animation: tskelShimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}

.tskel-img {
  aspect-ratio: 3 / 2;
  border-radius: 0;
  animation-delay: var(--skel-delay, 0ms);
}

.tskel-body {
  padding: 0.875rem 0.95rem 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.tskel-line {
  height: 13px;
}
.tskel-title {
  width: 78%;
  animation-delay: calc(var(--skel-delay, 0ms) + 60ms);
}
.tskel-loc {
  width: 55%;
  height: 11px;
  animation-delay: calc(var(--skel-delay, 0ms) + 100ms);
}

.tskel-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.25rem;
}

.tskel-price {
  height: 1.75rem;
  width: 5.5rem;
  border-radius: 0.45rem;
  animation-delay: calc(var(--skel-delay, 0ms) + 140ms);
}
.tskel-owner {
  height: 12px;
  width: 4rem;
  animation-delay: calc(var(--skel-delay, 0ms) + 180ms);
}

@keyframes tskelShimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
