import { attachCustomMascot } from './custom-mascot.mjs';

const controllers = [];
const initialized = new WeakSet();
function load(button) {
  if (initialized.has(button)) return;
  initialized.add(button);
  const { original: id, label } = button.dataset;
  const status = button.closest('.mascot-card').querySelector('.mascot-load-status');
  const extension = id === 'verdant' ? 'png' : 'webp';
  const controller = attachCustomMascot(button, {
    directions: `mascots/${id}-directions.${extension}`,
    reactions: `mascots/${id}-reactions.${extension}`,
    label
  });
  controllers.push(controller);
  controller.ready.then(() => {
    button.hidden = false;
    status.hidden = true;
  }).catch(() => {
    status.textContent = `${label} could not load. Please refresh to try again.`;
  });
}

// Observe the visible cards, since their buttons stay hidden until artwork is ready.
const buttons = document.querySelectorAll('[data-original]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      load(entry.target.querySelector('[data-original]'));
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '240px' });
  buttons.forEach(button => observer.observe(button.closest('.mascot-card')));
  window.addEventListener('pagehide', event => { if (!event.persisted) observer.disconnect(); });
} else buttons.forEach(load);

window.addEventListener('pagehide', event => {
  if (!event.persisted) controllers.forEach(controller => controller.destroy());
});
