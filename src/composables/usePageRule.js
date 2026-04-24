import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Globális @page szabály injektálása a komponens mount-ja alatt (unmount-kor
 * eltávolítja) — nincs ütközés a különböző nézetek @page szabályai közt.
 */
export function usePageRule(cssText) {
  let styleEl = null

  onMounted(() => {
    styleEl = document.createElement('style')
    styleEl.setAttribute('data-page-rule', '')
    styleEl.textContent = cssText
    document.head.appendChild(styleEl)
  })

  onBeforeUnmount(() => {
    styleEl?.remove()
    styleEl = null
  })
}
