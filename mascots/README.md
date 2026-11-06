# Mascot gallery

52 existing characters from [nilbuild/page-mascot](https://github.com/nilbuild/page-mascot), distributed under the included MIT license.

Open `mascots.html` through any static web server. Navigation links on all portfolio pages lead here. The logo red (#900808) is sampled from image/Okuma.png.

`mascot.js` adapts the original React interactions to vanilla JavaScript: fine-pointer tracking, click/tap/keyboard reactions, reduced-motion support and category filters. Sheets are preloaded as cards approach the viewport. The gallery uses one shared pointer/scroll listener and updates visible cards through requestAnimationFrame.

All 104 WebP atlases are served locally from this directory. Each character has a 3×3 directions sheet and a matching reactions sheet. No build step or API key is required.

Verdant is original artwork created for this portfolio with the built-in image generator. Verdant and 12 new original superheroes use custom-mascot.mjs and original-mascots.mjs; the gallery has 77 characters in total. Verdant keeps its PNG atlases and each new hero has two WebP atlases. The MIT license here covers the upstream character collection, not the newly generated Verdant artwork.

A further 12 soft chibi animals and people use the same independent controller. Their 24 WebP sheets are served locally and load near the viewport. See CUSTOM-MASCOTS.md for the full collection and validation details.
