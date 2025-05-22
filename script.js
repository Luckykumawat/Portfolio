
const hoverImg = document.getElementById('hover-img');
    const serviceItems = document.querySelectorAll('.service-item');

    serviceItems.forEach(item => {
      item.addEventListener('mouseenter', (e) => {
        const imageSrc = item.getAttribute('data-img');
        hoverImg.src = imageSrc;
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
    const lenis = new Lenis()

lenis.on('scroll', (e) => {
  console.log(e)
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}

requestAnimationFrame(raf)

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.menu');

  hamburger.addEventListener('click', () => {
      menu.classList.toggle('hidden'); // Show/Hide menu
      menu.classList.toggle('flex');  // Ensure it displays correctly
  });
});

