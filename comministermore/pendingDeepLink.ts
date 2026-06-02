let pendingUrl: string | null = null;

/** Called from native/background handlers before React mounts. */
export function enqueueDeepLink(url: string): void {
  if (url.length > 0) {
    pendingUrl = url;
  }
}

/** Consume a deep link queued for the JS layer (e.g. after cold start). */
export function dequeueDeepLink(): string | null {
  const next = pendingUrl;
  pendingUrl = null;
  return next;
}
