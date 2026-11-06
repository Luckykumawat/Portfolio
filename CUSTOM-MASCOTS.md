# Custom mascot controller

`custom-mascot.mjs` and `custom-mascot.css` are a new, standalone controller, independent of the existing page-mascot adaptation. Existing gallery characters continue using mascot.js. No dependencies or build step are needed.

Verdant remains the first gallery card. Twelve additional original superheroes now follow it: Solara, Tideling, Cinder, Nimbus, Geode, Zip, Frostfern, Terracotta, Aster, Sonnet, Glint and Orbit. All 13 originals use this controller through original-mascots.mjs. The existing 52 characters continue using mascot.js; there are 65 gallery cards in total.

The new 24 WebP atlases are 1260×1260, with nine 420×420 cells each (216 new frames). They use genuine alpha transparency. The sheets were generated with the built-in image tool, then separated into cells, cleaned of disconnected pixel specks, aligned to a common shoulder baseline and encoded as WebP. They total about 6.25 MB and load as their cards approach the viewport. Offscreen controls skip pose updates.

Verdant retains its existing PNG artwork. Source sheets and the full generation prompts live in characters/<id>/. The roster is in characters/roster.json. Frostfern's initially opaque directions atlas was corrected with the built-in image tool; its repair prompt is retained too.

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

Node checks covered nine directions, neutral dead zone, dominant-axis direction, all nine click expressions, timed return to neutral, reduced-motion animation suppression, cleanup and missing artwork. Browser verification covered Verdant first, 65 total cards / 13 originals / 52 existing characters, Enter reactions on all 12 new heroes, cursor-driven direction changes, mobile click reactions, the 13-card Originals and 21-card Animals filters, existing Bear reactions and a 390px mobile layout without horizontal overflow. All 216 new image cells passed nonempty-content and safe-margin checks.
