import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getArticleBySlug, articles } from "@/lib/data/journal";
import { JournalArticleClient } from "./JournalArticleClient";

// ---------------------------------------------------------------------------
// Journal Article Detail Page (Server Component)
// ---------------------------------------------------------------------------

interface JournalArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function JournalArticlePage({
  params,
}: JournalArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Format date
  const formattedDate = new Date(article.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Related articles: same category, exclude current, max 3
  const relatedArticles = articles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  // Split content into paragraphs
  const paragraphs = article.content.split("\n\n").filter(Boolean);

  return (
    <JournalArticleClient>
      <section className="min-h-screen">
        {/* -- Reading Progress Bar -- */}
        <div
          className="reading-progress fixed top-0 left-0 h-[2px] bg-gik-gold z-[60] origin-left"
          style={{ transform: "scaleX(0)" }}
        />

        {/* -- Back Link -- */}
        <div className="page-pad pt-8 pb-6">
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 text-sm text-gik-stone hover:text-gik-void transition-colors duration-300 font-body group"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">
              &larr;
            </span>
            Back to Journal
          </Link>
        </div>

        {/* -- Full-bleed Parallax Hero Image -- */}
        <div className="hero-image-wrap relative w-full aspect-[2.2/1] overflow-hidden">
          <div className="hero-image-inner absolute inset-[-15%] will-change-transform">
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
              quality={85}
            />
          </div>
        </div>

        {/* -- Article Header -- */}
        <div
          className="page-pad"
          style={{ paddingTop: "var(--space-section)" }}
        >
          <div className="max-w-3xl mx-auto article-header">
            {/* Category eyebrow */}
            <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-5">
              {article.category.replace("-", " ")}
            </p>

            {/* Title */}
            <h1 className="font-display text-h1 font-light text-gik-void mb-8 leading-tight">
              {article.title}
            </h1>

            {/* Meta line */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gik-stone font-body">
              <span>{article.author}</span>
              <span>&middot;</span>
              <span>{formattedDate}</span>
              <span>&middot;</span>
              <span>{article.readTime}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gik-linen mt-10" />
          </div>
        </div>

        {/* -- Article Body with paragraph-by-paragraph fade-up -- */}
        <div
          className="page-pad"
          style={{ paddingBottom: "var(--space-section)" }}
        >
          <div className="max-w-3xl mx-auto pt-10">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="article-paragraph text-[clamp(1rem,1.1vw,1.15rem)] text-gik-void/80 leading-[1.85] font-body mb-8 last:mb-0 opacity-0"
                style={{ transform: "translateY(24px)" }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* -- Related Articles -- */}
        {relatedArticles.length > 0 && (
          <div
            className="bg-gik-linen content-auto"
            style={{
              paddingTop: "var(--space-section)",
              paddingBottom: "var(--space-section)",
            }}
          >
            <div className="page-pad">
              {/* Section eyebrow */}
              <div className="text-center mb-14">
                <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium">
                  Continue Reading
                </p>
              </div>

              {/* Related grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedArticles.map((related) => {
                  const relatedDate = new Date(
                    related.date
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <Link
                      key={related.id}
                      href={`/journal/${related.slug}`}
                      className="group block related-card opacity-0"
                      style={{ transform: "translateY(30px)" }}
                    >
                      {/* Image */}
                      <div className="relative aspect-[3/4] bg-gik-canvas overflow-hidden mb-5">
                        <Image
                          src={related.image}
                          alt={related.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </div>

                      {/* Content */}
                      <div className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
                        <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-2">
                          {related.category.replace("-", " ")}
                        </p>
                        <h3 className="font-display text-h3 font-light text-gik-void mb-2 leading-snug">
                          {related.title}
                        </h3>
                        <p className="text-xs text-gik-stone/60 font-body">
                          {relatedDate} &middot; {related.readTime}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </JournalArticleClient>
  );
}
