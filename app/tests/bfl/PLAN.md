I would like to create a web tool at ./page.tsx that uses the current packages to allow me to quickly query open router for each of the brand traits. If we need to add a new package, tell me about it while planning.

On this page, I should be able to do the following:
1. Select which brand traits to explore
2. Generate a composition for each number between 0-5, inclusive, using the exact prompt below in `contentForTraitAndLevel`
3. Choose to generate 1 to 5 iterations for each level
4. The images returned should be stored somewhere
5. Optional: Create another chat for each image to Claude to assess the image

```
  // OpenRouter client
  const openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  })

  // Format of chat options for each trait
  function contentForTraitAndLevel(trait, level) { 
    return `
      First principles in visual design are the foundational concepts that govern how visual elements work together to create effective, meaningful compositions. Here are the core ones:
      
      Contrast creates visual interest and hierarchy by juxtaposing different elements—light vs. dark, large vs. small, thick vs. thin. It helps guide attention and establish importance.
      
      Hierarchy organizes information by importance. Through size, color, placement, and weight, you signal what viewers should notice first, second, and so on.
      
      Balance distributes visual weight across a composition. This can be symmetrical (formal, stable) or asymmetrical (dynamic, interesting). Imbalance creates tension—sometimes intentionally.
      
      Alignment creates order by visually connecting elements. Even elements that aren't touching feel related when they share an edge or centerline. Misalignment often reads as accidental or sloppy.

      Proximity groups related items together. Things that are close appear connected; things that are far apart appear separate. This is how we create logical groupings without explicit borders.

      Repetition creates consistency and unity by reusing visual elements—colors, shapes, typefaces, spacing patterns. It builds rhythm and reinforces brand or system identity.
      
      White space (negative space) gives elements room to breathe. It's not empty—it's active. Generous spacing often signals quality and clarity.
      
      Unity and variety work in tension. Too much unity is monotonous; too much variety is chaotic. Good design finds the balance where things feel cohesive but interesting.

      These principles are interconnected—hierarchy relies on contrast, grouping uses proximity, and so on. Mastering them means understanding not just what they are, but when to emphasize or break each one for effect.

      Using first principles, generate a 300x300 image that uses circles, squares, and triangles to represent the given trait, ${trait}, on a scale of 1-5 where 1=least representative and 5=most representative.

      If the value given for the ${trait} is 0, create a composition that is not at all related to that trait. Aside from using only circles, squares, and triangles to create the composition, there are no guardrails to how you interpret a trait given a value of 0.

      { ${trait}: ${level} }
    `
  }

  // Options to use for each trait, for each level, 0-5
  const chatOpts = {
    model: "black-forest-labs/flux.2-klein-4b",
    messages: [{
      role: "user",
      content: contentForTraitAndLevel(trait, level),
    }],
    modalities: ["image"]
  }
```