# Three.js local ES modules

Pinned upstream version: **0.180.0 (r180)**, verified against the official npm registry on 2026-10-23.

Source: https://registry.npmjs.org/three/-/three-0.180.0.tgz
Official project: https://github.com/mrdoob/three.js/tree/r180
License: MIT; upstream `LICENSE` is included unchanged.

These are unchanged upstream `build/three.module.min.js` and `build/three.core.min.js`. The renderer module imports `./three.core.min.js`, so keep both files together. They are loaded locally on demand by `crystal-world-3d.js` when Crystal Quest opens; no CDN, account, external models, fonts or textures are needed. Combined uncompressed size: 720,032 bytes.

To update, verify a deliberate pinned upstream release, copy the corresponding two build modules and license, and rerun build plus WebGL/fallback browser checks. No npm runtime dependency is required by this static app.
