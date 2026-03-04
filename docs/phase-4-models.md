# Phase 4 — Model Strategy Scratchpad

## Tasks to cover
<!-- What are the different generation / analysis tasks you want to support? -->
- Generate an initial summary for the chat (lightweight model)
- Inferences for brand traits (Mistral Medium 3)
  - Prompt may also send base line images representing core brand dimensions in the future
- Generate a base hexidecimal color based on traits or summary
- Generate an abstract image that's on theme with summary AND traits
- Generate an SVG that's on theme with summary AND traits
- Generate animations that's on theme with summary AND traits
- Make generated objects as parameterized as possible so that the user can play with the compositions in-browser instead of sending to unnecessary prompts

## Models in mind
<!-- Which models on OpenRouter are you thinking about? What are they good at? -->
- Black Forest Labs FLUX2 Flex: <= 1MP image generation; consider breaking generated image into multiple sections, say, 3 that will be cut out on the client side using a key color (e.g. chroma-key-green)
- Mistral Medium 3 for brand traits
- Mistral Creative for initial summary and hex color
- Claude for SVG
- Claude for Animation

## Routing logic
<!-- How should the tool decide which model to use for which task? -->
- Endpoints should dictate which models to use and may contain information on presets

## Open questions
<!-- Anything you're unsure about -->
