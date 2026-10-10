
const hoverImg = document.getElementById('hover-img');
const serviceItems = document.querySelectorAll('.service-item');

if (hoverImg && serviceItems.length > 0) {
  serviceItems.forEach(item => {
    item.addEventListener('mouseenter', (e) => {
      const imageSrc = item.getAttribute('data-img');
      if (imageSrc) hoverImg.src = imageSrc;
      hoverImg.style.opacity = '1';
    });

    item.addEventListener('mousemove', (e) => {
      hoverImg.style.left = `${e.pageX}px`;
      hoverImg.style.top = `${e.pageY}px`;
    });

    item.addEventListener('mouseleave', () => {
      hoverImg.style.opacity = '0';
    });
  });
}

if (typeof Lenis !== 'undefined') {
  const lenis = new Lenis();

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.menu');

  if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
      menu.classList.toggle('hidden'); // Show/Hide menu
      menu.classList.toggle('flex');  // Ensure it displays correctly
    });
  }
});

