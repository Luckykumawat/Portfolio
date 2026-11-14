export function setupServicePreview(services, original) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = document.createElement('div');
  preview.id = original.id;
  preview.setAttribute('aria-hidden', 'true');
  const layers = [new Image(), new Image()];
  layers.forEach(image => { image.alt = ''; image.decoding = 'async'; preview.append(image); });
  original.remove();
  document.body.append(preview);
  let active = null, front = 0, version = 0, visible = false;
  let pointer = null, position = null, target = null, animation = 0, scrollFrame = 0;
  const images = new Map();
  function preload(url) {
    if (!images.has(url)) {
      const image = new Image();
      image.src = url;
      images.set(url, image.decode().then(() => true, () => false));
    }
    return images.get(url);
  }
  services.querySelectorAll('[data-preview]').forEach(row => {
    if (row.dataset.preview) preload(row.dataset.preview);
  });
  function hide() {
    version++;
    active = null;
    visible = false;
    preview.style.opacity = '0';
    cancelAnimationFrame(animation);
    animation = 0;
  }
  function animate() {
    animation = 0;
    if (!visible || !target) return;
    const blend = reduced.matches ? 1 : .24;
    position.x += (target.x - position.x) * blend;
    position.y += (target.y - position.y) * blend;
    preview.style.transform = `translate3d(${position.x}px,${position.y}px,0)`;
    if (Math.abs(target.x-position.x)+Math.abs(target.y-position.y) > .15) animation = requestAnimationFrame(animate);
  }
  function show(row, x, y) {
    const url = row?.dataset.preview;
    if (!url || !services.contains(row)) return hide();
    const size = Math.min(280, innerWidth-32, (innerHeight-32)*.75);
    target = {
      x: Math.max(16, Math.min(x+28, innerWidth-size-16)),
      y: Math.max(16, Math.min(y-size*2/3, innerHeight-size*4/3-16))
    };
    preview.style.width = `${size}px`;
    if (!visible) {
      position = {...target};
      preview.style.transform = `translate3d(${position.x}px,${position.y}px,0)`;
    }
    visible = true;
    if (!animation) animation = requestAnimationFrame(animate);
    if (active === row) return;
    active = row;
    const request = ++version;
    // Keep the current illustration visible until the next one is decoded.
    preload(url).then(ready => {
      if (request !== version) return;
      if (!ready) return hide();
      const next = 1-front;
      layers[next].src = url;
      layers[next].style.opacity = '1';
      layers[front].style.opacity = '0';
      front = next;
      preview.style.opacity = '1';
    });
  }
  function underPointer() {
    if (!pointer || !fine.matches) return;
    const row = document.elementFromPoint(pointer.x, pointer.y)?.closest('[data-preview]');
    show(row, pointer.x, pointer.y);
  }
  document.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType === 'touch') return;
    pointer = {x:event.clientX, y:event.clientY};
    underPointer();
  }, {passive:true});
  // Pointer coordinates stay fixed in the viewport while the page moves beneath them.
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (pointer && fine.matches) underPointer();
      else if (active && document.activeElement === active) {
        const rect = active.getBoundingClientRect();
        show(active, innerWidth-330, rect.top+rect.height/2);
      } else hide();
    });
  }, {passive:true, capture:true});
  document.documentElement.addEventListener('pointerleave', () => { pointer=null; hide(); });
  services.addEventListener('focusin', event => {
    const row = event.target.closest('[data-preview]');
    if (row) { const rect=row.getBoundingClientRect(); show(row,innerWidth-330,rect.top+rect.height/2); }
  });
  services.addEventListener('focusout', hide);
  services.addEventListener('click', event => {
    if (fine.matches) return;
    const row=event.target.closest('[data-preview]');
    if (!row || active===row) return hide();
    const rect=row.getBoundingClientRect();show(row,innerWidth-310,rect.bottom+130);
  });
  document.addEventListener('pointerdown', event => { if (!services.contains(event.target)) hide(); });
  document.addEventListener('keydown', event => { if (event.key==='Escape') hide(); });
  window.addEventListener('blur', () => {pointer=null;hide();});
  window.addEventListener('resize', underPointer);
}
