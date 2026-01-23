import { ColorPalettePicker } from "@/app/_components/ColorPalettePicker";

export default function ColorsPage() {
  return (
    <div className="container py-12 mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Brand Personality Colors</h1>
        <p className="text-zinc-600">
          Explore colors associated with Aaker&apos;s brand personality framework.
          Select a dimension, facet, or trait to see related colors.
        </p>
      </div>

      <ColorPalettePicker className="max-w-6xl" />
    </div>
  );
}
