# Portfolio mascot

The CRT character and interaction are adapted from [nilbuild/page-mascot](https://github.com/nilbuild/page-mascot), under the included MIT license.

The homepage uses `mascot.js` and the `.portfolio-*` / `.mascot-*` rules in `style.css`. This is a vanilla JavaScript adaptation for this static HTML portfolio; no React or build step is required. Both 3×3 WebP atlases are hosted here, so the mascot does not depend on a third-party CDN.

To change the character, replace both sheets and update the two CSS URLs and the preload URLs in `mascot.js`. Keep their 3×3 cell order. Update the button's accessible label to match.

The mascot follows fine pointers, reacts to clicks, Enter and Space, and skips the squash animation when reduced motion is enabled. It stays hidden if either sheet fails to load.
