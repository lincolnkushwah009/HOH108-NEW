// =============================================================================
// GIK - Premium Home Goods | Product Data
// =============================================================================

export type Category = 'utility' | 'align' | 'panel';

export interface SpiritualSignificance {
  placement: string;
  bestFor: string;
}

export interface Dimensions {
  length: number;  // cm
  width: number;   // cm
  height: number;  // cm
  weight: number;  // kg
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Category;
  price: number;
  description: string;
  longDescription: string;
  images: string[];
  material: string;
  origin: string;
  dimensions: Dimensions;
  sku: string;
  inStock: boolean;
  isLimited: boolean;
  limitedEdition: number | null;
  spiritualSignificance: SpiritualSignificance | null;
  careInstructions: string;
  relatedProducts: string[];
}

// =============================================================================
// GIK Utility - Functional Minimal Home Objects
// =============================================================================

const utilityProducts: Product[] = [
  {
    id: 'util-001',
    name: 'The Stillness Desk Organiser',
    slug: 'stillness-desk-organiser',
    category: 'utility',
    price: 4800,
    description: 'Where chaos finds its quiet architecture.',
    longDescription:
      'Hand-carved from reclaimed teak salvaged from century-old Chettinad homes, The Stillness Desk Organiser transforms your workspace into a meditation on order. Each compartment is designed with the golden ratio in mind, creating a visual harmony that calms the peripheral mind even as you reach for a pen or paperclip. No two pieces share the same grain story.',
    images: [
      'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=800&q=80',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    ],
    material: 'Reclaimed Chettinad teak with hand-rubbed tung oil finish',
    origin: 'Crafted in Puducherry, Tamil Nadu',
    dimensions: { length: 28, width: 14, height: 10, weight: 0.85 },
    sku: 'GIK-UTL-0001',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: null,
    careInstructions:
      'Wipe with a dry soft cloth. Reapply tung oil once every six months to preserve the patina. Keep away from prolonged direct sunlight.',
    relatedProducts: ['util-002', 'util-005', 'panel-001'],
  },
  {
    id: 'util-002',
    name: 'Kavi Pen Holder',
    slug: 'kavi-pen-holder',
    category: 'utility',
    price: 2800,
    description: 'A vessel for the instruments of thought.',
    longDescription:
      'The Kavi is turned on a hand-powered lathe from a single block of upcycled mango wood, then finished with layers of natural lac. Its weighted base ensures steadiness while its gently tapered opening cradles each writing instrument with intention. Named after the Sanskrit word for poet, it reminds us that even the smallest objects deserve devotion.',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
      'https://images.unsplash.com/photo-1556909172-89cf0b8fdc9f?w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
    ],
    material: 'Upcycled mango wood with natural lac finish',
    origin: 'Crafted in Jodhpur, Rajasthan',
    dimensions: { length: 8, width: 8, height: 12, weight: 0.35 },
    sku: 'GIK-UTL-0002',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: null,
    careInstructions:
      'Dust gently with a microfibre cloth. Avoid water contact. The lac finish deepens naturally over time -- this is by design.',
    relatedProducts: ['util-001', 'util-003', 'util-006'],
  },
  {
    id: 'util-003',
    name: 'Neer Coaster Set',
    slug: 'neer-coaster-set',
    category: 'utility',
    price: 3200,
    description: 'Six circles of stillness beneath your morning ritual.',
    longDescription:
      'Each coaster in the Neer set is cast from recycled brass collected from old temple bells and household vessels across Kerala. The surface carries a deliberately unpolished texture that catches light like water, while the cork-backed underside protects your surfaces with silent care. Set of six, presented in a handmade cotton pouch dyed with indigo.',
    images: [
      'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800&q=80',
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80',
    ],
    material: 'Recycled brass with natural cork backing',
    origin: 'Cast in Moradabad, Uttar Pradesh',
    dimensions: { length: 10, width: 10, height: 0.6, weight: 1.2 },
    sku: 'GIK-UTL-0003',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: null,
    careInstructions:
      'Allow brass to patina naturally, or polish gently with lemon and salt for a brighter finish. Do not submerge in water. Cork base can be wiped with a damp cloth.',
    relatedProducts: ['util-004', 'util-001', 'panel-003'],
  },
  {
    id: 'util-004',
    name: 'Ankura Wall Hooks',
    slug: 'ankura-wall-hooks',
    category: 'utility',
    price: 3600,
    description: 'The geometry of holding on, beautifully.',
    longDescription:
      'Ankura -- meaning sprout -- is a set of five hand-forged wall hooks sculpted from reclaimed iron railway spikes sourced from decommissioned narrow-gauge lines in Darjeeling. Each hook carries the memory of journeys in its metal, reborn now as a graceful arc that holds your coat, your keys, your daily rituals. Finished with a food-safe beeswax sealant to prevent rust.',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80',
      'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=800&q=80',
    ],
    material: 'Reclaimed iron railway spikes with beeswax finish',
    origin: 'Forged in Bastar, Chhattisgarh',
    dimensions: { length: 4, width: 6, height: 8, weight: 0.45 },
    sku: 'GIK-UTL-0004',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: null,
    careInstructions:
      'Reapply beeswax coating annually. If surface rust appears, sand lightly with fine-grit sandpaper and recoat. Each hook supports up to 5 kg.',
    relatedProducts: ['util-005', 'util-001', 'panel-002'],
  },
  {
    id: 'util-005',
    name: 'Prahar Key Tray',
    slug: 'prahar-key-tray',
    category: 'utility',
    price: 2500,
    description: 'The first thing you touch when you come home to yourself.',
    longDescription:
      'Prahar marks the ancient Indian division of the day into eight watches. This shallow tray, carved from a single piece of reclaimed sheesham, becomes the threshold object of your home -- the place where the outside world is gently set down. Its subtle dish curve is achieved through steam-bending, not routing, preserving the integrity of the grain throughout.',
    images: [
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
      'https://images.unsplash.com/photo-1556909172-89cf0b8fdc9f?w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80',
    ],
    material: 'Reclaimed sheesham (Indian rosewood) with linseed oil finish',
    origin: 'Crafted in Saharanpur, Uttar Pradesh',
    dimensions: { length: 22, width: 12, height: 3, weight: 0.3 },
    sku: 'GIK-UTL-0005',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: null,
    careInstructions:
      'Oil with food-grade linseed oil quarterly. Avoid placing wet objects directly on surface. Natural colour variation is a hallmark of authenticity.',
    relatedProducts: ['util-004', 'util-001', 'util-006'],
  },
  {
    id: 'util-006',
    name: 'Dhara Tissue Holder',
    slug: 'dhara-tissue-holder',
    category: 'utility',
    price: 3400,
    description: 'Even the ordinary deserves an extraordinary home.',
    longDescription:
      'Dhara reimagines the mundane tissue box as an object of quiet luxury. Constructed from upcycled copper sheets hand-hammered by fifth-generation Tambat artisans in Pune, the holder features a seamless curved top with a precisely laser-cut dispensing slot. Over months, the copper develops a living verde patina that makes each piece increasingly unique to its environment.',
    images: [
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
      'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800&q=80',
    ],
    material: 'Upcycled hand-hammered copper sheet',
    origin: 'Crafted in Pune, Maharashtra',
    dimensions: { length: 26, width: 14, height: 9, weight: 0.7 },
    sku: 'GIK-UTL-0006',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: null,
    careInstructions:
      'Embrace the natural patina or restore shine with a paste of tamarind and salt. Rinse and dry immediately after cleaning. Do not use chemical polishes.',
    relatedProducts: ['util-003', 'util-002', 'panel-005'],
  },
];

// =============================================================================
// GIK Align - Sacred & Spiritual Objects
// =============================================================================

const alignProducts: Product[] = [
  {
    id: 'align-001',
    name: 'Dhyana Meditation Frame',
    slug: 'dhyana-meditation-frame',
    category: 'align',
    price: 7500,
    description: 'A window into the space between breaths.',
    longDescription:
      'The Dhyana frame is not meant to hold a photograph. It holds emptiness -- a deliberate void framed in reclaimed Burma teak, designed to become the focal point of your meditation practice. The proportions follow the Sri Yantra geometry, and the inner surface is treated with a matte black clay finish sourced from the banks of the Narmada river. Place it where your gaze naturally falls during stillness.',
    images: [
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80',
      'https://images.unsplash.com/photo-1574739782594-db4ead022697?w=800&q=80',
    ],
    material: 'Reclaimed Burma teak with Narmada river clay inlay',
    origin: 'Crafted in Auroville, Tamil Nadu',
    dimensions: { length: 30, width: 3, height: 30, weight: 1.1 },
    sku: 'GIK-ALN-0001',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: {
      placement:
        'Position at eye level on the east-facing wall of your meditation space. The east direction channels pranic energy and aligns with the rising sun, supporting morning sadhana.',
      bestFor:
        'Daily meditation, pranayama focus, and cultivating ekagrata (single-pointed concentration). Ideal for northeast or east zones of the home per Vaastu Shastra.',
    },
    careInstructions:
      'Dust with a soft dry brush. The clay surface should not be touched with wet hands. If the teak frame dulls over time, restore with a thin application of cold-pressed coconut oil.',
    relatedProducts: ['align-002', 'align-003', 'panel-001'],
  },
  {
    id: 'align-002',
    name: 'Sugandha Incense Holder',
    slug: 'sugandha-incense-holder',
    category: 'align',
    price: 3800,
    description: 'Where smoke becomes prayer becomes architecture.',
    longDescription:
      'Sugandha channels the ancient art of dhoop through a sculptural form carved from a single piece of reclaimed Himalayan walnut. The channel is calibrated to hold both Japanese-style koh sticks and traditional Indian agarbatti, while the integrated ash channel eliminates scatter. A small brass inlay at the base -- sourced from melted-down vintage Benarasi ghungroos -- catches falling embers with grace.',
    images: [
      'https://images.unsplash.com/photo-1602192509154-0b900ee1f851?w=800&q=80',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80',
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    ],
    material: 'Reclaimed Himalayan walnut with recycled brass inlay',
    origin: 'Crafted in Almora, Uttarakhand',
    dimensions: { length: 30, width: 5, height: 3, weight: 0.4 },
    sku: 'GIK-ALN-0002',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: {
      placement:
        'Place in the northeast corner (Ishan Kon) of your living space or puja room. This direction is governed by water element and benefits from the purifying nature of incense smoke.',
      bestFor:
        'Evening sandhya rituals, space cleansing, and establishing a fragrant boundary between the sacred and the mundane. Excellent for the puja room or meditation corner.',
    },
    careInstructions:
      'Clean ash residue after each use with a soft brush. Oil the walnut channel monthly with almond oil to prevent smoke staining from becoming permanent. Brass inlay will patina naturally.',
    relatedProducts: ['align-001', 'align-004', 'align-006'],
  },
  {
    id: 'align-003',
    name: 'Sthaan Prayer Shelf',
    slug: 'sthaan-prayer-shelf',
    category: 'align',
    price: 12500,
    description: 'A temple that fits on your wall, and in your heart.',
    longDescription:
      'Sthaan reimagines the traditional home mandir as a minimalist floating shelf of profound intentionality. Constructed from reclaimed plantation teak with hand-hammered recycled copper accents, it provides a consecrated surface for your deities, offerings, and daily devotion without the visual heaviness of conventional designs. The copper lip at the front prevents items from slipping, while the hidden French cleat mounting system makes the shelf appear to levitate against the wall.',
    images: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80',
    ],
    material: 'Reclaimed plantation teak with hand-hammered recycled copper lip',
    origin: 'Crafted in Channapatna, Karnataka',
    dimensions: { length: 60, width: 20, height: 8, weight: 3.2 },
    sku: 'GIK-ALN-0003',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: {
      placement:
        'Mount on the northeast wall at a height where offerings are at heart level when standing. Per Vaastu, the northeast is the most auspicious zone for worship, channelling cosmic energy into the home.',
      bestFor:
        'Daily puja, housing murtis and sacred objects, and creating a dedicated worship zone in modern apartments where a full mandir room is not possible.',
    },
    careInstructions:
      'Wipe teak surface with a damp cloth after puja to remove kumkum or haldi stains promptly. Polish copper lip with lemon juice quarterly. Supports up to 8 kg evenly distributed. Wall anchors included.',
    relatedProducts: ['align-002', 'align-004', 'align-005'],
  },
  {
    id: 'align-004',
    name: 'Vedika Altar Piece',
    slug: 'vedika-altar-piece',
    category: 'align',
    price: 18500,
    description: 'The centre of the home, rediscovered.',
    longDescription:
      'Vedika is a freestanding altar crafted for the contemporary devotee. Built from reclaimed railway sleeper wood -- some pieces over 80 years old -- and finished with natural indigo pigment and beeswax, it stands as a sculptural presence even when not in active worship. The three-tiered design follows the Vedic concept of triloka (three worlds), with each level slightly offset to create a dynamic visual rhythm. Brass feet salvaged from colonial-era furniture raise the piece off the floor, allowing air and light to pass beneath.',
    images: [
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80',
      'https://images.unsplash.com/photo-1574739782594-db4ead022697?w=800&q=80',
      'https://images.unsplash.com/photo-1602192509154-0b900ee1f851?w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    ],
    material: 'Reclaimed railway sleeper wood with indigo pigment and salvaged brass feet',
    origin: 'Crafted in Jodhpur, Rajasthan',
    dimensions: { length: 45, width: 30, height: 50, weight: 6.5 },
    sku: 'GIK-ALN-0004',
    inStock: true,
    isLimited: true,
    limitedEdition: 50,
    spiritualSignificance: {
      placement:
        'Position in the northeast quadrant of the home on a clean, stable surface. The altar should face east or west so that the devotee faces east during prayer, receiving the first rays of spiritual energy.',
      bestFor:
        'Establishing a permanent sacred space in the home. The three tiers accommodate deities on top, ritual items in the middle, and offerings at the base -- following traditional temple architecture in miniature.',
    },
    careInstructions:
      'The indigo finish is living -- it will shift in tone over years of exposure to incense smoke and natural light. Embrace this transformation. Clean brass feet with tamarind paste if desired. Avoid dragging across floors.',
    relatedProducts: ['align-003', 'align-005', 'align-001'],
  },
  {
    id: 'align-005',
    name: 'Jaal Crystal Grid',
    slug: 'jaal-crystal-grid',
    category: 'align',
    price: 6800,
    description: 'Sacred geometry, held in reclaimed hands.',
    longDescription:
      'The Jaal Crystal Grid is laser-engraved onto a disc of compressed recycled hardwood composite, featuring the Flower of Life pattern rendered with mathematical precision. Twenty-one precisely milled depressions hold crystals, stones, or sacred objects in geometric alignment. The word jaal means net or lattice in Hindi, and this piece creates an energetic lattice in your space. Each grid comes wrapped in handloom cotton with a guide to seven classical crystal arrangements.',
    images: [
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80',
    ],
    material: 'Compressed recycled hardwood composite with laser engraving',
    origin: 'Crafted in Auroville, Tamil Nadu',
    dimensions: { length: 30, width: 30, height: 1.5, weight: 0.8 },
    sku: 'GIK-ALN-0005',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: {
      placement:
        'Place in the centre of a room or on a stable surface in the northeast sector. The grid can also be placed under a meditation seat. Avoid placing near electronic devices which may interfere with subtle energies.',
      bestFor:
        'Crystal healing layouts, intention-setting rituals, and amplifying the energy of sacred stones. Works beautifully as a centrepiece for new moon and full moon ceremonies.',
    },
    careInstructions:
      'Dust with a soft brush. Do not wet the surface -- the compressed wood composite may swell. Store flat when not in use. Crystals not included.',
    relatedProducts: ['align-001', 'align-006', 'align-003'],
  },
  {
    id: 'align-006',
    name: 'Mrittika Diya Set',
    slug: 'mrittika-diya-set',
    category: 'align',
    price: 4200,
    description: 'Seven flames, one intention, clay memory.',
    longDescription:
      'Mrittika is a set of seven hand-thrown diyas crafted from clay reclaimed from demolished Lucknowi havelis, mixed with rice husk ash for strength. Each diya is slightly different in form -- as all handmade things should be -- yet they share a unifying language of soft curves and unglazed warmth. The set arrives in a jute-wrapped terracotta tray that doubles as a display base. When lit together, they create a constellation of light that transforms any surface into a sanctuary.',
    images: [
      'https://images.unsplash.com/photo-1574739782594-db4ead022697?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    ],
    material: 'Reclaimed Lucknowi haveli clay with rice husk ash, terracotta tray',
    origin: 'Crafted in Lucknow, Uttar Pradesh',
    dimensions: { length: 35, width: 12, height: 5, weight: 1.4 },
    sku: 'GIK-ALN-0006',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: {
      placement:
        'Arrange in the south or southeast sector of the home to honour Agni (fire element). During festivals, place at the entrance facing outward to welcome Lakshmi. Can also line a windowsill in the east for morning light rituals.',
      bestFor:
        'Diwali celebrations, daily sandhya aarti, and creating ambient sacred light. The seven diyas correspond to the seven chakras when arranged in a line during meditation.',
    },
    careInstructions:
      'Remove oil residue after each use with warm water and mild soap. Allow to dry completely before storing. Terracotta tray should be oiled with mustard oil annually to prevent cracking. Small hairline marks are natural.',
    relatedProducts: ['align-002', 'align-003', 'util-003'],
  },
];

// =============================================================================
// GIK Panel - Art Deco Statement Pieces
// =============================================================================

const panelProducts: Product[] = [
  {
    id: 'panel-001',
    name: 'Vriksha Wall Panel',
    slug: 'vriksha-wall-panel',
    category: 'panel',
    price: 22000,
    description: 'A forest remembered in a single plane of reclaimed wood.',
    longDescription:
      'Vriksha -- meaning tree -- is a large-format wall panel assembled from over forty individual strips of reclaimed wood sourced from demolished homes, old boats, and retired looms across South India. Each strip retains its original finish, creating a painterly gradient of weathered whites, deep indigos, sun-bleached greys, and aged honeys. The panel is mounted on a hidden aluminium frame for structural integrity while maintaining the illusion of floating weight. This is not decoration. This is biography.',
    images: [
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    ],
    material: 'Multi-source reclaimed wood on aluminium frame',
    origin: 'Assembled in Auroville, Tamil Nadu',
    dimensions: { length: 120, width: 5, height: 80, weight: 12 },
    sku: 'GIK-PNL-0001',
    inStock: true,
    isLimited: true,
    limitedEdition: 25,
    spiritualSignificance: null,
    careInstructions:
      'Dust monthly with a soft-bristle brush following the grain direction. Do not apply any oils or polishes -- the varied finishes are intentionally preserved in their found state. Wall must support 15 kg. Professional mounting recommended.',
    relatedProducts: ['panel-002', 'panel-003', 'align-001'],
  },
  {
    id: 'panel-002',
    name: 'Rekha Art Frame Trio',
    slug: 'rekha-art-frame-trio',
    category: 'panel',
    price: 14500,
    description: 'Three frames, three silences, one conversation.',
    longDescription:
      'Rekha is a set of three asymmetric frames carved from upcycled architectural salvage -- window frames, door lintels, and ceiling beams from Rajasthani havelis facing demolition. Each frame is a different proportion but shares a common depth and finish language, creating a triptych effect when hung together. They arrive empty by design: fill them with art, with fabric, with photographs, or with nothing at all. Emptiness, too, is a statement.',
    images: [
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
      'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    ],
    material: 'Upcycled Rajasthani haveli architectural salvage',
    origin: 'Crafted in Jodhpur, Rajasthan',
    dimensions: { length: 45, width: 4, height: 60, weight: 4.5 },
    sku: 'GIK-PNL-0002',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: null,
    careInstructions:
      'These frames celebrate imperfection. Existing nail holes, paint traces, and weathering are features, not flaws. Dust gently. Do not sand or refinish. Hanging hardware and a layout template included.',
    relatedProducts: ['panel-001', 'panel-004', 'util-004'],
  },
  {
    id: 'panel-003',
    name: 'Shikhara Sculptural Shelf',
    slug: 'shikhara-sculptural-shelf',
    category: 'panel',
    price: 16800,
    description: 'Part shelf, part sculpture, wholly itself.',
    longDescription:
      'Named after the towering spires of Indian temple architecture, Shikhara is a wall-mounted sculptural shelf that defies the boundary between furniture and art. Fabricated from reclaimed steel I-beams sourced from Mumbai textile mills, its three cantilevered platforms appear to defy gravity. Each platform is finished with a layer of crushed recycled glass aggregate set in natural resin, creating a surface that shimmers like distant water. It holds books, objects, and the attention of everyone who enters the room.',
    images: [
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    ],
    material: 'Reclaimed steel I-beams with crushed recycled glass and natural resin surface',
    origin: 'Fabricated in Mumbai, Maharashtra',
    dimensions: { length: 80, width: 25, height: 100, weight: 14 },
    sku: 'GIK-PNL-0003',
    inStock: true,
    isLimited: true,
    limitedEdition: 30,
    spiritualSignificance: null,
    careInstructions:
      'Wipe resin surfaces with a damp cloth. Do not use abrasive cleaners on the glass aggregate. Steel frame can be wiped with a dry cloth -- the industrial patina is intentional. Wall must support 20 kg. Each platform holds up to 5 kg. Professional installation included.',
    relatedProducts: ['panel-001', 'panel-005', 'util-003'],
  },
  {
    id: 'panel-004',
    name: 'Kaal Statement Clock',
    slug: 'kaal-statement-clock',
    category: 'panel',
    price: 9800,
    description: 'Time, measured in texture and reclaimed truth.',
    longDescription:
      'Kaal -- the Sanskrit word for time -- strips the wall clock back to its essential poetry. The face is a single disc of cross-cut reclaimed teak, preserving the tree\'s growth rings as a natural dial. Minimal brass hour markers are inlaid into the wood, and the silent quartz movement ensures that time passes without announcing itself. The hands are fashioned from blackened recycled steel, sharp enough to cast shadows but gentle enough to honour the wood beneath.',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=800&q=80',
    ],
    material: 'Cross-cut reclaimed teak with brass markers and recycled steel hands',
    origin: 'Crafted in Puducherry, Tamil Nadu',
    dimensions: { length: 35, width: 4, height: 35, weight: 1.8 },
    sku: 'GIK-PNL-0004',
    inStock: true,
    isLimited: false,
    limitedEdition: null,
    spiritualSignificance: null,
    careInstructions:
      'Dust face with a soft cloth. Replace AA battery annually. Do not hang in areas of high humidity. The teak disc may develop hairline cracks over time -- these are natural and add character. Clock mechanism has a 2-year warranty.',
    relatedProducts: ['panel-002', 'panel-005', 'util-001'],
  },
  {
    id: 'panel-005',
    name: 'Chitra Mosaic Wall Art',
    slug: 'chitra-mosaic-wall-art',
    category: 'panel',
    price: 25000,
    description: 'A thousand fragments finding their wholeness on your wall.',
    longDescription:
      'Chitra is a large-scale mosaic art piece assembled from over a thousand fragments of reclaimed ceramic tiles, broken bangles, vintage mirror shards, and crushed semi-precious stone -- all collected from demolition sites, bangle-making workshops, and gem-cutting facilities across Rajasthan and Gujarat. Set into a concrete composite board and sealed with museum-grade resin, the piece captures light differently at every hour, becoming a living surface that changes with the day. Each Chitra is one of one.',
    images: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
    ],
    material:
      'Reclaimed ceramic, glass bangles, vintage mirror, semi-precious stone on concrete composite',
    origin: 'Assembled in Jaipur, Rajasthan',
    dimensions: { length: 90, width: 4, height: 90, weight: 18 },
    sku: 'GIK-PNL-0005',
    inStock: true,
    isLimited: true,
    limitedEdition: 15,
    spiritualSignificance: null,
    careInstructions:
      'Dust with a soft dry brush. The resin seal protects against moisture but avoid direct water contact. Do not attempt to remove or replace individual mosaic pieces. Wall must support 22 kg minimum. White-glove delivery and professional installation included with purchase.',
    relatedProducts: ['panel-001', 'panel-003', 'panel-002'],
  },
  {
    id: 'panel-006',
    name: 'Leher Undulating Shelf',
    slug: 'leher-undulating-shelf',
    category: 'panel',
    price: 19500,
    description: 'A wave frozen mid-crest, holding your world.',
    longDescription:
      'Leher -- meaning wave -- is a statement shelf that brings organic fluidity to rigid walls. Steam-bent from strips of reclaimed bamboo laminate sourced from retired scaffolding in Kerala, its undulating form creates three natural cradles for books, objects, or plants. The surface is finished with cashew nut shell liquid (CNSL), a traditional Kerala waterproofing technique that gives the bamboo a deep amber warmth. Wall-mounted with concealed brackets, Leher appears to ripple out of the wall itself.',
    images: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
      'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=800&q=80',
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80',
    ],
    material: 'Reclaimed bamboo laminate with CNSL (cashew nut shell liquid) finish',
    origin: 'Crafted in Fort Kochi, Kerala',
    dimensions: { length: 100, width: 22, height: 40, weight: 5.5 },
    sku: 'GIK-PNL-0006',
    inStock: true,
    isLimited: true,
    limitedEdition: 40,
    spiritualSignificance: null,
    careInstructions:
      'Wipe with a dry cloth. CNSL finish is naturally water-resistant but prolonged moisture should be avoided. Each cradle supports up to 4 kg. Do not place heavy objects at the thinnest points of the wave. Concealed bracket mounting kit and template included.',
    relatedProducts: ['panel-003', 'panel-001', 'util-006'],
  },
];

// =============================================================================
// Combined Products Array
// =============================================================================

export const products: Product[] = [
  ...utilityProducts,
  ...alignProducts,
  ...panelProducts,
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getProductBySlug(
  category: Category,
  slug: string
): Product | undefined {
  return products.find(
    (product) => product.category === category && product.slug === slug
  );
}

export function getProductsByCategory(category: Category): Product[] {
  return products.filter((product) => product.category === category);
}

export function getRelatedProducts(productId: string): Product[] {
  const product = products.find((p) => p.id === productId);
  if (!product) return [];
  return product.relatedProducts
    .map((relId) => products.find((p) => p.id === relId))
    .filter((p): p is Product => p !== undefined);
}

export function getLimitedEditionProducts(): Product[] {
  return products.filter((product) => product.isLimited);
}

export function searchProducts(query: string): Product[] {
  const lower = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lower) ||
      product.description.toLowerCase().includes(lower) ||
      product.material.toLowerCase().includes(lower) ||
      product.origin.toLowerCase().includes(lower)
  );
}
