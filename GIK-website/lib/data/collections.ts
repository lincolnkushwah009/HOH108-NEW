// =============================================================================
// GIK - Premium Home Goods | Collections Data
// =============================================================================

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productIds: string[];
}

export const collections: Collection[] = [
  {
    id: 'collection-001',
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description:
      'The latest additions to the GIK catalogue -- freshly crafted objects that carry the warmth of the workshop and the promise of becoming essential to your daily rituals. Each piece here has arrived within the last thirty days, still carrying the quiet excitement of something newly made finding its way into the world.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80',
    productIds: [
      'panel-006',   // Leher Undulating Shelf
      'align-006',   // Mrittika Diya Set
      'util-006',    // Dhara Tissue Holder
      'panel-005',   // Chitra Mosaic Wall Art
      'align-005',   // Jaal Crystal Grid
    ],
  },
  {
    id: 'collection-002',
    name: 'Bestsellers',
    slug: 'bestsellers',
    description:
      'The objects that have found their way into the most homes, chosen again and again by people who understand that the things you live with shape the life you live. These are not trending products -- they are quiet constants, proven through the most reliable test there is: daily use and enduring affection.',
    image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80',
    productIds: [
      'util-001',    // The Stillness Desk Organiser
      'align-002',   // Sugandha Incense Holder
      'util-003',    // Neer Coaster Set
      'panel-004',   // Kaal Statement Clock
      'align-003',   // Sthaan Prayer Shelf
      'util-005',    // Prahar Key Tray
    ],
  },
  {
    id: 'collection-003',
    name: "The Founder's Edit",
    slug: 'founders-edit',
    description:
      'A personal selection by GIK founder Meera Krishnamurthy -- the objects she keeps in her own home, the pieces she gifts to the people she loves, the designs that represent the purest expression of what GIK was created to be. This is not a commercial recommendation. It is an intimate gesture of sharing what has genuinely changed the texture of one person\'s daily life.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
    productIds: [
      'align-004',   // Vedika Altar Piece
      'panel-001',   // Vriksha Wall Panel
      'util-002',    // Kavi Pen Holder
      'align-001',   // Dhyana Meditation Frame
      'panel-003',   // Shikhara Sculptural Shelf
    ],
  },
  {
    id: 'collection-004',
    name: 'Seasonal Curation',
    slug: 'seasonal-curation',
    description:
      'As the light shifts and the air changes, so do the objects that feel most alive in a home. This rotating selection responds to the current season -- the materials that feel right against the skin, the forms that echo the landscape outside the window, the rituals that this particular turning of the year invites. Curated for the Indian spring: warmth, renewal, and the return of long evenings spent outdoors.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    productIds: [
      'align-006',   // Mrittika Diya Set
      'panel-002',   // Rekha Art Frame Trio
      'util-004',    // Ankura Wall Hooks
      'align-005',   // Jaal Crystal Grid
      'panel-006',   // Leher Undulating Shelf
      'util-003',    // Neer Coaster Set
    ],
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find((collection) => collection.slug === slug);
}

export function getCollectionById(id: string): Collection | undefined {
  return collections.find((collection) => collection.id === id);
}

export function getAllCollections(): Collection[] {
  return collections;
}
