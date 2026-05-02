<!-- Nyitóoldal — hero + gyors akciók (auth) + népszerű kategóriák. -->

<script setup>
import HeroSection from '@/components/HeroSection.vue'
import CategoryCarousel from '@/components/CategoryCarousel.vue'
import QuickActions from '@/components/QuickActions.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <HeroSection />
  <QuickActions v-if="authStore.isAuthenticated" />
  <CategoryCarousel />
</template>
