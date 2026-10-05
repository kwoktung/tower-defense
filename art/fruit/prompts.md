# Fruit skin — prompt log

All art is generated in one Gemini web conversation (Flash model, image generation), so later
images can refer back to the style sample. Raw downloads live in `art/fruit/raw/` (not in git).

- Conversation: https://gemini.google.com/app/ede91a77655e5323
- Gemini downloads are **JPEG** (≈1376×768), not PNG. Background removal therefore uses a fuzz
  of about 22% from the corners plus a 1 px alpha erode; tested clean on the style sample, and it
  also removes the soft drop shadows under the characters.

## style-sample.jpeg — 2026-10-05

Style sample: Blueberry Shooter, Pineapple Bomber, Lemon Squirter (all level 1). First attempt.

> Generate an image: an original character design sheet for a cute chibi fruit-themed tower
> defense game. Three separate characters standing side by side in one row, with clear empty
> space between them, not overlapping, all facing slightly to the right. 1) Blueberry Shooter: a
> round deep-blue blueberry with a small crown of green leaves, big shiny eyes and a short round
> mouth-nozzle for spitting berries. 2) Pineapple Bomber: a stout golden pineapple with a spiky
> green leaf crown and a cheeky grin, holding a small pineapple chunk ready to throw. 3) Lemon
> Squirter: a plump yellow-green lemon with one tiny leaf and a little juice nozzle, a slightly
> sour determined expression. Style: flat vector cartoon, chibi proportions (head and body about
> 1:1), big expressive eyes, thick dark brown outlines, soft cel shading, light from the
> top-left, bright saturated colors, three-quarter front view, no realistic textures. Background:
> perfectly flat solid magenta #FF00FF, no shadows on the background, no gradient, no ground, no
> text, no labels.

Result: matches the brief. Soft purple foot shadows appeared anyway (removed by the cut-out).

## Batch 1 — 2026-10-05

To save quota and keep each tower consistent across levels, each tower's three levels were asked for
**in one image** (left to right = level 1, 2, 3) instead of editing level 1 three times. Enemies
and projectiles are also one sheet each. The pipeline splits sheets on empty columns.

Prompts must start with "Generate an image:". One attempt without it got a text-only refusal
("I cannot directly generate…"), which costs nothing but a turn.

### tower-basic-levels.jpeg

> Generate an image: the Blueberry Shooter character from the first image in this chat, shown at
> three upgrade levels, in exactly the same art style (same face, same colors, thick dark brown
> outlines, soft cel shading, chibi proportions). Three versions side by side in one row, evenly
> spaced with clear empty space between them, not overlapping, all facing slightly to the right,
> growing slightly larger from left to right. Left: the blueberry exactly as in the first image.
> Middle: the same blueberry a bit bigger, with two extra leaves on its crown and a small green
> leaf scarf. Right: the same blueberry, biggest, with a tiny golden crown on top of its leaves and
> golden trim around its mouth-nozzle. Background: perfectly flat solid magenta #FF00FF, no
> shadows, no ground, no gradient, no text, no numbers, no labels.

### tower-splash-levels.jpeg

Same template; Pineapple Bomber. Left: as in the first image, holding a small pineapple chunk.
Middle: a bit bigger, taller leaf crown and a small leaf bandana. Right: biggest, a tiny golden
crown nestled in its leaves and a golden belt.

### tower-slow-levels.jpeg

Same template; Lemon Squirter. Left: as in the first image. Middle: a bit bigger, a second leaf
and a small dripping juice droplet on its nozzle. Right: biggest, a tiny golden crown on top and a
golden ring around its nozzle. Note: level 2 differs only a little from level 1; the skin also
scales levels up, which helps.

### enemies.jpeg

> Generate an image: three original cute chibi garden-pest enemy characters for the same fruit
> tower defense game, in exactly the same art style as the first image in this chat (thick dark
> brown outlines, soft cel shading, big expressive eyes, bright colors, flat vector cartoon). Three
> separate characters side by side in one row, evenly spaced with clear empty space between them,
> not overlapping, all shown in side view walking to the RIGHT. Left: a plump green caterpillar
> with a few round body segments, tiny feet and a mischievous grin. Middle: a small fast fruit fly
> with big red eyes, transparent wings and a speedy pose. Right: a chunky beetle with a thick shiny
> dark grey-brown armored shell, sturdy legs and a stubborn frown, clearly heavily armored.
> Background: perfectly flat solid magenta #FF00FF, no shadows, no ground, no gradient, no text, no
> labels.

Note: the beetle faces the viewer more than to the right.

### projectiles.jpeg

> Generate an image: three small game projectile icons in exactly the same art style as the first
> image in this chat (thick dark brown outlines, soft cel shading, bright colors, flat vector
> cartoon), no faces. Three separate objects side by side in one row, large and centered, evenly
> spaced with lots of empty space between them, not overlapping. Left: a single shiny round
> blueberry with a tiny star-shaped top. Middle: a chunky triangular wedge of pineapple flesh with a
> bit of golden rind. Right: a single plump yellow-green lemon juice droplet, teardrop shaped,
> pointing to the right. Background: perfectly flat solid magenta #FF00FF, no shadows, no ground,
> no gradient, no text, no labels.

### texture-grass.jpeg (1024×1024)

> Generate an image: a seamless tileable top-down grass ground texture for the same cute cartoon
> fruit orchard game, in the same flat vector cartoon style as the first image in this chat. Fresh
> medium green lawn with small simple stylized grass tufts and a few tiny clover leaves scattered
> evenly, soft and low contrast so characters stand out on top of it, no strong shading, no
> outlines on the tile edges, no flowers, no objects, no characters, no paths, no text. The pattern
> must repeat seamlessly on all four edges. Square composition, the texture fills the whole image
> edge to edge.

### texture-dirt.jpeg (1024×1024)

Same template as grass: warm light brown packed soil with a few small rounded pebbles and soft
darker speckles; no grass.

### slot.jpeg

> Generate an image: one single game tile object for the same cute cartoon fruit orchard game, in
> exactly the same art style as the first image in this chat (thick dark brown outlines, soft cel
> shading, flat vector cartoon). A square plot of freshly tilled dark brown garden soil with
> slightly rounded corners, framed by a low rim of light wooden planks, seen from directly above
> (top-down), empty in the middle so a character can stand on it, no plants, no characters. One
> object only, large and centered with empty space around it. Background: perfectly flat solid
> magenta #FF00FF, no shadows, no ground, no gradient, no text, no labels.

Quota: 9 images generated in this conversation today, all first tries (plus one text refusal).
