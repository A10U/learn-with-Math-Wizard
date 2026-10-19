// Keep analytics optional: a blocked or unavailable tracker must never stop a game.
function send(event) {
  try {
    globalThis.window?.goatcounter?.count?.(event);
  } catch {
    // Gameplay does not depend on the analytics service.
  }
}

function trackGameEvent(action, mode) {
  const event = {
    path: `game-${action}-${mode}`,
    title: `Game ${action}: ${mode}`,
    event: true,
    // Count each round, including repeated rounds played in the same visit.
    no_session: true,
  };
  if (typeof globalThis.window?.goatcounter?.count === 'function') {
    send(event);
    return;
  }
  // Preserve early starts while the async script is still loading.
  globalThis.document?.getElementById?.('goatcounter-script')?.addEventListener?.('load', () => send(event), { once: true });
}

export function trackGameStart(mode) { trackGameEvent('start', mode); }
export function trackGameComplete(mode) { trackGameEvent('complete', mode); }
