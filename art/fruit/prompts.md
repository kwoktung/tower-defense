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
