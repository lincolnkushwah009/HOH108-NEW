// =============================================================================
// GIK - Premium Home Goods | Journal / Editorial Data
// =============================================================================

export type ArticleCategory =
  | 'design'
  | 'living'
  | 'sustainability'
  | 'sacred-spaces';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  author: string;
  date: string;
  readTime: string;
  image: string;
  content: string;
}

export const articles: Article[] = [
  {
    id: 'journal-001',
    slug: 'the-grammar-of-reclaimed-wood',
    title: 'The Grammar of Reclaimed Wood',
    excerpt:
      'Every plank of salvaged timber carries a sentence written in decades of sun, rain, and human touch. Learning to read that language is the first step toward meaningful design.',
    category: 'design',
    author: 'Arjun Menon',
    date: '2025-12-14',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80',
    content: `There is a particular kind of silence that surrounds a stack of reclaimed wood. It is not the absence of sound so much as the presence of accumulated time -- decades of monsoons soaked into the grain, generations of hands that polished the surface through daily contact, the slow chemistry of aging that no kiln or stain can replicate. When we source timber for GIK, we are not shopping for raw material. We are listening to stories.

Our suppliers -- a network of salvage specialists, demolition contractors, and rural collectors across Tamil Nadu, Rajasthan, and Kerala -- understand this philosophy. A beam from a 120-year-old Chettinad mansion carries different tonal qualities than a plank from a decommissioned Kerala rice barge. The mansion beam has known the weight of ceilings and the warmth of cooking fires rising through the floor. The barge plank has been seasoned by brackish backwaters and shaped by the flex of waves. Both arrive at our workshop in Auroville carrying an education that no freshly milled timber can offer.

The challenge of working with reclaimed wood is also its gift: unpredictability. Every nail hole is a punctuation mark, every paint trace a footnote, every warp and twist a paragraph of structural memory. Our craftspeople do not sand these away. Instead, they design around them, allowing the material's biography to become the aesthetic. When you place a GIK Utility desk organiser on your table, you are not merely organising your pens. You are placing a century of architectural history at arm's reach, and inviting it to participate in the small, daily architecture of your life.`,
  },
  {
    id: 'journal-002',
    slug: 'vaastu-for-the-modern-apartment',
    title: 'Vaastu for the Modern Apartment: Beyond Superstition',
    excerpt:
      'Stripped of dogma and restored to its essence, Vaastu Shastra is simply the science of arranging space so that energy -- and the people within it -- can flow.',
    category: 'sacred-spaces',
    author: 'Priya Srinivasan',
    date: '2026-01-08',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200&q=80',
    content: `Let us begin by setting aside the fear-based Vaastu that has proliferated on social media -- the kind that insists your finances will collapse if your bathroom faces a particular direction, or that a mirror on the wrong wall will invite calamity. That is not Vaastu Shastra. That is anxiety dressed in ancient clothing. The real Vaastu, as encoded in texts like the Manasara and the Mayamata, is an elegant spatial science that understood something modern architects are only now rediscovering: that the orientation, proportion, and material quality of a space profoundly affect the wellbeing of its inhabitants.

At its core, Vaastu is about alignment -- between the built environment and the natural forces that move through it. The northeast corner of a home receives the first light of day and, in the Indian subcontinent, catches the cooling northeast monsoon winds. It makes empirical sense, then, that this corner should remain open, uncluttered, and dedicated to activities that benefit from freshness and clarity: meditation, study, worship. The southeast, which receives the most heat, naturally suits the kitchen and fire element. These are not mystical prescriptions. They are observations refined over millennia into a coherent design system.

For the modern apartment dweller -- constrained by fixed floor plans, shared walls, and the reality that you cannot move your bathroom -- Vaastu becomes an exercise in intentional object placement rather than structural renovation. This is precisely where GIK Align enters. Our prayer shelves, meditation frames, and altar pieces are designed to create Vaastu-harmonious micro-zones within any room. A Sthaan Prayer Shelf mounted in the northeast corner of your living room does not require you to demolish walls; it simply anchors the sacred in the correct direction, creating a field of intentionality that radiates outward. The space around it naturally becomes cleaner, calmer, more considered -- not through magic, but through the gentle discipline of having a consecrated point of reference in your home.`,
  },
  {
    id: 'journal-003',
    slug: 'why-we-dont-use-the-word-sustainable',
    title: "Why We Don't Use the Word Sustainable",
    excerpt:
      'Sustainability has become the most overused and under-examined word in design. At GIK, we prefer a more honest vocabulary.',
    category: 'sustainability',
    author: 'Kavitha Rao',
    date: '2026-01-22',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=1200&q=80',
    content: `You will notice that across our website, our packaging, and our conversations, we rarely use the word "sustainable." This is not because we do not care about the planet -- our entire material philosophy is built on reclamation and upcycling. It is because the word has been so thoroughly co-opted by corporate greenwashing that it now means almost nothing. When a fast-fashion brand that produces eight million garments a month calls itself sustainable because it introduced one capsule collection made from recycled polyester, the word has failed.

What we practise instead, we call material honesty. Every GIK product page tells you exactly what the object is made from, where that material was sourced, what it was in its previous life, and who shaped it into its current form. We name the cities, the craft traditions, the specific histories. Our Neer Coaster Set is not made from "recycled brass" -- it is made from brass collected from old temple bells and household vessels across Kerala, melted and recast in Moradabad by artisans whose families have worked with this metal for generations. That specificity is more meaningful than any sustainability certification, because it creates a chain of accountability that you, the buyer, can trace with your own curiosity.

We also resist the implication embedded in "sustainability" that the goal is merely to sustain -- to maintain the status quo, to do less harm. Our ambition is restorative, not conservative. Every reclaimed railway spike that becomes an Ankura wall hook is one less piece of iron in a landfill and one more object in a home that carries a story of transformation. Every fragment of broken bangle in a Chitra mosaic is material that was headed for a waste pit in Firozabad, redirected into a piece of art that might hang on a wall for another century. We are not sustaining. We are regenerating, redirecting, reimagining. The vocabulary matters because it shapes what we believe is possible.`,
  },
  {
    id: 'journal-004',
    slug: 'the-art-of-the-threshold',
    title: 'The Art of the Threshold: Designing Your Entryway',
    excerpt:
      'The first three seconds inside your front door determine the emotional tone of your entire home. Here is how to make them count.',
    category: 'living',
    author: 'Arjun Menon',
    date: '2026-02-05',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    content: `In traditional Indian architecture, the threshold -- the physical and psychic boundary between the outside world and the inner sanctum of the home -- was treated with extraordinary reverence. The kolam drawn at the doorstep each morning was not mere decoration; it was a geometric spell of welcome, a daily renewal of the boundary between public and private, chaos and order. The brass latch, the carved lintel, the neem leaves hung above the frame -- each element was a sentence in a language of arrival.

Modern apartments have largely eliminated the threshold as a designed experience. You turn a key, push open a door, and step directly into your life without ceremony. The entryway -- if it exists at all -- is typically a narrow corridor used for shoe storage and package dumping. But reclaiming this space, even in the smallest flat, can fundamentally alter your relationship with your home. The threshold is where you transition from the person you are in the world to the person you are in your most private space. It deserves attention.

Start with a key tray. This sounds absurdly simple, but the act of placing your keys in a designated vessel -- rather than tossing them onto the nearest surface -- is a micro-ritual of arrival. Our Prahar Key Tray was designed precisely for this purpose: its shallow curve receives your keys, your watch, the small metal objects of your exterior life, and holds them in a carved sheesham embrace until morning. Above it, an Ankura wall hook holds your coat or bag at exactly the right height. A pair of Neer coasters on a small console table wait for the glass of water you pour yourself when you walk in. None of these objects are expensive. None require renovation. But together, they compose a three-second experience of arrival that tells your nervous system: you are home now. The outside can wait.`,
  },
  {
    id: 'journal-005',
    slug: 'hands-that-shape-our-objects',
    title: 'Hands That Shape Our Objects: The Artisans of Bastar',
    excerpt:
      'In the forests of Chhattisgarh, a community of ironworkers transforms discarded metal into objects that carry the weight of ancestral knowledge.',
    category: 'design',
    author: 'Priya Srinivasan',
    date: '2026-02-12',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1510133768164-a8f7e4d4e3dc?w=1200&q=80',
    content: `The road to Kondagaon, deep in the Bastar district of Chhattisgarh, winds through sal forests so dense that the canopy turns midday into perpetual dusk. It is in this unlikely geography -- far from design studios, trend forecasts, and Instagram mood boards -- that some of GIK's most striking objects are born. The Gond and Maria tribal artisans of Bastar have been working with iron for over two thousand years, and their technique has changed remarkably little: a clay furnace, a hand-operated bellows, a hammer, an anvil, and fire.

When we first approached the Bastar ironworking cooperative about creating our Ankura wall hooks, there was a necessary negotiation -- not of price, but of philosophy. The artisans were accustomed to creating elaborate figurative sculptures: horses, deities, birds, entire narrative scenes wrought from iron. We were asking for minimalism, which in their visual vocabulary felt like emptiness. The breakthrough came when we reframed the brief: we were not asking for less expression, but for concentrated expression. A single curve of iron that captures the gesture of a sprout emerging from soil. The artisans understood this immediately -- after all, their own tradition includes the concept of "rekha," the essential line that contains a form's entire energy.

What arrives at our workshop in Auroville, after days of travel from the forests of Chhattisgarh, are objects that carry a double inheritance. They have the formal clarity of contemporary design and the material intelligence of an unbroken craft lineage. Each hook, each forged curve, vibrates with the specific heat of a specific fire tended by specific hands. We pay the cooperative forty percent above market rate and have committed to a three-year rolling contract that provides income security regardless of our order volume. This is not charity. This is the recognition that the knowledge embedded in these hands is irreplaceable, and that preserving it is as urgent as any environmental cause. When you hang your coat on an Ankura hook, you are participating in the economic survival of a two-thousand-year-old tradition. That weight, invisible but real, is part of the design.`,
  },
  {
    id: 'journal-006',
    slug: 'sacred-geometry-in-everyday-objects',
    title: 'Sacred Geometry in Everyday Objects',
    excerpt:
      'From the Sri Yantra to the Flower of Life, ancient geometric principles quietly govern the proportions of the objects you live with.',
    category: 'sacred-spaces',
    author: 'Kavitha Rao',
    date: '2026-02-20',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80',
    content: `You do not need to be a mystic to feel the difference between a well-proportioned object and an awkward one. When a bowl sits perfectly in your hands, when a frame looks effortlessly right on a wall, when a shelf seems to organise itself -- these are not accidents of taste. They are the quiet work of geometric ratios that human beings have recognised as harmonious for millennia. The golden ratio (1:1.618), the square root rectangles, the vesica piscis -- these forms recur across nature, across cultures, across time, because they mirror the mathematical structures that underlie biological growth and physical reality.

In the Indian tradition, sacred geometry reaches its most sophisticated expression in the Sri Yantra -- a composition of nine interlocking triangles that creates 43 smaller triangles, arranged in a pattern that maps the structure of consciousness itself. Our Dhyana Meditation Frame follows these proportions not as decoration but as functional geometry: when your eyes rest on a form built from these ratios, the visual cortex enters a state of reduced processing effort, which neuroscience now correlates with meditative calm. Similarly, the Jaal Crystal Grid employs the Flower of Life pattern -- six overlapping circles creating a hexagonal lattice -- which appears independently in Egyptian temples, Chinese bronze work, and the carved pillars of the Hampi ruins.

We integrate these principles into GIK products not as spiritual branding but as a design methodology. The compartments of the Stillness Desk Organiser follow golden ratio proportions. The three tiers of the Vedika Altar Piece are offset according to root-two rectangles. Even the Neer Coaster Set is dimensioned so that six coasters, when arranged in their pouch, form a hexagonal close-packing pattern. These geometries work on you whether or not you are conscious of them, creating a subtle field of visual order that makes the objects feel inevitable rather than designed. That feeling of inevitability -- the sense that an object could not have been any other way -- is what separates a product from a presence.`,
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getFeaturedArticle(): Article {
  // Return the most recent article as featured
  const sorted = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0];
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return articles.filter((article) => article.category === category);
}

export function getRecentArticles(count: number = 3): Article[] {
  return [...articles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}
