import { usePageRule } from '@/composables/usePageRule'

/**
 * Recept-nyomtatás @page szabálya — A4 portrait, 14 mm margók, oldalszám
 * a jobb-alsó margin-boxban (Chromium támogatja). A komponens scope-jához
 * kötött, így csak akkor aktív, ha a recept-részletező nézet él.
 */
export function useRecipePrint() {
  usePageRule(`
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 9pt;
        color: #555;
      }
    }
  `)

  function triggerPrint() {
    window.print()
  }

  return { triggerPrint }
}
