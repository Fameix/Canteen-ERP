# Food image import report

Source: `om_saravana_bhava_food_images.zip` and its `menu-images.json`.

## Result

- 98 images copied byte-for-byte into `public/food-images/`.
- 98 manifest entries matched to 98 existing menu item IDs.
- Missing files: **0**. Unmatched products: **0**. Unmatched manifest entries: **0**. Duplicate item assignments: **0**. Unreferenced image files: **0**.
- Original manifest preserved at `public/food-images/menu-images.json`.
- ID-to-image mapping: `lib/menu-image-paths.json`.
- Product IDs, names, prices, categories, ordering, availability, and timestamps are unchanged.
- Existing saved products receive replacement paths when read. Custom uploaded paths and unknown products remain unchanged.
- Billing source files, bills, counters, and carts are unchanged.

## Name differences resolved

Matches use the existing product identity. Manifest `category_group` values were not used to change application categories.

| Manifest name | Existing menu name |
| --- | --- |
| Idly | Idly (2pcs) |
| Podi Idly | Podi Idly (2pcs) |
| Muttai Thokku | Mutta Thokku |
| Abc Malt | ABC Malt |
| Mint And Lime | Mint & Lime |
| Lemon Juice | Lemon |
| Amla Juice | Amla |
| Carrot Juice | Carrot |
| Papaya Juice | Papaya |
| Chikku Juice | Chikku |
| Musk Melon Juice | Musk Melon |
| Red Banana Dates Juice | Red Banana Dates |
| Fig Juice | Fig |
| Watermelon Juice | Watermelon |
| Pomegranate Juice | Pomegranate |
| Pineapple Juice | Pineapple |
| Mosambi Juice | Mosambi |
| Apple Juice | Apple |
| Vanilla Ice Cream | Vanilla (1 scoop) |
| Strawberry Ice Cream | Strawberry (1 scoop) |
| Chocolate Ice Cream | Chocolate (1 scoop) |
| Vanilla 2 Scoop | Vanilla (2 scoops) |
| Strawberry 2 Scoop | Strawberry (2 scoops) |
| Chocolate 2 Scoop | Chocolate (2 scoops) |

## Source-image mismatches and review notes

The manifest assignments were retained. No supplied image was edited, relabeled, or silently substituted.

| Product | Source-image issue |
| --- | --- |
| Jumbo Breakfast | Byte-identical to `idly.webp`; does not depict the full breakfast combination. The manifest marks it as an illustrative substitute. |
| Vanilla (2 scoops) | Byte-identical to the one-scoop file. The visible serving does not distinguish the two-scoop product. |
| Strawberry (2 scoops) | Byte-identical to the one-scoop file. The visible serving does not distinguish the two-scoop product. |
| Chocolate (2 scoops) | Byte-identical to the one-scoop file. The visible serving does not distinguish the two-scoop product. |
| Papaya Juice | Brown, milkshake-like appearance; verify that it depicts papaya. |
| Musk Melon Juice | Brown drink with part of a neighboring red drink visible; verify subject and crop. |
| Fig Juice | Bright red appearance; ingredient cannot be confirmed visually. |
| Watermelon Juice | Yellow-orange appearance rather than typical red watermelon; verify subject. |

Additional crop concerns: several juice, Maggie, ice cream, and snack files include slivers of neighboring images or uneven margins from the supplied collection sheet. The files remain unchanged.

These are illustrative thumbnails, as described in the supplied pack, rather than verified photographs of the actual servings. The juice concerns above are visual review flags, not verified ingredient identifications.

## Verification

- All 98 files decode as WebP.
- All copied image bytes and the manifest match the ZIP originals.
- All 98 image URLs return HTTP 200 and the expected WebP bytes.
- Before/after comparison confirms every non-image product field and every category is unchanged.
- Billing source hashes are unchanged.
- Regression tests verify existing saved records get the new paths without changing their other fields, bills, counter, or cart.

## 640-pixel pack replacement (15 October 2026)

Replaced all 98 image files using `om_saravana_bhava_food_images_640_upscaled.zip`. The manifest and image paths match the previous pack exactly. Existing product mapping and all application code are unchanged. These are 640 x 640 upscaled thumbnails, not native Full HD originals; previous subject and crop review notes still apply.

## 1080-pixel pack replacement (15 October 2026)

Replaced all 98 image files using `om_saravana_bhava_food_images_full_hd_1080.zip`. The manifest and image paths match the previous pack exactly. Existing product mapping and all application code are unchanged. These are 1080 x 1080 upscaled thumbnails, not native Full HD originals; previous subject and crop review notes still apply.
