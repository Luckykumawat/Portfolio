/** Independent sprite controller for custom portfolio characters.
 * No dependencies; does not import or reuse the page-mascot controller.
 * Both atlases: 3 columns x 3 rows, directions in reading order.
 */
export function directionIndex(dx, dy, radius = 45) {
  if (Math.hypot(dx, dy) <= radius) return 4;
  // Quantize each axis relative to the dominant axis; diagonal starts at 22.5°.
  const threshold = Math.max(Math.abs(dx), Math.abs(dy)) * (Math.SQRT2 - 1);
  const x = Math.abs(dx) >= threshold ? Math.sign(dx) : 0;
  const y = Math.abs(dy) >= threshold ? Math.sign(dy) : 0;
  return (y + 1) * 3 + x + 1;
}

export const EXPRESSION_NAMES = Object.freeze([
  'blink', 'happy', 'surprised', 'heart', 'wink', 'proud', 'sleepy', 'dizzy', 'laugh'
]);

export function attachCustomMascot(button, { directions, reactions, label = 'character' }) {
  if (!(button instanceof HTMLButtonElement)) throw new TypeError('A button element is required.');
  if (!directions || !reactions) throw new TypeError('Both sprite sheet URLs are required.');
  const listeners = new AbortController();
  const pointerDevice = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sprite = document.createElement('span');
  sprite.className = 'custom-mascot-sprite';
  sprite.setAttribute('aria-hidden', 'true');
  button.append(sprite);
  button.type = 'button';
  button.classList.add('custom-mascot');
  button.setAttribute('aria-label', `Change ${label}'s expression`);
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  let disposed = false;
  let pointer = null;
  let frame = 0;
  let restoreTimer;
  let expression = -1;
  let nextExpression = 0;
  let bounce;
  let loaded = false;
  const images = [];

  function paint(index, url) {
    sprite.style.backgroundImage = `url(${JSON.stringify(url)})`;
    sprite.style.backgroundPosition = `${index % 3 * 50}% ${Math.floor(index / 3) * 50}%`;
  }
  function facePointer() {
    frame = 0;
    if (!loaded || expression !== -1 || disposed) return;
    const box = button.getBoundingClientRect();
    const index = pointerDevice.matches && pointer
      ? directionIndex(pointer.x - box.left - box.width / 2, pointer.y - box.top - box.height / 2)
      : 4;
    paint(index, directions);
  }
  function schedule() {
    if (!frame && !disposed) frame = requestAnimationFrame(facePointer);
  }
  function listen(target, event, handler) {
    target.addEventListener(event, handler, { passive: true, signal: listeners.signal });
  }
  listen(window, 'pointermove', event => {
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  });
  listen(window, 'scroll', schedule);
  listen(window, 'resize', schedule);
  listen(document.documentElement, 'pointerleave', () => { pointer = null; schedule(); });
  listen(pointerDevice, 'change', schedule);

  function showExpression(index) {
    if (!Number.isInteger(index) || index < 0 || index > 8) throw new RangeError('Expression must be an integer from 0 to 8.');
    if (!loaded || disposed) return;
    clearTimeout(restoreTimer);
    expression = index;
    paint(index, reactions);
    button.dataset.expression = EXPRESSION_NAMES[index];
    restoreTimer = setTimeout(() => {
      expression = -1;
      delete button.dataset.expression;
      facePointer();
    }, 900);
    bounce?.cancel();
    if (!reducedMotion.matches && sprite.animate) {
      bounce = sprite.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(-6px)', offset: 0.35 },
        { transform: 'translateY(0)' }
      ], { duration: 240, easing: 'ease-out' });
    }
  }
  listen(button, 'click', () => {
    showExpression(nextExpression);
    nextExpression = (nextExpression + 1) % EXPRESSION_NAMES.length;
  });
  listen(reducedMotion, 'change', () => { if (reducedMotion.matches) bounce?.cancel(); });

  // Retain both decoded atlases for immediate expression switching.
  const ready = Promise.all([directions, reactions].map(url => new Promise((resolve, reject) => {
    const image = new Image();
    images.push(image);
    image.onload = () => {
      if (image.naturalWidth !== image.naturalHeight || image.naturalWidth % 3 !== 0) {
        reject(new Error('Sprite sheets must be square, with dimensions divisible by three.'));
      } else resolve();
    };
    image.onerror = () => reject(new Error(`Could not load sprite sheet: ${url}`));
    image.src = url;
  }))).then(() => {
    if (disposed) return;
    loaded = true;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    facePointer();
  }).catch(error => {
    if (!disposed) {
      button.removeAttribute('aria-busy');
      button.setAttribute('aria-label', `${label} artwork unavailable`);
      button.dataset.loadError = 'true';
    }
    throw error;
  });
  return {
    ready,
    showExpression,
    destroy() {
      disposed = true;
      listeners.abort();
      cancelAnimationFrame(frame);
      clearTimeout(restoreTimer);
      bounce?.cancel();
      sprite.remove();
      button.classList.remove('custom-mascot');
      button.removeAttribute('aria-busy');
      delete button.dataset.expression;
      delete button.dataset.loadError;
      button.disabled = true;
    }
  };
}
