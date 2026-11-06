# Custom mascot controller

`custom-mascot.mjs` and `custom-mascot.css` are a new, standalone controller, independent of the existing page-mascot adaptation. Existing gallery characters continue using mascot.js. No dependencies or build step are needed.

Verdant, an original green superhero, is now the first gallery card and uses this controller through verdant.mjs. Existing 52 characters remain on the original gallery controller. Both new 1500×1500 PNG atlases have genuine alpha transparency and nine 500×500 cells. Source sheets and generation prompts are retained in characters/verdant/. Artwork was generated with the built-in image tool, then cells were aligned to a common shoulder baseline and centered using alpha measurements. Reactions use a 1.085 scale adjustment to match the neutral head size.

## Connect finished artwork

Load custom-mascot.css after style.css. Put a button in the desired gallery card, then initialize it from a module script:

```html
<button id="custom-character" type="button" aria-label="Custom character" hidden></button>
<script type="module">
  import { attachCustomMascot } from './custom-mascot.mjs';
  const button = document.querySelector('#custom-character');
  const character = attachCustomMascot(button, {
    directions: 'mascots/your-character-directions.webp',
    reactions: 'mascots/your-character-reactions.webp',
    label: 'Your character'
  });
  try {
    await character.ready;
    button.hidden = false;
  } catch (error) {
    character.destroy();
    console.error(error);
  }
  // Call character.destroy() before removing the card.
</script>
```

Both atlases must be square, with dimensions divisible by three (e.g. 900×900). Each cell must use matching character scale and position, with clear margins and genuine alpha transparency.

Directions in reading order: upper-left, up, upper-right, left, neutral, right, lower-left, down, lower-right. Directions refer to the viewer's coordinates.

Expressions in reading order: blink, happy, surprised, heart, wink, proud, sleepy, dizzy, laugh. Each click advances one cell. Expressions last 900ms, then the character resumes tracking. Touch devices keep the neutral direction and support tap reactions. A native button supports Enter and Space. Reduced-motion mode disables the bounce.

The controller returns `{ ready, showExpression(index), destroy() }`. Loading failures reject ready and keep the button disabled. Destroy removes listeners, timers, pending frames and animations.

## Validation

Node checks covered nine directions, neutral dead zone, dominant-axis direction, all nine click expressions, timed return to neutral, reduced-motion animation suppression, cleanup and missing artwork. Browser verification covered first-card placement, 53 total cards including 52 existing characters, pointer-driven pose changes, Enter/click expression activation, Originals filtering and 390px mobile layout without overflow.
