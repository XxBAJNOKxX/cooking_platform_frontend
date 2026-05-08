## 2025-05-14 - Accessible and print-friendly interactive lists

**Learning:** Interactive list items (like recipe steps or shopping list items) implemented as `<li>` elements are not keyboard-accessible by default. They require `role="button"` (or `checkbox`), `tabindex="0"`, and explicit keyboard event handlers (`@keydown.enter.space`). Additionally, UX states like "done/checked" (opacity, line-through) should be reset in `@media print` to ensure the printed version remains highly legible.
**Action:** Always add ARIA roles, tab indices, and keyboard support to interactive list items, and verify print-specific style overrides for "checked" states.
