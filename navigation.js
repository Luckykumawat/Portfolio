(() => {
  const button = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.portfolio-menu');
  if (!button || !menu) return;
  // Keep the toggle in the dialog's top layer so it also works with modal focus.
  const nav = button.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let closingTimer;
  const menuMascots = ['baby-directions-v3.webp', 'moss-capybara-directions.webp',
    'lumi-axolotl-directions.webp', 'puff-seal-directions.webp',
    'saffron-fennec-directions.webp', 'pebble-wombat-directions.webp', 'miso-bat-directions.webp'];
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  menu.querySelectorAll('.menu-links a').forEach((link, index) => {
    if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current', 'page');
    const label = link.textContent;
    link.setAttribute('aria-label', label);
    link.textContent = '';
    const mascot = document.createElement('button');
    mascot.type = 'button';
    mascot.className = 'menu-item-mascot';
    mascot.setAttribute('aria-label', `Change ${label} mascot expression`);
    mascot.style.backgroundImage = `url("mascots/${menuMascots[index]}")`;
    let bounce;
    const bounceMascot = () => {
      if (reduced.matches) return;
      bounce?.cancel();
      bounce = mascot.animate([
        {transform:'translateY(0) scale(1)'},
        {transform:'translateY(2px) scale(1.08,.9)',offset:.15},
        {transform:'translateY(-10px) scale(.96,1.04)',offset:.42},
        {transform:'translateY(0) scale(1.05,.94)',offset:.72},
        {transform:'translateY(-3px) scale(1)',offset:.86},
        {transform:'translateY(0) scale(1)'}
      ], {duration:520,easing:'ease-out'});
    };
    link.addEventListener('pointerenter', bounceMascot);
    link.addEventListener('focus', bounceMascot);
    const text = document.createElement('span');
    text.className = 'menu-item-label';
    const row = document.createElement('div');
    row.className = 'menu-row';
    link.before(row);
    row.append(mascot, link);
    link.append(text);
    mascot.addEventListener('pointerenter', bounceMascot);
    mascot.addEventListener('focus', bounceMascot);
    let expression = 0;
    let restoreExpression;
    const directions = `mascots/${menuMascots[index]}`;
    const reactions = directions.replace('-directions', '-reactions');
    const reactionImage = new Image();
    reactionImage.src = reactions;
    mascot.addEventListener('click', () => {
      clearTimeout(restoreExpression);
      mascot.dataset.reacting = 'true';
      mascot.style.backgroundImage = `url("${reactions}")`;
      mascot.style.backgroundPosition = `${expression % 3 * 50}% ${Math.floor(expression / 3) * 50}%`;
      expression = (expression + 1) % 9;
      bounceMascot();
      restoreExpression = setTimeout(() => {
        delete mascot.dataset.reacting;
        mascot.style.backgroundImage = `url("${directions}")`;
        mascot.style.backgroundPosition = '50% 50%';
      }, 1300);
    });
    [...label].forEach((letter, i) => {
      const wrapper = document.createElement('span');
      wrapper.className = 'menu-letter';
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.style.setProperty('--i', i);
      wrapper.style.setProperty('--group', i % 3);
      for (let j = 0; j < 2; j++) {
        const span = document.createElement('span');
        span.textContent = letter === ' ' ? '\u00a0' : letter;
        wrapper.append(span);
      }
      text.append(wrapper);
    });
  });
  let mascotFrame = 0;
  let mascotPointer;
  menu.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reduced.matches) return;
    mascotPointer = {x:event.clientX, y:event.clientY};
    if (mascotFrame) return;
    mascotFrame = requestAnimationFrame(() => {
      mascotFrame = 0;
      menu.querySelectorAll('.menu-item-mascot').forEach(mascot => {
        if (mascot.dataset.reacting) return;
        const box = mascot.getBoundingClientRect();
        const dx = mascotPointer.x - box.left - box.width / 2;
        const dy = mascotPointer.y - box.top - box.height / 2;
        const threshold = Math.max(Math.abs(dx), Math.abs(dy)) * (Math.SQRT2 - 1);
        const near = Math.hypot(dx,dy) <= 35;
        const column = near ? 1 : 1 + (Math.abs(dx) >= threshold ? Math.sign(dx) : 0);
        const row = near ? 1 : 1 + (Math.abs(dy) >= threshold ? Math.sign(dy) : 0);
        mascot.style.backgroundPosition = `${column * 50}% ${row * 50}%`;
      });
    });
  });
  menu.addEventListener('pointerleave', () => {
    cancelAnimationFrame(mascotFrame);
    mascotFrame = 0;
    menu.querySelectorAll('.menu-item-mascot').forEach(mascot => {
      if (!mascot.dataset.reacting) mascot.style.backgroundPosition = '50% 50%';
    });
  });
  function close() {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open menu');
    menu.classList.remove('is-open');
    closingTimer = setTimeout(() => {
      menu.close(); nav.append(button);
      document.documentElement.classList.remove('menu-scroll-lock');
      button.focus({preventScroll:true});
    }, reduced.matches ? 0 : 800);
  }
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-expanded') === 'true') return close();
    clearTimeout(closingTimer);
    const rect = button.getBoundingClientRect();
    menu.style.setProperty('--menu-x', `${rect.left + rect.width / 2}px`);
    menu.style.setProperty('--menu-y', `${rect.top + rect.height / 2}px`);
    menu.append(button);
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Close menu');
    document.documentElement.classList.add('menu-scroll-lock');
    menu.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
  });
  menu.addEventListener('cancel', event => { event.preventDefault(); close(); });
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || reduced.matches) return;
  const dots = Array.from({length:10}, (_,i) => {
    const element = document.createElement('span');
    const size = 18 * Math.pow(.81, i);
    element.className = 'cursor-trail';
    element.style.width = element.style.height = `${size}px`;
    element.setAttribute('aria-hidden','true');
    document.body.append(element);
    return {element, size, x:0, y:0};
  });
  let x=0,y=0,visible=false,frame=0,bounceStart=-1000;
  // Composite transparent backgrounds through the ancestors, using the page's
  // white canvas as the final layer. Sample each dot so the tail can straddle sections.
  function isDarkAt(px, py) {
    let element = document.elementFromPoint(px, py);
    let remaining = 1;
    const color = [0, 0, 0];
    while (element && remaining > .01) {
      const channels = getComputedStyle(element).backgroundColor.match(/[\d.]+/g);
      if (channels && channels.length >= 3) {
        const alpha = channels.length > 3 ? Number(channels[3]) : 1;
        for (let i = 0; i < 3; i++) color[i] += Number(channels[i]) * alpha * remaining;
        remaining *= 1 - alpha;
      }
      element = element.parentElement;
    }
    const linear = color.map(channel => {
      const value = (channel + 255 * remaining) / 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    });
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2] < .3;
  }
  let lastColorSample = -Infinity;
  function animate(time) {
    const sampleColors = time - lastColorSample >= 70;
    if (sampleColors) lastColorSample = time;
    const elapsed=(time-bounceStart)/1000;
    const bounce=elapsed<1 ? -Math.abs(Math.sin(elapsed * Math.PI * 3))*42*Math.exp(-elapsed*3) : 0;
    let targetX=x,targetY=y+bounce;
    dots.forEach((dot,i) => {
      dot.x+=(targetX-dot.x)*(i===0?.5:.33);
      dot.y+=(targetY-dot.y)*(i===0?.5:.33);
      dot.element.style.transform=`translate3d(${dot.x-dot.size/2}px,${dot.y-dot.size/2}px,0) scale(${i===0 && elapsed<.1 ? 1.2 : 1})`;
      if (sampleColors) dot.element.classList.toggle('on-dark', isDarkAt(dot.x, dot.y));
      targetX=dot.x; targetY=dot.y;
    });
    frame=requestAnimationFrame(animate);
  }
  document.addEventListener('pointermove',event=>{
    x=event.clientX;y=event.clientY;
    if(!visible){dots.forEach(dot=>{dot.x=x;dot.y=y;dot.element.classList.add('is-visible');});visible=true;frame=requestAnimationFrame(animate);}
  });
  document.addEventListener('pointerdown',()=>{bounceStart=performance.now();});
  document.documentElement.addEventListener('pointerleave',()=>{visible=false;cancelAnimationFrame(frame);dots.forEach(dot=>dot.element.classList.remove('is-visible'));});
  // A dialog owns the top layer; move the trail into it while open.
  new MutationObserver(()=>dots.forEach(dot=>(menu.open?menu:document.body).append(dot.element))).observe(menu,{attributes:true,attributeFilter:['open']});
})();
