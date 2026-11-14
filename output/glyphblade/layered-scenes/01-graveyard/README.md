# 01 Graveyard

- `source/mockup.png`: untouched copy of the flattened reference (2172 × 724).
- `background/far-plate.png`: reconstructed background, not a pixel-exact recovery of hidden scenery.
- `background/back-props-layout.png`, `mid-props-layout.png`, `near-props-layout.png`: separate transparent 2172 × 724 example parallax compositions. Back-to-front recommended scroll factors: 0.15, 0.35, 0.65, 0.85; foreground 1.0. Set the positions and factors in your engine; PNGs do not carry scrolling behaviour.
- `foreground/props/` and `characters/`: independent transparent assets resized from the existing project artwork. The example layouts use only props; characters should be spawned independently.
- `foreground/source-ground-strip.png`: unmodified source crop beginning at y=600. `foreground/tiles/`: 128 × 64 cells in original left-to-right and top-to-bottom order. The right/bottom edge cells can contain transparent padding. Place only adjacent source cells for exact joins; arbitrary repeats and other combinations need edge cleanup. Foreground details and lighting are baked into the crop.
- `manifest.json` records canvas, tile grid and suggested layout positions. Native scene scale is one PNG pixel per source pixel; this is concept art and does not establish an engine pixel-art grid.

The source was a flat image. The plate and props are reconstructions; they cannot recover hidden pixels or preserve an exact original composite. Reused props vary in detail and may need alpha cleanup and consistent art direction. Review in-engine before production.

`background/sections/` contains the plate in ordered strips up to 512 pixels wide. They join in their original order only; the full panorama is not seamless when repeated. Original scene lighting and fragments of objects, including possible character feet, can remain in the ground crop.
