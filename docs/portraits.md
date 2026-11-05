# Painted portraits for the chamber

The chamber ships with code-drawn SVG busts. To replace them with painted portraits, make **four frames per seat** and drop them into `assets/portraits/`. A seat switches over automatically once all four of its frames exist. No code changes or restart are needed; just refresh the page.

```
assets/portraits/<id>-base.webp    mouth closed, eyes open (resting)
assets/portraits/<id>-mid.webp     mouth half open
assets/portraits/<id>-open.webp    mouth open, mid-word
assets/portraits/<id>-blink.webp   mouth closed, eyes closed
```

Seat ids: `socrates`, `plato`, `aristotle`, `confucius`, `laotzu`, `kant`, `ibnarabi`.

## Format

- **Size:** square 1024 × 1024 works well (Roast Room's portraits are square); 1000 × 1200 is fine too. Transparent or plain white background, exported as `.webp`.
- **Framing:** head and shoulders, centred, facing the viewer, with the chin at about 55% of the height and shoulders running off the bottom edge. Each seat sits behind the table, so the bottom fifth of the image will be hidden.
- **Same style for all seven:** use one image model, one style line and one lighting setup.

## How to keep the four frames identical except the mouth and eyes

1. Generate the `base` frame from the prompt below.
2. Make `mid`, `open` and `blink` **by editing `base`**, not by generating new images. Use your tool's edit or inpaint feature, mask only the mouth (or eyes), and use the edit lines at the bottom of this page. If you regenerate from scratch, the face drifts and the head appears to jump when it talks.
3. Check the frames by flipping between them quickly. Only the mouth or eyes should move.

## Style line (use it in every prompt)

> High-quality 3D animated-film character render, glossy and soft like a modern animated feature, slightly stylised proportions with large warm expressive eyes and detailed skin, hair and fabric, dignified not comic, soft studio key light from upper left with subtle rim light, head-and-shoulders, centred, facing the viewer, plain white background.

This is the same look as Roast Room's advisors. Any image tool that can edit an existing image works (ChatGPT's image editor, Gemini, Midjourney's editor, Ideogram).

## Base prompts

These are based on how each figure is traditionally shown in public-domain art. They're likenesses in a tradition, not portraits of real faces: no photograph exists of anyone here except perhaps Kant, and Kant is shown here in the style of his 18th-century portraits.

| Seat | Prompt (put the style line after it) |
|---|---|
| socrates | Socrates, the ancient Athenian philosopher as shown in classical busts: balding crown with grey hair at the sides, broad snub nose, full bushy grey beard, wide-set curious eyes, a slight knowing smile, an off-white wool himation draped over one shoulder. |
| plato | Plato as in Roman copies of his portrait bust: full head of wavy grey hair with a thin gold fillet headband, long dignified grey beard, calm far-seeing gaze, a blue-grey himation with a darker border. |
| aristotle | Aristotle as in the Roman bust after Lysippos: short curly dark-brown hair, neatly trimmed short beard, alert analytical eyes, a deep maroon chiton with a darker hem. |
| confucius | Confucius in the style of traditional Chinese scholar portraits: black hair under a small black scholar's cap with a gold band, long thin black beard and moustache, serene attentive expression, a dark crimson robe with gold-trimmed collar. |
| laotzu | Lao Tzu as in classical Chinese paintings of the old master: high bald forehead, long white hair at the sides, very long flowing white beard, gentle half-smiling eyes, an earth-brown hemp robe. |
| kant | Immanuel Kant in the style of 18th-century Prussian portraits: powdered white wig with rolled curls at the sides, clean-shaven narrow face, sharp attentive eyes, dark charcoal frock coat, white cravat. |
| ibnarabi | Ibn ʿArabī as a 13th-century Andalusian Sufi scholar: white turban with a small gold clasp, full dark beard, deep contemplative eyes, a deep green robe with a gold-trimmed collar. |

## Edit lines (applied to `base`, with only the mouth or eyes masked)

- **mid:** "Same image. Mouth slightly open as if starting a word, lips parted, teeth barely visible. Change nothing else."
- **open:** "Same image. Mouth open mid-word, as when saying 'ah', jaw lowered a little. Change nothing else."
- **blink:** "Same image. Eyes gently closed in a natural blink. Change nothing else."

## Licensing

Use images that you're allowed to publish under this repo's MIT licence. If your image tool's terms limit commercial use or redistribution, keep the portraits local and don't commit them.
