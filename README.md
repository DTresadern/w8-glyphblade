# W8 Glyphblade

A vanilla HTML, CSS and JavaScript Gothic side-scrolling world explorer, alongside the generated visual assets and scene reconstructions.

Open `index.html` in a browser, or serve the repository locally:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000/`. Choose a location and hold the arrow keys or A/D to move; the on-screen buttons also support pointer and touch input. This is an art and level-design prototype, not a complete game: characters and enemies use static artwork.

- `assets/`: copies used by the interactive prototype.
- `output/characters/`: character sheets and animation previews.
- `output/glyphblade/`: generated scenes, standalone props, enemies and layered-scene reconstructions.
- `output/sprites/`: original ruined-chapel set.
- `references/glyphblade/`: the user-provided scene reference.

The scene backgrounds are reconstructions from flattened mockups. Ground and wall assets need cleanup and edge matching before they are used as seamless game tiles. Images have accompanying generation records where available. Download the complete asset collection from the link in the explorer or from the repository's releases.
