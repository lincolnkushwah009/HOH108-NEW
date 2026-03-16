import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductHero } from "@/components/product/ProductHero";
import { FeatureReveals } from "@/components/product/FeatureReveals";
import { MaterialStory } from "@/components/product/MaterialStory";
import { CraftsmanshipVideo } from "@/components/product/CraftsmanshipVideo";
import { SpiritualNarrative } from "@/components/product/SpiritualNarrative";
import { DeliveryAccordion } from "@/components/product/DeliveryAccordion";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import {
  getProductBySlug,
  products,
  type Category,
} from "@/lib/data/products";

/* ─── Static params generation ─── */

export async function generateStaticParams() {
  return products.map((product) => ({
    category: product.category,
    slug: product.slug,
  }));
}

/* ─── Dynamic metadata ─── */

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const product = getProductBySlug(category as Category, slug);

  if (!product) {
    return { title: "Product Not Found | GIK" };
  }

  return {
    title: `${product.name} | GIK`,
    description: product.description,
    openGraph: {
      title: `${product.name} | GIK`,
      description: product.description,
      type: "website",
    },
  };
}

/* ─── Product Detail Page ─── */

export default async function ProductDetailPage({ params }: PageProps) {
  const { category, slug } = await params;
  const product = getProductBySlug(category as Category, slug);

  if (!product) {
    notFound();
  }

  // Show video section for first 6 products
  const productIndex = products.findIndex((p) => p.id === product.id);
  const showVideo = productIndex >= 0 && productIndex < 6;

  return (
    <main className="bg-gik-canvas">
      {/* ── Hero: Split-view Dark/Light ── */}
      <ProductHero product={product} />

      {/* Remaining sections stack vertically below */}
      <div className="bg-gik-canvas">
        {/* Feature Reveals */}
        <FeatureReveals product={product} />

        {/* Craftsmanship Video (select products) */}
        {showVideo && <CraftsmanshipVideo productName={product.name} />}

        {/* Material Story */}
        <MaterialStory
          material={product.material}
          origin={product.origin}
          productName={product.name}
          longDescription={product.longDescription}
        />

        {/* Spiritual Narrative (Align products only) */}
        <SpiritualNarrative
          spiritualSignificance={product.spiritualSignificance}
          productName={product.name}
        />

        {/* Delivery / Care / Returns Accordion */}
        <DeliveryAccordion careInstructions={product.careInstructions} />

        {/* Related Products */}
        <RelatedProducts productId={product.id} />
      </div>
    </main>
  );
}
