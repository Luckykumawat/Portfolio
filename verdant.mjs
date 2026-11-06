import { attachCustomMascot } from './custom-mascot.mjs';

const button = document.querySelector('#verdant-mascot');
const status = document.querySelector('#verdant-status');
if (button && status) {
  const verdant = attachCustomMascot(button, {
    directions: 'mascots/verdant-directions.png',
    reactions: 'mascots/verdant-reactions.png',
    label: 'Verdant'
  });
  verdant.ready.then(() => {
    button.hidden = false;
    status.hidden = true;
  }).catch(() => {
    status.textContent = 'Verdant could not load. Please refresh to try again.';
  });
  window.addEventListener('pagehide', event => {
    // Keep the controller intact when the browser caches this page for back navigation.
    if (!event.persisted) verdant.destroy();
  });
}
