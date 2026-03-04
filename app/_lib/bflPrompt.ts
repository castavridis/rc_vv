export function contentForTraitAndLevel(trait: string, level: number): string {
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
  `.trim()
}
