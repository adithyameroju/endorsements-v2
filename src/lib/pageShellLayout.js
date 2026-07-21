/**
 * Shared layout tokens for portal page shells (scroll root under Layout main).
 * See `.cursor/rules/employer-portal-ui-shell.mdc` § Page shell padding.
 */

/** Horizontal gutter on every user-facing page / sub-page scroll root. */
export const PORTAL_PAGE_SECTION_GUTTER = 'px-6 lg:px-8'

/**
 * Standard vertical padding — matches CD Balance Enterprise (`py-6` = 24px top + bottom).
 * Use on module landings, tool pages, and inner sub-pages with PageHeader.
 */
export const PORTAL_PAGE_SECTION_PADDING_Y = 'py-6'

/** Top-only padding for multi-step flows that use a sticky footer (`pb-0` on scroll root). */
export const PORTAL_PAGE_WIZARD_PADDING_TOP = 'pt-6'

/**
 * Default scroll root for tool-style pages (Claims, Policy coverage, CD Balance, etc.).
 * Combine with overflow variant as needed (`overflow-hidden` vs `overflow-y-auto`).
 */
export const PORTAL_PAGE_SHELL_PADDING = `${PORTAL_PAGE_SECTION_GUTTER} ${PORTAL_PAGE_SECTION_PADDING_Y}`

/** Wizard / step flow scroll root — same top spacing as CD Balance; no bottom padding on shell. */
export const PORTAL_PAGE_WIZARD_SHELL_PADDING = `${PORTAL_PAGE_SECTION_GUTTER} ${PORTAL_PAGE_WIZARD_PADDING_TOP} pb-0`
