/**
 * Utility to synchronize playground store parameters with URL search params client-side.
 * Compatible with Next.js static exports.
 */

export function getUrlParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function setUrlParam(key: string, value: string | null | number) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  
  if (value === null || value === undefined || value === "") {
    params.delete(key);
  } else {
    params.set(key, String(value));
  }
  
  const newSearch = params.toString();
  const newUrl = `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`;
  
  // Update browser address bar without page reload
  window.history.replaceState(null, "", newUrl);
}
