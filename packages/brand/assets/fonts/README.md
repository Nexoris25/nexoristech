# Self-hosted variable fonts

These are the four free font families the design system uses (PRD 14.1), shipped as variable
`woff2` and self-hosted so nothing depends on a third-party font CDN at runtime. Each app
copies them to its `public/fonts` directory and serves them from `/fonts`, matching the
`@font-face` declarations in `packages/ui/src/styles/fonts.css`.

| File                       | Family            | Used for                                  |
| -------------------------- | ----------------- | ----------------------------------------- |
| `plus-jakarta-sans.woff2`  | Plus Jakarta Sans | Marketing hero headlines and subheads     |
| `inter.woff2`              | Inter             | Marketing body and all dashboard text     |
| `lora.woff2`               | Lora              | Article headlines and body                |
| `lora-italic.woff2`        | Lora (italic)     | Article emphasis                          |
| `jetbrains-mono.woff2`     | JetBrains Mono    | API codes, IDs, and money amounts         |

## Source and licence

All four families are licensed under the SIL Open Font License 1.1, which permits self-hosting
and redistribution. The variable `woff2` builds were fetched from the Fontsource distribution
on the official jsDelivr CDN (`cdn.jsdelivr.net/fontsource`), which packages the upstream
Google Fonts sources unmodified.

- Plus Jakarta Sans: SIL OFL 1.1
- Inter: SIL OFL 1.1
- Lora: SIL OFL 1.1
- JetBrains Mono: SIL OFL 1.1
