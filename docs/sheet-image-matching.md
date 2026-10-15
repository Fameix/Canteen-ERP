# Uploaded sheet extraction report

Matched and installed 93 cropped images using the uploaded labels. IDs, product names, prices, categories, and billing code were not modified. Correct existing product names are recorded in the downloadable mapping.

## Products retaining their previous images

- Jumbo Breakfast
- Mosambi
- Vanilla (2 scoops)
- Strawberry (2 scoops)
- Chocolate (2 scoops)

## Skipped labels

- Row 8, column 5: unclear label resembling Canova Juice; no matching existing product.
- Row 9, columns 1-3: duplicate Pomegranate/Pineapple juice labels.
- Row 9, column 9: second Masala Maggie label with a different-looking dish.
- Row 9, column 15: unclear Bread Samllette label; use clearly labeled Bread Omlette in column 16 instead.

## Image quality

The complete source sheet is 1536 x 1024. Each extracted picture is only about 76-142 pixels wide. Images were cropped without upscaling; these are not high-resolution product originals. Captions are excluded from site thumbnails.

## Mapping

See `public/food-images/sheet-extraction.json` for all 93 product IDs, existing names, image paths, and crop coordinates.
