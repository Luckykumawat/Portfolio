// Vanilla JavaScript adaptation of nilbuild/page-mascot (MIT).
(() => {
  const button = document.querySelector('.portfolio-mascot');
  if (!button) return;
  const directions = button.querySelector('.mascot-directions');
  const reactions = button.querySelector('.mascot-reactions');
  const squash = button.querySelector('.mascot-squash');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clockwise = [5, 8, 7, 6, 3, 0, 1, 2];
  const sectorSize = Math.PI / 4;
  let sector = -1;
  let pointer;
  let timers = [];
  let count = 0;
  let lastBoop = 0;
  let animation;

  const cell = (layer, index) => {
    layer.style.backgroundPosition = `${index % 3 * 50}% ${Math.floor(index / 3) * 50}%`;
  };
  const react = index => {
    if (index !== null) cell(reactions, index);
    directions.style.opacity = index === null ? '1' : '0';
    reactions.style.opacity = index === null ? '0' : '1';
  };
  const aim = () => {
    if (!finePointer.matches || !pointer) {
      sector = -1;
      cell(directions, 4);
      return;
    }
    const box = button.getBoundingClientRect();
    const dx = pointer.x - box.left - box.width / 2;
    const dy = pointer.y - box.top - box.height / 2;
    if (Math.hypot(dx, dy) < 70) {
      sector = -1;
      cell(directions, 4);
      return;
    }
    const angle = Math.atan2(dy, dx);
    const delta = angle - sector * sectorSize;
    if (sector !== -1 && Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta))) < sectorSize / 2 + 0.12) return;
    sector = (Math.round(angle / sectorSize) + 8) % 8;
    cell(directions, clockwise[sector]);
  };

  // Reveal only after both atlases load; a missing asset leaves no broken control.
  Promise.all(['directions', 'reactions'].map(name => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = reject;
    image.src = `mascots/crt-${name}.webp`;
  }))).then(() => {
    button.hidden = false;
    document.querySelector('.mascot-caption').hidden = false;
    window.addEventListener('pointermove', event => {
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    }, { passive: true });
    window.addEventListener('scroll', aim, { passive: true });
    window.addEventListener('resize', aim, { passive: true });
    finePointer.addEventListener('change', aim);
    document.documentElement.addEventListener('pointerleave', () => { pointer = null; aim(); });
  }).catch(() => {});

  button.addEventListener('click', () => {
    timers.forEach(clearTimeout);
    timers = [];
    const now = Date.now();
    count = now - lastBoop < 1600 ? count + 1 : 1;
    lastBoop = now;
    if (count >= 4) {
      count = 0;
      react(7);
      timers.push(setTimeout(() => react(null), 1100));
    } else {
      react(0);
      const payoff = [1, 2, 8][count - 1];
      timers.push(setTimeout(() => react(payoff), 120));
      timers.push(setTimeout(() => react(null), 560));
    }
    animation?.cancel();
    if (!reducedMotion.matches && squash.animate) {
      animation = squash.animate([
        { transform: 'scale(1, 1)' },
        { transform: 'scale(1.10, 0.86)', offset: 0.18 },
        { transform: 'scale(0.95, 1.08)', offset: 0.45 },
        { transform: 'scale(1.03, 0.97)', offset: 0.72 },
        { transform: 'scale(1, 1)' }
      ], { duration: 420, easing: 'ease-in-out' });
    }
  });
})();
