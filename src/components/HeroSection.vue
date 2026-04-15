<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import CategoryCarousel from './CategoryCarousel.vue'

const router = useRouter()
const searchTerm = ref('')

const heroImage = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1600&q=80'

const heroStyle = computed(() => ({
	backgroundImage: `linear-gradient(115deg, rgba(47, 30, 23, 0.82) 0%, rgba(47, 30, 23, 0.55) 45%, rgba(47, 30, 23, 0.22) 100%), url('${heroImage}')`,
}))

const openRecipes = (query = '') => {
	const trimmedQuery = query.trim()

	router.push({
		name: 'recipes',
		query: trimmedQuery ? { search: trimmedQuery } : {},
	})
}

const handleSearch = () => {
	openRecipes(searchTerm.value)
}
</script>

<template>
	<section class="hero-wrap w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8">
		<div class="hero-panel relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-stroke/60 shadow-[0_30px_90px_-40px_rgba(47,30,23,0.55)]" :style="heroStyle">
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(233,105,44,0.22),transparent_30%)]" />
			<div class="relative grid gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:px-14 lg:py-20">
				<div class="flex flex-col justify-center max-w-2xl text-white">
					<p class="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur-sm">
						Friss inspiráció a konyhához
					</p>

					<h1 class="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
						Találd meg a következő kedvenc recepted
					</h1>

					<p class="mt-5 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
						Böngéssz és keress rá arra, amit ma főznél! Használd a keresőt, hogy gyorsan megtaláld a legjobb recepteket, vagy böngéssz a kategóriák között, hogy inspirációt meríts az alapanyagokból.
					</p>

					<form class="mt-8 flex flex-col gap-3 sm:flex-row" @submit.prevent="handleSearch">
						<div class="flex-1">
							<BaseInput
								v-model="searchTerm"
								type="search"
								placeholder="Pl. lasagne, csirke, desszert"
								class="hero-input"
							/>
						</div>

						<BaseButton type="submit" size="lg" rounded="full" class="min-w-[140px]">
							Keresés
						</BaseButton>
					</form>

					<div class="mt-4 flex flex-col gap-3 sm:flex-row">
						<BaseButton variant="secondary" size="lg" rounded="full" @click="openRecipes()">
							Receptek böngészése
						</BaseButton>

						<BaseButton variant="secondary" size="lg" rounded="full" @click="router.push({ name: 'login' })">
							Bejelentkezés
						</BaseButton>
					</div>
				</div>

				<aside class="flex items-end lg:justify-end">
					<div class="w-full max-w-md rounded-[1.75rem] border border-white/15 bg-white/12 p-4 text-white shadow-[0_20px_60px_-32px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-5">
						<p class="text-xs font-semibold uppercase tracking-[0.26em] text-white/70">
							<span class="block text-yellow-200">Mai ajánló:</span>
							Sült csirke sült paradicsommal és friss bazsalikommal.
						</p>

						<div class="mt-4 overflow-hidden rounded-[1.35rem] border border-white/15 bg-black/20">
							<img
								src="/kaja.jpg"
								alt="Friss etel foto a fooldali hero szekcioban"
								class="h-[320px] w-full object-cover sm:h-[360px]"
							/>
						</div>

						<div class="mt-4 grid gap-3 sm:grid-cols-2">
							<div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
								<p class="text-xs uppercase tracking-[0.22em] text-white/65">Gyors keresés</p>
								<p class="mt-2 text-sm text-white/88">Írd be, amit főznél, és ugorj rögtön a receptekhez.</p>
							</div>

							<div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
								<p class="text-xs uppercase tracking-[0.22em] text-white/65">Tipp</p>
								<p class="mt-2 text-sm text-white/88">Próbáld ki a legújabb recepteket!</p>
							</div>
						</div>
					</div>
				</aside>
			</div>
		</div>
	</section>

	<CategoryCarousel />
</template>

<style scoped>
.hero-input :deep(input) {
	background: rgba(255, 255, 255, 0.88);
	border-color: rgba(255, 255, 255, 0.28);
	color: var(--color-text);
}

.hero-input :deep(input::placeholder) {
	color: rgba(122, 95, 81, 0.86);
}

.hero-input :deep(input:focus) {
	box-shadow: 0 0 0 1px rgba(255, 179, 107, 0.7);
}
</style>
