/**
 * Minimal layout for the public share page.
 *
 * Reasoning: share-link recipients are not necessarily existing users —
 * they're seeing the product for the first time. We hide the global
 * SettingsMenu (which is for the dream owner's own session) so the page
 * reads as a clean shareable artifact. The root layout still wraps this
 * with theme + font + analytics.
 */
export default function PublicDreamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
