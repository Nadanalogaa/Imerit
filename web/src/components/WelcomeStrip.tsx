/**
 * Previously rendered a marketing strip at the very top of the landing
 * page. The strip was removed during a UI cleanup but the component is
 * still mounted in Landing.tsx, so keep it as an inert no-op rather
 * than editing every consumer. Remove the component + call site
 * together if this stays empty long-term.
 */
export function WelcomeStrip() {
 return null;
}
