# Prompt 01 — Landing page dizajn (ChatGPT / GPT Image)

## Kako se koristi
1. U ChatGPT-u uključi **image generation** (ne treba `/landing-page` komanda — prompt je samostalan; ako komanda postoji, samo joj šteti jer nameće svoj šablon).
2. **Zakači 2 slike** i to ovim redom: (1) `Пакети услуга` referentna objava, (2) logo iz `public/`. Prompt ih oslovljava kao „Image 1" i „Image 2".
3. Nalepi prompt iz bloka ispod **bez izmena**. Prvo generiši A (portrait, cela stranica). Ako je tekst iskrivljen, ponovi sa istim promptom — ne menjaj ga, samo traži „same prompt, fix the Cyrillic text rendering, keep everything else identical".
4. Posle toga varijante B i C (na dnu) za hero u visokoj rezoluciji i mobilni.

---

## A — Full landing page (portrait, 1024×1536 ili „tall")

```
You are a senior brand & web designer. Produce ONE high-fidelity UI design mockup of a full-length landing page (desktop, scrolled out flat, top to bottom) for a small premium beauty salon in Zemun, Belgrade. Output is a clean flat screen render — no device frame, no perspective, no hands, no browser chrome, no annotations, no watermark.

REFERENCES (attached)
- Image 1 = the salon's existing Instagram post. This is the visual DNA: white ground, deep plum/magenta purple, watercolor botanical leaves and thin grey line-art sprigs in the corners, a lot of air, one small heart accent. Match this mood exactly; do not invent a different style.
- Image 2 = the salon's logo: a black chair/"Д" silhouette with a white heart, followed by the word "фрајлица" in a plum serif. Reproduce it as-is in the header. Do not redraw, recolor or translate it.

LANGUAGE — CRITICAL
All on-page text is Serbian Cyrillic. Render ONLY the exact strings listed below, letter-for-letter, no Latin letters anywhere, no lorem ipsum, no extra words. Keep text count low so every glyph is crisp.

BRAND SYSTEM
- Palette: plum #7A1B63 (primary), magenta-plum #9B2C82 (buttons), light plum #F3E4EE (soft section backgrounds), warm paper #F7F2EC (price section), ink #2B1A26 (body text), pure white hero.
- Typography: headline = elegant high-contrast serif with proper Cyrillic (like Playfair Display / Cormorant); body = clean geometric sans with Cyrillic (like Inter / Manrope). Generous letter-spacing on small uppercase labels.
- Graphic motif: watercolor plum leaves + delicate grey line sprigs anchored in page corners and softly behind section titles, like Image 1. Grain of paper texture in the price section. One tiny plum heart used as the bullet/ornament.
- Feel: luxurious, calm, feminine, editorial, lots of white space, rounded 16px corners, soft plum-tinted shadows. NOT clip-art, NOT pink-girly, NOT dark mode, NOT generic SaaS.

PAGE STRUCTURE (top → bottom, each section clearly separated by whitespace)

1) HEADER — transparent on white. Left: Image 2 logo. Center: nav links "Услуге   Ценовник   Галерија   Контакт". Right: a pill button, filled #9B2C82, white text "Закажи термин".

2) HERO — full-width, white. Left 55%: small uppercase label "КОЗМЕТИЧКИ САЛОН · ЗЕМУН", then a very large serif headline "Мали рај за лепоту" with the word "лепоту" in plum, subline in sans "Маникир · Педикир · Трепавице · Депилација · Третмани лица", then two buttons: filled plum "Закажи термин" and outline plum "Ценовник". Right 45%: a large rounded photo card — close-up editorial photo of a woman's hand with glossy nude-pink almond gel nails resting on a soft beige linen, natural daylight, shallow depth of field. Floating around the photo card: three soft 3D-rendered glossy plum leaves (like the watercolor leaves but as smooth glass-like 3D objects, slightly translucent, casting soft shadows) — this hints at an interactive 3D element. Watercolor leaves in the top-left and top-right corners of the hero exactly like Image 1.

3) TRUST STRIP — thin band, light plum #F3E4EE, three short items with tiny plum heart icons: "10+ година искуства", "Бачка 68а, Земун", "Картице прихваћене".

4) SERVICES — white background. Section title serif "Услуге" with a small watercolor sprig behind it. A 3×2 grid of cards, each card: soft plum-tinted shadow, rounded, a small circular photo thumbnail (nails / pedicure / lashes / eyebrows / face treatment / waxing — close-ups, no faces) and a title only: "Маникир", "Педикир", "Трепавице и обрве", "Депилација", "Третмани лица", "Спреј тен".

5) PRICE LIST — warm paper background #F7F2EC with subtle paper grain, dark mocha text, feels like a hand-typed price card. Title serif "Ценовник". Two neat columns of dotted-leader rows, only these rows: "Маникир ........ 1.700", "Гел лак ........ 2.500", "Естетски педикир ........ 2.500", "Ламинација трепавица ........ 2.500", "Депилација ногу ........ 1.300", "Хигијенски третман лица ........ 2.800". Small note under it: "Цене у динарима · важи од 1. 2. 2026." Watercolor leaf in one corner.

6) GALLERY — white. Title "Галерија". A masonry strip of 6 close-up nail-art photos (varied colors: black, red, pastel blue, French, yellow dots, plum), consistent warm daylight, no faces.

7) BOOKING CTA — full-width band in plum #7A1B63 with faint white watercolor leaves. White serif headline "Закажите свој термин", white sub "Инстаграм · Вибер · WhatsApp · Позив", and a large white pill button with plum text "069 889 3550".

8) FOOTER — white, minimal: logo (Image 2) small, address "Бачка 68а, 11080 Земун", Instagram handle "@kozmeticki_salon_zemun" (this one string may stay Latin as it is a handle), copyright "© 2026 Д фрајлица". Corner watercolor leaves bottom-left and bottom-right like Image 1.

RENDERING RULES
- Pixel-crisp UI, straight edges, consistent 8px spacing grid, real typographic hierarchy.
- Photos must look like real editorial photography, not illustration.
- No people's faces. No text other than the strings above. No English. No placeholder blocks.
- Aspect ratio: tall portrait, entire page visible in one image.
```

---

## B — Hero only, visoka rezolucija (landscape 1536×1024)

```
Same brand, same references (Image 1 = Instagram post, Image 2 = logo), same rules as before. Now render ONLY the header + hero section of that landing page at desktop width, landscape, as large and detailed as possible. Header: logo left, nav "Услуге   Ценовник   Галерија   Контакт", plum pill button "Закажи термин". Hero: label "КОЗМЕТИЧКИ САЛОН · ЗЕМУН", huge serif headline "Мали рај за лепоту" (word "лепоту" in plum #7A1B63), subline "Маникир · Педикир · Трепавице · Депилација · Третмани лица", buttons "Закажи термин" (filled) and "Ценовник" (outline). Right side: rounded editorial photo of a hand with glossy nude-pink almond gel nails on beige linen, plus three floating glossy translucent 3D plum leaves with soft shadows. Watercolor plum leaves and grey line sprigs in the top corners exactly like Image 1. White background, lots of air, Serbian Cyrillic only, no other text.
```

## C — Mobilna verzija (portrait 1024×1536)

```
Same brand, same references, same rules. Render the same landing page as a MOBILE screen (390px wide layout, tall portrait, flat, no phone frame). Stack everything vertically: logo + hamburger; hero label "КОЗМЕТИЧКИ САЛОН · ЗЕМУН", headline "Мали рај за лепоту", sub "Маникир · Педикир · Трепавице · Депилација", full-width plum button "Закажи термин", then the nail photo card with one floating 3D plum leaf; then trust strip; then 2-column service cards "Маникир", "Педикир", "Трепавице и обрве", "Депилација"; then paper-texture price block "Ценовник" with 4 dotted rows; then plum CTA band "Закажите свој термин" with white pill "069 889 3550"; footer. Sticky bottom bar at the very end: plum button "Закажи термин" with a small phone icon. Serbian Cyrillic only.
```

---

## Zašto je prompt ovako napisan (za buduće promptove)
- **Reference se imenuju** („Image 1/Image 2") i svakoj se dodeli uloga — model inače stapa logo i post u jedan mood.
- **Tekst je eksplicitno pobrojan** i kratak: image modeli greše na ćirilici srazmerno broju glifova. Sve što nije u listi zabranjeno je.
- **Hex boje + font kategorija** umesto opisa „ljubičasto" — daje konzistentnost između A/B/C generacija.
- **„No device frame, no perspective, flat"** — inače dobiješ 3D mockup laptopa koji je beskoristan kao dizajn referenca.
- **3D listovi** su namerno u promptu: to je naš three.js hero element, i dobro je da klijent vidi ideju već na slici.
- **Negativna lista na kraju** (no faces, no English, no placeholder) — GPT Image bolje poštuje zabrane kada su poslednje.
