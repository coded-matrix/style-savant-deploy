import { db, client } from '../config/db';
import {
  users,
  vendors,
  products,
  artStyles,
  presetModels,
  artists,
  backdrops,
  looks,
  subscriptions,
  tokenTransactions,
  orders,
  orderItems,
  bodyMeasurements,
  campaigns,
  salesHistory,
  tryonGallery,
  aiUsageLogs,
} from './schema';
import bcrypt from 'bcryptjs';

const MOCK_UUIDS = {
  v1: '11111111-1111-1111-1111-111111111111',
  v2: '22222222-2222-2222-2222-222222222222',
  v3: '33333333-3333-3333-3333-333333333333',
  p1: 'a1111111-1111-1111-1111-111111111111',
  p2: 'a2222222-2222-2222-2222-222222222222',
  p3: 'a3333333-3333-3333-3333-333333333333',
  p4: 'a4444444-4444-4444-4444-444444444444',
  p5: 'a5555555-5555-5555-5555-555555555555',
  p6: 'a6666666-6666-6666-6666-666666666666',
  p7: 'a7777777-7777-7777-7777-777777777777',
  p8: 'a8888888-8888-8888-8888-888888888888',
  p9: 'a9999999-9999-9999-9999-999999999999',
  p10: 'b1111111-1111-1111-1111-111111111111',
  p11: 'b2222222-2222-2222-2222-222222222222',
  p12: 'b3333333-3333-3333-3333-333333333333',
  p13: 'b4444444-4444-4444-4444-444444444444',
  p14: 'b5555555-5555-5555-5555-555555555555',
  p15: 'b6666666-6666-6666-6666-666666666666',
  p16: 'b7777777-7777-7777-7777-777777777777',
  p17: 'b8888888-8888-8888-8888-888888888888',
  p18: 'b9999999-9999-9999-9999-999999999999',
  user_v1: 'c1111111-1111-1111-1111-111111111111',
  user_v2: 'c2222222-2222-2222-2222-222222222222',
  user_v3: 'c3333333-3333-3333-3333-333333333333',
};

const UNSPLASH_MAP: Record<string, string> = {
  // Onboarding style tiles. Every one must be African fashion worn by an
  // African model — no masks, sculpture, textiles-only or stock filler.
  'style-kente': 'https://images.unsplash.com/photo-1769349661389-0737f39a8507?w=800&q=80',
  'style-ankara': 'https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?w=800&q=80',
  'style-agbada': 'https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=800&q=80',
  'style-street': 'https://images.unsplash.com/photo-1775036760841-6c1854634646?w=800&q=80',
  'style-gele': 'https://images.unsplash.com/photo-1666974932375-90e8a25bc1ef?w=800&q=80',
  'style-royal': 'https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=800&q=80',
  'style-earth': 'https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=800&q=80',
  'style-casual': 'https://images.unsplash.com/photo-1663043994777-7ed4b4e6cba3?w=800&q=80',

  // Models (Presets)
  'model-ama': 'https://images.unsplash.com/photo-1760907949889-eb62b7fd9f75?w=400&q=80',
  'model-kwame': 'https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=400&q=80',
  'model-zola': 'https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?w=400&q=80',
  'model-tariq': 'https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=400&q=80',
  'model-nia': 'https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=400&q=80',
  'model-sefu': 'https://images.unsplash.com/photo-1663044022557-7d5d4c1d5318?w=400&q=80',

  // Artists
  'artist-tunde': 'https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=800&q=80',
  'artist-amina': 'https://images.unsplash.com/photo-1757140448921-f120d58546dc?w=800&q=80',
  
  // Artist Works
  'work-ancestral': 'https://images.unsplash.com/photo-1719169396058-0afb3bf33dd3?w=800&q=80',
  'work-woven': 'https://images.unsplash.com/photo-1756792339487-d044709b27f2?w=800&q=80',
  'work-orishas': 'https://images.unsplash.com/photo-1621419203897-20b66b98d495?w=800&q=80',
  
  // Backdrops
  'bd-studio': 'https://images.unsplash.com/photo-1772033596355-4d39c555fbd9?w=800&q=80',
  'bd-clay': 'https://images.unsplash.com/photo-1781791430158-270e199e21a7?w=800&q=80',
  'bd-coastal': 'https://images.unsplash.com/photo-1765706727592-e9309fbb210a?w=800&q=80',
  'bd-market': 'https://images.unsplash.com/photo-1772033596355-4d39c555fbd9?w=800&q=80',
  'bd-cape': 'https://images.unsplash.com/photo-1775135505494-4c95022d19e2?w=800&q=80',
  'bd-garden': 'https://images.unsplash.com/photo-1781791430158-270e199e21a7?w=800&q=80',
  'bd-neon': 'https://images.unsplash.com/photo-1765706727592-e9309fbb210a?w=800&q=80',
  'bd-dakar': 'https://images.unsplash.com/photo-1775135505494-4c95022d19e2?w=800&q=80',

  // Vendors
  'vendor-maison-logo': 'https://images.unsplash.com/photo-1613876215075-276fd62c89a4?w=200&q=80',
  'vendor-maison-cover': 'https://images.unsplash.com/photo-1769349661389-0737f39a8507?w=1200&q=80',
  'vendor-kente-logo': 'https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?w=200&q=80',
  'vendor-kente-cover': 'https://images.unsplash.com/photo-1681545303529-b6beb2e19f02?w=1200&q=80',
  'vendor-adinkra-logo': 'https://images.unsplash.com/photo-1666974932375-90e8a25bc1ef?w=200&q=80',
  'vendor-adinkra-cover': 'https://images.unsplash.com/photo-1663043994777-7ed4b4e6cba3?w=1200&q=80',

  // Looks
  'look-1': 'https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=800&q=80',
  'look-2': 'https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=800&q=80',
  'look-3': 'https://images.unsplash.com/photo-1760907949889-eb62b7fd9f75?w=800&q=80',
  'look-4': 'https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?w=800&q=80',
  'look-5': 'https://images.unsplash.com/photo-1663044022557-7d5d4c1d5318?w=800&q=80',
  'look-6': 'https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=800&q=80',
};

const photo = (seed: string, w = 800, h = 1000) => {
  return UNSPLASH_MAP[seed] || `https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=${w}&q=80`;
};

// Community avatars. These carry West African names, so the faces must match —
// the previous set paired them with stock portraits of non-African models.
const avatar = (seed: string) => {
  const map: Record<string, string> = {
    'akosua': 'https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?w=120&q=80',
    'kweku': 'https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=120&q=80',
    'zola': 'https://images.unsplash.com/photo-1613876215075-276fd62c89a4?w=120&q=80',
    'tariq': 'https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=120&q=80',
    'nia': 'https://images.unsplash.com/photo-1760907949889-eb62b7fd9f75?w=120&q=80',
    'sefu': 'https://images.unsplash.com/photo-1663044022557-7d5d4c1d5318?w=120&q=80',
  };
  return map[seed] || `https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?w=120&q=80`;
};

// Onboarding style picker. Every tile must read as a *wearable fashion
// aesthetic* — clothing on a person, never sculpture/mask/gallery art, or the
// shopper can't tell what they're opting into.
const ART_STYLES_DATA = [
  { id: 'kente-weave', name: 'Kente & Weave', image: photo('style-kente') },
  { id: 'ankara-print', name: 'Ankara Print', image: photo('style-ankara') },
  { id: 'agbada-kaftan', name: 'Agbada & Kaftan', image: photo('style-agbada') },
  { id: 'afro-street', name: 'Afro Street', image: photo('style-street') },
  { id: 'gele-glamour', name: 'Gele & Glamour', image: photo('style-gele') },
  { id: 'royal-drapes', name: 'Royal Drapes', image: photo('style-royal') },
  { id: 'earth-linen', name: 'Earth & Linen', image: photo('style-earth') },
  { id: 'everyday-casual', name: 'Everyday Casual', image: photo('style-casual') },
];

const PRESET_MODELS_DATA = [
  { id: 'm1', name: 'Ama', thumb: photo('model-ama', 120, 160) },
  { id: 'm2', name: 'Kwame', thumb: photo('model-kwame', 120, 160) },
  { id: 'm3', name: 'Zola', thumb: photo('model-zola', 120, 160) },
  { id: 'm4', name: 'Tariq', thumb: photo('model-tariq', 120, 160) },
  { id: 'm5', name: 'Nia', thumb: photo('model-nia', 120, 160) },
  { id: 'm6', name: 'Sefu', thumb: photo('model-sefu', 120, 160) },
];

const ARTISTS_DATA = [
  {
    id: 'a1',
    name: 'Amara Okafor',
    portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    tagline: 'Digital native exploring the intersection of traditional textile patterns and modern generative design.',
    bio: "Amara Okafor's work captures the vibrant energy of West African heritage through a starkly modern lens. By abstracting traditional Adire motifs into high-contrast digital graphics, she builds spaces where virtual models and ancestral patterns coexist.",
    location: 'Lagos, NG',
    backdropsCount: 12,
    followersCount: '8.4k',
    originalWorks: [
      { id: 'ow1', title: 'Ancestral Grid II', priceGHS: 1200, image: photo('work-ancestral', 600, 600), medium: 'Digital Mixed Media' },
      { id: 'ow2', title: 'Woven Chrome', priceGHS: 980, image: photo('work-woven', 600, 600), medium: '3D Render' },
    ],
  },
  {
    id: 'a2',
    name: 'Tunde Okafor',
    portrait: photo('artist-tunde', 800, 600),
    bio: "Lagos-born digital surrealist. Tunde's work reimagines Yoruba myth through neon and clay, creating backdrops that feel both ancient and electric.",
    location: 'Lagos, Nigeria',
    backdropsCount: 4,
    originalWorks: [
      { id: 'ow3', title: 'Neon Orishas', priceGHS: 1500, image: photo('work-orishas', 600, 600) },
    ],
  },
  {
    id: 'a3',
    name: 'Amina Diallo',
    portrait: photo('artist-amina', 800, 600),
    bio: 'Pan-African abstract painter exploring colour as memory. Her backdrops are studies in saturated minimalism.',
    location: 'Dakar, Senegal',
    backdropsCount: 3,
  },
];

const BACKDROPS_DATA = [
  { id: 'b1', name: 'Studio Plain', artistName: 'Studio', image: photo('bd-studio', 400, 520), premium: false },
  { id: 'b2', name: 'Clay Wall', artistName: 'Studio', image: photo('bd-clay', 400, 520), premium: false },
  { id: 'b3', name: 'Coastal Light', artistName: 'Studio', image: photo('bd-coastal', 400, 520), premium: false },
  { id: 'b4', name: 'Market Alley', artistName: 'Studio', image: photo('bd-market', 400, 520), premium: false },
  { id: 'b5', name: 'Cape Coast Dreams', artistId: 'a1', artistName: 'Amara Okafor', image: photo('bd-cape', 400, 520), premium: true, priceGHS: '15.00' },
  { id: 'b6', name: 'Ancestor\'s Garden', artistId: 'a1', artistName: 'Amara Okafor', image: photo('bd-garden', 400, 520), premium: true, priceGHS: '20.00' },
  { id: 'b7', name: 'Neon Orishas', artistId: 'a2', artistName: 'Tunde Okafor', image: photo('bd-neon', 400, 520), premium: true, priceGHS: '25.00' },
  { id: 'b8', name: 'Dakar Sundown', artistId: 'a3', artistName: 'Amina Diallo', image: photo('bd-dakar', 400, 520), premium: true, priceGHS: '18.00' },
];

const VENDORS_DATA = [
  {
    id: MOCK_UUIDS.v1,
    userId: MOCK_UUIDS.user_v1,
    businessName: "Maison d'Afrik",
    logo: photo('vendor-maison-logo', 96, 96),
    cover: photo('vendor-maison-cover', 800, 320),
    verified: true,
    productsCount: 24,
    looksCount: 312,
    memberSince: 'Jan 2025',
    category: 'Fashion',
    bio: 'Contemporary West African atelier fusing tailoring heritage with streetwear ease.',
    description: 'Contemporary West African atelier fusing tailoring heritage with streetwear ease.',
    businessCallNumber: '+233302000001',
    businessWhatsapp: '+233240000001',
  },
  {
    id: MOCK_UUIDS.v2,
    userId: MOCK_UUIDS.user_v2,
    businessName: 'Kente Collective',
    logo: photo('vendor-kente-logo', 96, 96),
    cover: photo('vendor-kente-cover', 800, 320),
    verified: true,
    productsCount: 18,
    looksCount: 156,
    memberSince: 'Mar 2025',
    category: 'Fashion',
    bio: 'Handwoven Kente textiles turned into modern silhouettes. Bonwire-origin weave.',
    description: 'Handwoven Kente textiles turned into modern silhouettes. Bonwire-origin weave.',
    businessCallNumber: '+233302000002',
    businessWhatsapp: '+233240000002',
  },
  {
    id: MOCK_UUIDS.v3,
    userId: MOCK_UUIDS.user_v3,
    businessName: 'Adinkra Atelier',
    logo: photo('vendor-adinkra-logo', 96, 96),
    cover: photo('vendor-adinkra-cover', 800, 320),
    verified: false,
    productsCount: 9,
    looksCount: 42,
    memberSince: 'Sep 2025',
    category: 'Accessories',
    bio: 'Symbol-led accessories carrying Adinkra proverbs into everyday objects.',
    description: 'Symbol-led accessories carrying Adinkra proverbs into everyday objects.',
    businessCallNumber: '+233302000003',
    businessWhatsapp: '+233240000003',
  },
];

const PRODUCTS_DATA = [
  {
    id: MOCK_UUIDS.p1,
    vendorId: MOCK_UUIDS.v1,
    name: 'Onyx Structure Blazer',
    price: '450.00',
    images: [
      'https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=1200&q=80',
      'https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=1200&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Ankara Pattern', hex: '#E85C33' },
      { name: 'Charcoal', hex: '#2B2B2B' },
    ],
    category: 'Fashion',
    description: 'A vibrant, structured Ankara-print blazer designed for a premium Afro-centric fashion-tech aesthetic. Features a tailored silhouette, architectural shoulders, and bold patterns.',
    deliveryInfo: '2-4 business days within Ghana. International shipping 7-14 days.',
    returnPolicy: '14-day returns on unworn items with tags attached.',
    artLinkedArtistId: 'a1',
    rating: '4.80',
    stockBySize: { XS: true, S: true, M: true, L: true, XL: false, XXL: true },
    communityLookIds: ['l2'],
    stock: 12,
    published: true,
  },
  {
    id: MOCK_UUIDS.p2,
    vendorId: MOCK_UUIDS.v2,
    name: 'Geometric Silk Drape',
    price: '895.00',
    images: [
      'https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=1200&q=80',
      'https://images.unsplash.com/photo-1760907949889-eb62b7fd9f75?w=1200&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Geometric Print', hex: '#7E57C2' }],
    category: 'Fashion',
    description: 'A flowing silk dress showcasing contemporary West African geometric patterns. Elegantly draped fabric creates a striking silhouette with a high-contrast modernism.',
    deliveryInfo: '3-5 business days within Ghana.',
    returnPolicy: '14-day returns on unworn items.',
    rating: '4.70',
    stockBySize: { XS: true, S: true, M: true, L: true, XL: true, XXL: false },
    communityLookIds: ['l2'],
    stock: 20,
    published: true,
  },
  {
    id: MOCK_UUIDS.p3,
    vendorId: MOCK_UUIDS.v3,
    name: 'Adinkra Symbol Tote',
    price: '95.00',
    images: [
      'https://images.unsplash.com/photo-1756792339487-d044709b27f2?w=1200&q=80',
      'https://images.unsplash.com/photo-1574362098421-38623a3466b5?w=1200&q=80',
    ],
    sizes: ['M'],
    colors: [],
    category: 'Accessories',
    description: "Vegetable-tanned leather tote embossed with 'Gye Nyame' — the symbol of God's supremacy.",
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.90',
    stockBySize: { M: true },
    communityLookIds: ['l6'],
    stock: 15,
    published: true,
  },
  {
    id: MOCK_UUIDS.p4,
    vendorId: MOCK_UUIDS.v1,
    name: 'Coastal Linen Shirt',
    price: '180.00',
    images: [
      'https://images.unsplash.com/photo-1663044022557-7d5d4c1d5318?w=1200&q=80',
      'https://images.unsplash.com/photo-1663043994777-7ed4b4e6cba3?w=1200&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Sand', hex: '#D8C9A3' },
      { name: 'Teal', hex: '#2F9C95' },
    ],
    category: 'Fashion',
    description: 'Breathable linen shirt with a relaxed cut. Made for Accra afternoons.',
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    artLinkedArtistId: 'a3',
    rating: '4.60',
    stockBySize: { XS: true, S: true, M: true, L: false, XL: true, XXL: true },
    communityLookIds: ['l3', 'l5'],
    stock: 25,
    published: true,
  },
  {
    id: MOCK_UUIDS.p5,
    vendorId: MOCK_UUIDS.v3,
    name: 'Beaded Collar Necklace',
    price: '70.00',
    images: [
      'https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?w=1200&q=80',
      'https://images.unsplash.com/photo-1613876215075-276fd62c89a4?w=1200&q=80',
    ],
    sizes: ['M'],
    colors: [],
    category: 'Accessories',
    description: 'Hand-strung glass beads in Krobo tradition. A statement collar.',
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.50',
    stockBySize: { M: true },
    communityLookIds: ['l1'],
    stock: 30,
    published: true,
  },
  {
    id: MOCK_UUIDS.p6,
    vendorId: MOCK_UUIDS.v1,
    name: 'Surrealist Drape Dress',
    price: '410.00',
    images: [
      'https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=1200&q=80',
      'https://images.unsplash.com/photo-1681545303529-b6beb2e19f02?w=1200&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Coral', hex: '#FF6B52' }],
    category: 'Fashion',
    description: 'Asymmetric drape dress in coral crepe. Editorial, sculptural, unforgettable.',
    deliveryInfo: '3-5 business days.',
    returnPolicy: '14-day returns.',
    artLinkedArtistId: 'a1',
    rating: '4.90',
    stockBySize: { XS: true, S: true, M: true, L: true, XL: true, XXL: true },
    communityLookIds: ['l1'],
    stock: 12,
    requiresMeasurements: true,
    published: true,
  },
  {
    id: MOCK_UUIDS.p7,
    vendorId: MOCK_UUIDS.v2,
    name: 'Bogolan Mud-Cloth Throw',
    price: '260.00',
    images: [
      'https://images.unsplash.com/photo-1756792339487-d044709b27f2?w=1200&q=80',
      'https://images.unsplash.com/photo-1574362098421-38623a3466b5?w=1200&q=80',
    ],
    sizes: ['M'],
    colors: [],
    category: 'Home Decor',
    description: 'Hand-painted Bogolan textile throw. Earth pigments on cotton.',
    deliveryInfo: '5-7 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.40',
    stockBySize: { M: true },
    communityLookIds: [],
    stock: 5,
    published: true,
  },
  {
    id: MOCK_UUIDS.p8,
    vendorId: MOCK_UUIDS.v3,
    name: 'Bronze Ancestor Bust',
    price: '540.00',
    images: [
      'https://images.unsplash.com/photo-1719169396058-0afb3bf33dd3?w=1200&q=80',
      'https://images.unsplash.com/photo-1719169396171-65edece1112c?w=1200&q=80',
    ],
    sizes: ['M'],
    colors: [],
    category: 'Artefacts',
    description: 'Lost-wax cast bronze bust. A contemporary homage to ancestral portraiture.',
    deliveryInfo: '5-10 business days.',
    returnPolicy: 'Final sale on artefacts.',
    rating: '4.70',
    soldOut: true,
    stockBySize: { M: false },
    communityLookIds: [],
    stock: 0,
    published: true,
  },
  {
    id: MOCK_UUIDS.p9,
    vendorId: MOCK_UUIDS.v2,
    name: 'Neon Orisha Print',
    price: '150.00',
    images: [
      'https://images.unsplash.com/photo-1621419203897-20b66b98d495?w=1200&q=80',
      'https://images.unsplash.com/photo-1695142258282-99f0ac5db788?w=1200&q=80',
    ],
    sizes: ['M'],
    colors: [],
    category: 'Art',
    description: 'Limited giclée print by Tunde Okafor. Signed and numbered.',
    deliveryInfo: '3-5 business days.',
    returnPolicy: '14-day returns on undamaged prints.',
    artLinkedArtistId: 'a2',
    rating: '4.80',
    stockBySize: { M: true },
    communityLookIds: [],
    stock: 7,
    published: true,
  },
  {
    id: MOCK_UUIDS.p10,
    vendorId: MOCK_UUIDS.v1,
    name: 'Leather Slide Sandals',
    price: '130.00',
    images: [
      'https://images.unsplash.com/photo-1757140448921-f120d58546dc?w=1200&q=80',
      'https://images.unsplash.com/photo-1666974932375-90e8a25bc1ef?w=1200&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [],
    category: 'Fashion',
    description: 'Hand-stitched leather slides. Cushioned footbed, everyday luxury.',
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.60',
    stockBySize: { S: true, M: true, L: true, XL: false },
    communityLookIds: ['l2', 'l4', 'l6'],
    stock: 18,
    published: true,
  },
  {
    id: MOCK_UUIDS.p11,
    vendorId: MOCK_UUIDS.v2,
    name: 'Coastal Sundown Scarf',
    price: '60.00',
    images: [
      'https://images.unsplash.com/photo-1613876215075-276fd62c89a4?w=1200&q=80',
      'https://images.unsplash.com/photo-1713845784497-fe3d7ed176d8?w=1200&q=80',
    ],
    sizes: ['M'],
    colors: [],
    category: 'Accessories',
    description: 'Silk-blend scarf in a gradient of Cape Coast sundown tones.',
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.30',
    stockBySize: { M: true },
    communityLookIds: ['l5'],
    stock: 15,
    published: true,
  },
  {
    id: MOCK_UUIDS.p12,
    vendorId: MOCK_UUIDS.v1,
    name: 'Structured Wool Overcoat',
    price: '620.00',
    images: [
      'https://images.unsplash.com/photo-1775036760841-6c1854634646?w=1200&q=80',
      'https://images.unsplash.com/photo-1719169396171-65edece1112c?w=1200&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Charcoal', hex: '#2B2B2B' }],
    category: 'Fashion',
    description: 'Tailored overcoat with architectural shoulders. A modern heirloom.',
    deliveryInfo: '4-6 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.90',
    stockBySize: { XS: true, S: true, M: false, L: true, XL: true, XXL: false },
    communityLookIds: ['l4'],
    stock: 3,
    requiresMeasurements: true,
    published: true,
  },
  {
    id: MOCK_UUIDS.p13,
    vendorId: MOCK_UUIDS.v1,
    name: 'Tan Leather Field Jacket',
    price: '520.00',
    images: [
      'https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=1200&q=80',
      'https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=1200&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Tan', hex: '#B0713B' }],
    category: 'Fashion',
    description: 'Full-grain leather field jacket, vegetable-tanned in Kumasi. Ages beautifully with wear.',
    deliveryInfo: '3-5 business days within Ghana.',
    returnPolicy: '14-day returns on unworn items.',
    rating: '4.70',
    stockBySize: { S: true, M: true, L: true, XL: true, XXL: false },
    communityLookIds: ['l7'],
    stock: 8,
    requiresMeasurements: true,
    published: true,
  },
  {
    id: MOCK_UUIDS.p14,
    vendorId: MOCK_UUIDS.v2,
    name: 'Heritage Organic Tee',
    price: '85.00',
    images: [
      'https://images.unsplash.com/photo-1769349661389-0737f39a8507?w=1200&q=80',
      'https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?w=1200&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Bone', hex: '#F3EFE6' },
      { name: 'Onyx', hex: '#1C1C1C' },
    ],
    category: 'Fashion',
    description: 'Heavyweight organic cotton tee with a subtle Kente-inspired selvedge hem tape.',
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.50',
    stockBySize: { XS: true, S: true, M: true, L: true, XL: true, XXL: true },
    communityLookIds: ['l8'],
    stock: 40,
    published: true,
  },
  {
    id: MOCK_UUIDS.p15,
    vendorId: MOCK_UUIDS.v1,
    name: 'Selvedge Denim Trousers',
    price: '240.00',
    images: [
      'https://images.unsplash.com/photo-1775036760841-6c1854634646?w=1200&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Indigo', hex: '#2E4374' }],
    category: 'Bottoms',
    description: 'Straight-cut selvedge denim, indigo-dyed and finished with Adinkra-stamped rivets. Waist-first sizing.',
    deliveryInfo: '3-5 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.60',
    stockBySize: { XS: true, S: true, M: true, L: true, XL: false, XXL: true },
    communityLookIds: ['l7'],
    stock: 16,
    published: true,
  },
  {
    id: MOCK_UUIDS.p16,
    vendorId: MOCK_UUIDS.v3,
    name: 'Minimal Brass Timepiece',
    price: '310.00',
    images: [
      'https://images.unsplash.com/photo-1613274146063-8930e164c743?w=1200&q=80',
    ],
    sizes: ['M'],
    colors: [],
    category: 'Accessories',
    description: 'Hand-finished brass watch with a Sankofa-engraved caseback. Ghanaian leather strap.',
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.80',
    stockBySize: { M: true },
    communityLookIds: [],
    stock: 10,
    published: true,
  },
  {
    id: MOCK_UUIDS.p17,
    vendorId: MOCK_UUIDS.v3,
    name: 'Safari Canvas Backpack',
    price: '190.00',
    images: [
      'https://images.unsplash.com/photo-1756792339487-d044709b27f2?w=1200&q=80',
    ],
    sizes: ['M'],
    colors: [],
    category: 'Accessories',
    description: 'Waxed canvas and leather-trim backpack with a hand-stamped Dwennimmen strength symbol.',
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.40',
    stockBySize: { M: true },
    communityLookIds: ['l8'],
    stock: 14,
    published: true,
  },
  {
    id: MOCK_UUIDS.p18,
    vendorId: MOCK_UUIDS.v1,
    name: 'Court Low Sneaker',
    price: '150.00',
    images: [
      'https://images.unsplash.com/photo-1613274146063-8930e164c743?w=1200&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Bone', hex: '#F3EFE6' }],
    category: 'Fashion',
    description: 'Clean-lined leather low-top with a gum sole. The everyday anchor of the Maison d\'Afrik wardrobe.',
    deliveryInfo: '2-4 business days.',
    returnPolicy: '14-day returns.',
    rating: '4.50',
    stockBySize: { S: true, M: true, L: true, XL: true },
    communityLookIds: ['l7', 'l8'],
    stock: 22,
    published: true,
  },
];

const LOOKS_DATA = [
  {
    id: 'video-demo-1',
    userId: 'demo-video-user',
    username: 'style_savant_editorial',
    avatar: avatar('akosua'),
    image: '/demo/fashion-look-demo.jpg',
    videoUrl: '/demo/fashion-look-demo.mp4',
    caption: 'Motion editorial: Cape Coast drape study. Tap Try on to wear the featured look.',
    votes: 5000,
    leadProductId: MOCK_UUIDS.p6,
    productIds: [MOCK_UUIDS.p6, MOCK_UUIDS.p5],
    backdropId: 'b6',
    createdAt: new Date(),
  },
  {
    id: 'l1',
    userId: 'u1',
    username: 'akosua_styling',
    avatar: avatar('akosua'),
    image: photo('look-1', 800, 450),
    caption: 'Cape Coast dreams in coral. Paired the drape dress with the Ancestor\'s Garden backdrop.',
    votes: 1240,
    leadProductId: MOCK_UUIDS.p6,
    productIds: [MOCK_UUIDS.p6, MOCK_UUIDS.p5],
    backdropId: 'b6',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: 'l2',
    userId: 'u2',
    username: 'kweku_fits',
    avatar: avatar('kweku'),
    image: photo('look-2', 800, 450),
    caption: 'Indigo wrap over Kente trousers. Editorial energy.',
    votes: 980,
    leadProductId: MOCK_UUIDS.p1,
    productIds: [MOCK_UUIDS.p1, MOCK_UUIDS.p2, MOCK_UUIDS.p10],
    backdropId: 'b5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
  },
  {
    id: 'l3',
    userId: 'u3',
    username: 'zo_style',
    avatar: avatar('zola'),
    image: photo('look-3', 800, 450),
    caption: 'Linen + clay wall = a whole mood.',
    votes: 742,
    leadProductId: MOCK_UUIDS.p4,
    productIds: [MOCK_UUIDS.p4],
    backdropId: 'b2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50),
  },
  {
    id: 'l4',
    userId: 'u4',
    username: 'tariq_wears',
    avatar: avatar('tariq'),
    image: photo('look-4', 800, 450),
    caption: 'Overcoat season. Charcoal on Neon Orishas.',
    votes: 615,
    leadProductId: MOCK_UUIDS.p12,
    productIds: [MOCK_UUIDS.p12, MOCK_UUIDS.p10],
    backdropId: 'b7',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
  },
  {
    id: 'l5',
    userId: 'u5',
    username: 'nia_diaries',
    avatar: avatar('nia'),
    image: photo('look-5', 800, 450),
    caption: 'Minimal silhouette, maximal backdrop.',
    votes: 488,
    leadProductId: MOCK_UUIDS.p4,
    productIds: [MOCK_UUIDS.p4, MOCK_UUIDS.p11],
    backdropId: 'b8',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
  },
  {
    id: 'l6',
    userId: 'u6',
    username: 'sefu_tailored',
    avatar: avatar('sefu'),
    image: photo('look-6', 800, 450),
    caption: 'Adinkra on the move. Tote + slides.',
    votes: 311,
    leadProductId: MOCK_UUIDS.p3,
    productIds: [MOCK_UUIDS.p3, MOCK_UUIDS.p10],
    backdropId: 'b4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
  },
  {
    id: 'l7',
    userId: 'u1',
    username: 'akosua_styling',
    avatar: avatar('akosua'),
    image: 'https://images.unsplash.com/photo-1776880471112-708c211e6a4b?w=800&q=80',
    caption: 'Field jacket over selvedge denim. Kumasi leather does the talking.',
    votes: 402,
    leadProductId: MOCK_UUIDS.p13,
    productIds: [MOCK_UUIDS.p13, MOCK_UUIDS.p15, MOCK_UUIDS.p18],
    backdropId: 'b2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: 'l8',
    userId: 'u4',
    username: 'tariq_wears',
    avatar: avatar('tariq'),
    image: 'https://images.unsplash.com/photo-1769349661389-0737f39a8507?w=800&q=80',
    caption: 'Heavyweight tee, canvas pack, court lows. Off-duty uniform.',
    votes: 268,
    leadProductId: MOCK_UUIDS.p14,
    productIds: [MOCK_UUIDS.p14, MOCK_UUIDS.p17, MOCK_UUIDS.p18],
    backdropId: 'b1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
  },
];

const SUBSCRIPTIONS_DATA = [
  {
    vendorId: MOCK_UUIDS.v1, // Maison d'Afrik
    tokensTotal: 3000,
    tokensUsed: 120,
    status: 'active' as const,
    expiresAt: new Date(Date.now() + 18 * 86400000),
  },
  {
    vendorId: MOCK_UUIDS.v2, // Kente Collective
    tokensTotal: 10000,
    tokensUsed: 4960,
    status: 'active' as const,
    expiresAt: new Date(Date.now() + 25 * 86400000),
  },
  {
    vendorId: MOCK_UUIDS.v3, // Adinkra Atelier
    tokensTotal: 500,
    tokensUsed: 0,
    status: 'active' as const,
    expiresAt: new Date(Date.now() + 5 * 86400000),
  }
];

const TOKEN_TRANSACTIONS_DATA = [
  {
    vendorId: MOCK_UUIDS.v1,
    type: 'purchase' as const,
    amount: 3000,
    balance: 3000,
    description: 'Initial plan allowance (Growth)',
  },
  {
    vendorId: MOCK_UUIDS.v1,
    type: 'usage' as const,
    amount: -80,
    balance: 2920,
    description: 'AI Campaign: Celebrate in Maison d\'Afrik',
  },
  {
    vendorId: MOCK_UUIDS.v1,
    type: 'usage' as const,
    amount: -40,
    balance: 2880,
    description: 'AI Polish: 4 products',
  }
];

const CAMPAIGNS_DATA = [
  {
    id: 'cmp-1',
    vendorId: MOCK_UUIDS.v1,
    title: 'Celebrate in Onyx Structure Blazer — Domestic Drop',
    caption: 'Discover our latest Onyx Structure Blazer, Leather Slide Sandals. Crafted in Ghana with heritage fabrics and modern silhouettes. Designed for a premium Afro-centric fashion-tech aesthetic.',
    hashtags: ['#StyleSavant', '#MadeInGhana', '#Ankara', '#OOTD', '#Accra'],
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80',
    products: [MOCK_UUIDS.p1, MOCK_UUIDS.p10],
    prompt: 'Promote our signature onyx blazer and slides for Accra fashion week.',
    market: 'Domestic',
    format: 'Instagram Post',
    tokens: 80,
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'cmp-2',
    vendorId: MOCK_UUIDS.v1,
    title: 'Woven Heritage — Diaspora Drop',
    caption: 'Experience Maison d\'Afrik\'s handcrafted heirloom garments. Now available for worldwide shipping.',
    hashtags: ['#StyleSavant', '#MadeInGhana', '#Diaspora', '#Heritage'],
    image: 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=1200&q=80',
    products: [MOCK_UUIDS.p1],
    prompt: 'Target young professionals in the UK and US with our structural outerwear.',
    market: 'Diaspora',
    format: 'Instagram Post',
    tokens: 80,
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

async function main() {
  console.log('Seeding database...');

  try {
    console.log('Cleaning existing tables...');
    await db.delete(campaigns);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(bodyMeasurements);
    await db.delete(tryonGallery);
    await db.delete(salesHistory);
    await db.delete(aiUsageLogs);
    await db.delete(tokenTransactions);
    await db.delete(subscriptions);
    await db.delete(looks);
    await db.delete(backdrops);
    await db.delete(artists);
    await db.delete(presetModels);
    await db.delete(artStyles);
    await db.delete(products);
    await db.delete(vendors);
    await db.delete(users);

    // 1. Create Users & Vendors
    console.log('Creating users & vendor profiles...');
    const defaultPasswordHash = await bcrypt.hash('password', 10);

    // Create a generic customer with a fit photo for try-on demo
    const [customer] = await db
      .insert(users)
      .values({
        email: 'customer@example.com',
        password: defaultPasswordHash,
        name: 'Samuel Customer',
        role: 'customer',
        fitPhoto: 'https://images.unsplash.com/photo-1687952622898-4e9514a710d5?w=600&q=80',
      })
      .returning();
    console.log(`Created customer: ${customer.email}`);

    // Create vendor users & profiles
    for (const vData of VENDORS_DATA) {
      const email = `${vData.id.slice(0, 8)}@style-savant.com`;
      await db.insert(users).values({
        id: vData.userId,
        email,
        password: defaultPasswordHash,
        name: vData.businessName,
        role: 'vendor',
      });
      await db.insert(vendors).values(vData);
      console.log(`Created vendor: ${vData.businessName}`);
    }

    // 2. Create Art Styles
    console.log('Seeding art styles...');
    for (const style of ART_STYLES_DATA) {
      await db.insert(artStyles).values(style);
    }

    // 3. Create Preset Models
    console.log('Seeding preset models...');
    for (const model of PRESET_MODELS_DATA) {
      await db.insert(presetModels).values(model);
    }

    // 4. Create Artists
    console.log('Seeding artists...');
    for (const artist of ARTISTS_DATA) {
      await db.insert(artists).values(artist);
    }

    // 5. Create Backdrops
    console.log('Seeding backdrops...');
    for (const backdrop of BACKDROPS_DATA) {
      await db.insert(backdrops).values(backdrop);
    }

    // 6. Create Products
    console.log('Seeding products...');
    for (const product of PRODUCTS_DATA) {
      await db.insert(products).values(product);
    }

    // 7. Create Looks
    console.log('Seeding looks...');
    for (const look of LOOKS_DATA) {
      await db.insert(looks).values(look);
    }

    // 8. Create Subscriptions
    console.log('Seeding subscriptions...');
    for (const sub of SUBSCRIPTIONS_DATA) {
      await db.insert(subscriptions).values(sub);
    }

    // 9. Create Token Transactions
    console.log('Seeding token transactions...');
    for (const tx of TOKEN_TRANSACTIONS_DATA) {
      await db.insert(tokenTransactions).values(tx);
    }

    // 10. Create Campaigns
    console.log('Seeding campaigns...');
    for (const cmp of CAMPAIGNS_DATA) {
      await db.insert(campaigns).values(cmp);
    }

    // 11. Create Customers & Orders
    console.log('Seeding customers, measurements & orders...');
    const createCustomerUser = async (name: string, email: string) => {
      const [u] = await db.insert(users).values({
        email,
        password: defaultPasswordHash,
        name,
        role: 'customer',
      }).returning();
      return u;
    };

    const userAma = await createCustomerUser('Ama Mensah', 'ama@example.com');
    const userKwame = await createCustomerUser('Kwame Osei', 'kwame@example.com');
    const userGrace = await createCustomerUser('Grace Addo', 'grace@example.com');
    const userYaw = await createCustomerUser('Yaw Boateng', 'yaw@example.com');
    const userEfua = await createCustomerUser('Efua Danso', 'efua@example.com');
    const userKojo = await createCustomerUser('Kojo Mensah', 'kojo@example.com');

    // Create measurements for Ama (bespoke)
    const [measAma] = await db.insert(bodyMeasurements).values({
      userId: userAma.id,
      chestInches: '37.80',
      waistInches: '30.70',
      hipsInches: '40.16',
      heightInches: '63.78',
      sleeveLengthInches: '22.83',
      recommendedSize: 'M',
      confidencePercent: 92,
    }).returning();

    // Create measurements for Grace (bespoke)
    const [measGrace] = await db.insert(bodyMeasurements).values({
      userId: userGrace.id,
      chestInches: '40.16',
      waistInches: '33.07',
      hipsInches: '43.31',
      heightInches: '66.93',
      sleeveLengthInches: '23.62',
      recommendedSize: 'L',
      confidencePercent: 88,
    }).returning();

    const baseDate = new Date();

    // Order 1: Ama Mensah (Pending / Bespoke)
    const [order1] = await db.insert(orders).values({
      userId: userAma.id,
      vendorId: MOCK_UUIDS.v1,
      totalAmount: '540.00',
      status: 'pending',
      shippingAddress: {
        name: 'Ama Mensah',
        phone: '+233 24 111 2233',
        line1: '12 Oxford St, Osu',
        city: 'Accra',
        region: 'Greater Accra',
        ghanaPostGps: 'GA-123-4567'
      },
      measurementId: measAma.id,
      createdAt: new Date(baseDate.getTime() - 2 * 86400000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order1.id, productId: MOCK_UUIDS.p6, quantity: 1, price: '410.00' },
      { orderId: order1.id, productId: MOCK_UUIDS.p10, quantity: 1, price: '130.00' },
    ]);

    // Order 2: Kwame Osei (Shipped)
    const [order2] = await db.insert(orders).values({
      userId: userKwame.id,
      vendorId: MOCK_UUIDS.v2,
      totalAmount: '120.00',
      status: 'completed', // Status is enum order_status: 'pending', 'processing', 'completed', 'cancelled'
      shippingAddress: {
        name: 'Kwame Osei',
        phone: '+233 20 444 5566',
        line1: '5 Ringway Est',
        city: 'Accra',
        region: 'Greater Accra',
        ghanaPostGps: 'GA-987-6543'
      },
      paymentReference: 'pay_12345_kwame',
      createdAt: new Date(baseDate.getTime() - 3 * 86400000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order2.id, productId: MOCK_UUIDS.p11, quantity: 2, price: '60.00' }
    ]);

    // Order 3: Grace Addo (Delivered)
    const [order3] = await db.insert(orders).values({
      userId: userGrace.id,
      vendorId: MOCK_UUIDS.v1,
      totalAmount: '410.00',
      status: 'completed',
      shippingAddress: {
        name: 'Grace Addo',
        phone: '+233 27 777 8899',
        line1: '33 Labone Ave',
        city: 'Accra',
        region: 'Greater Accra',
      },
      measurementId: measGrace.id,
      createdAt: new Date(baseDate.getTime() - 5 * 86400000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order3.id, productId: MOCK_UUIDS.p6, quantity: 1, price: '410.00' }
    ]);

    // Order 4: Yaw Boateng (Confirmed -> maps to processing)
    const [order4] = await db.insert(orders).values({
      userId: userYaw.id,
      vendorId: MOCK_UUIDS.v1,
      totalAmount: '180.00',
      status: 'processing',
      shippingAddress: {
        name: 'Yaw Boateng',
        phone: '+233 23 222 3344',
        line1: '8 Tema Comm 4',
        city: 'Tema',
        region: 'Greater Accra',
      },
      createdAt: new Date(baseDate.getTime() - 6 * 86400000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order4.id, productId: MOCK_UUIDS.p4, quantity: 1, price: '180.00' }
    ]);

    // Order 5: Efua Danso (Delivered -> maps to completed)
    const [order5] = await db.insert(orders).values({
      userId: userEfua.id,
      vendorId: MOCK_UUIDS.v3,
      totalAmount: '140.00',
      status: 'completed',
      shippingAddress: {
        name: 'Efua Danso',
        phone: '+233 26 555 6677',
        line1: '21 East Legon',
        city: 'Accra',
        region: 'Greater Accra',
      },
      createdAt: new Date(baseDate.getTime() - 9 * 86400000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order5.id, productId: MOCK_UUIDS.p5, quantity: 2, price: '70.00' }
    ]);

    // Order 6: Kojo Mensah (Cancelled)
    const [order6] = await db.insert(orders).values({
      userId: userKojo.id,
      vendorId: MOCK_UUIDS.v1,
      totalAmount: '450.00',
      status: 'cancelled',
      shippingAddress: {
        name: 'Kojo Mensah',
        phone: '+233 24 888 9900',
        line1: '14 Kasoa',
        city: 'Kasoa',
        region: 'Central Region',
      },
      createdAt: new Date(baseDate.getTime() - 12 * 86400000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order6.id, productId: MOCK_UUIDS.p1, quantity: 1, price: '450.00' }
    ]);

    // Order 8: Abena Owusu (Processing) — new-catalog items, waist-driven sizing
    const userAbena = await createCustomerUser('Abena Owusu', 'abena@example.com');
    const [measAbena] = await db.insert(bodyMeasurements).values({
      userId: userAbena.id,
      chestInches: '36.20',
      waistInches: '29.50',
      hipsInches: '38.60',
      heightInches: '65.35',
      sleeveLengthInches: '22.05',
      inseamInches: '29.50',
      recommendedSize: 'S',
      confidencePercent: 90,
    }).returning();

    const [order8] = await db.insert(orders).values({
      userId: userAbena.id,
      vendorId: MOCK_UUIDS.v1,
      totalAmount: '390.00',
      status: 'processing',
      shippingAddress: {
        name: 'Abena Owusu',
        phone: '+233 55 321 7788',
        line1: '9 Spintex Rd',
        city: 'Accra',
        region: 'Greater Accra',
        ghanaPostGps: 'GA-456-7890'
      },
      measurementId: measAbena.id,
      createdAt: new Date(baseDate.getTime() - 1 * 86400000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order8.id, productId: MOCK_UUIDS.p15, quantity: 1, price: '240.00' },
      { orderId: order8.id, productId: MOCK_UUIDS.p18, quantity: 1, price: '150.00' },
    ]);

    // Create measurements for customer (Samuel Customer)
    console.log('Seeding customer measurements...');
    const [measCustomer] = await db.insert(bodyMeasurements).values({
      userId: customer.id,
      chestInches: '39.50',
      waistInches: '32.00',
      hipsInches: '41.00',
      heightInches: '68.00',
      sleeveLengthInches: '24.00',
      recommendedSize: 'M',
      confidencePercent: 95,
    }).returning();

    // Order 7: Samuel Customer (Completed order of Onyx Blazer and Sandals)
    console.log('Seeding customer orders...');
    const [order7] = await db.insert(orders).values({
      userId: customer.id,
      vendorId: MOCK_UUIDS.v1,
      totalAmount: '580.00',
      status: 'completed',
      shippingAddress: {
        name: 'Samuel Customer',
        phone: '+233 24 999 8877',
        line1: '45 Ring Road',
        city: 'Accra',
        region: 'Greater Accra',
      },
      measurementId: measCustomer.id,
      createdAt: new Date(baseDate.getTime() - 4 * 86400000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order7.id, productId: MOCK_UUIDS.p1, quantity: 1, price: '450.00' },
      { orderId: order7.id, productId: MOCK_UUIDS.p10, quantity: 1, price: '130.00' },
    ]);

    // Seeding Try-On Gallery items for Samuel Customer
    console.log('Seeding try-on gallery...');
    const sampleTryonImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // Tiny valid 1x1 black pixel PNG base64
    await db.insert(tryonGallery).values([
      {
        userId: customer.id,
        productId: MOCK_UUIDS.p1,
        productName: 'Onyx Structure Blazer',
        imageBase64: sampleTryonImageBase64,
        fitPhotoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        createdAt: new Date(baseDate.getTime() - 1 * 86400000),
      },
      {
        userId: customer.id,
        productId: MOCK_UUIDS.p6,
        productName: 'Surrealist Drape Dress',
        imageBase64: sampleTryonImageBase64,
        fitPhotoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        createdAt: new Date(baseDate.getTime() - 2 * 86400000),
      }
    ]);

    // 12. Create Sales History
    console.log('Seeding sales history...');
    await db.insert(salesHistory).values([
      { vendorId: MOCK_UUIDS.v1, productId: MOCK_UUIDS.p1, quantitySold: 12, revenue: '5400.00', saleDate: new Date(baseDate.getTime() - 10 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, productId: MOCK_UUIDS.p1, quantitySold: 8, revenue: '3600.00', saleDate: new Date(baseDate.getTime() - 25 * 86400000) },
      { vendorId: MOCK_UUIDS.v2, productId: MOCK_UUIDS.p2, quantitySold: 15, revenue: '13425.00', saleDate: new Date(baseDate.getTime() - 4 * 86400000) },
      { vendorId: MOCK_UUIDS.v2, productId: MOCK_UUIDS.p2, quantitySold: 5, revenue: '4475.00', saleDate: new Date(baseDate.getTime() - 18 * 86400000) },
      { vendorId: MOCK_UUIDS.v3, productId: MOCK_UUIDS.p3, quantitySold: 25, revenue: '2375.00', saleDate: new Date(baseDate.getTime() - 8 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, productId: MOCK_UUIDS.p4, quantitySold: 18, revenue: '3240.00', saleDate: new Date(baseDate.getTime() - 15 * 86400000) },
      { vendorId: MOCK_UUIDS.v3, productId: MOCK_UUIDS.p5, quantitySold: 30, revenue: '2100.00', saleDate: new Date(baseDate.getTime() - 12 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, productId: MOCK_UUIDS.p6, quantitySold: 7, revenue: '2870.00', saleDate: new Date(baseDate.getTime() - 3 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, productId: MOCK_UUIDS.p10, quantitySold: 22, revenue: '2860.00', saleDate: new Date(baseDate.getTime() - 6 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, productId: MOCK_UUIDS.p13, quantitySold: 4, revenue: '2080.00', saleDate: new Date(baseDate.getTime() - 5 * 86400000) },
      { vendorId: MOCK_UUIDS.v2, productId: MOCK_UUIDS.p14, quantitySold: 34, revenue: '2890.00', saleDate: new Date(baseDate.getTime() - 7 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, productId: MOCK_UUIDS.p15, quantitySold: 9, revenue: '2160.00', saleDate: new Date(baseDate.getTime() - 9 * 86400000) },
      { vendorId: MOCK_UUIDS.v3, productId: MOCK_UUIDS.p16, quantitySold: 6, revenue: '1860.00', saleDate: new Date(baseDate.getTime() - 11 * 86400000) },
      { vendorId: MOCK_UUIDS.v3, productId: MOCK_UUIDS.p17, quantitySold: 11, revenue: '2090.00', saleDate: new Date(baseDate.getTime() - 14 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, productId: MOCK_UUIDS.p18, quantitySold: 17, revenue: '2550.00', saleDate: new Date(baseDate.getTime() - 2 * 86400000) },
    ]);

    // 13. Create AI Usage Logs
    console.log('Seeding AI usage logs...');
    await db.insert(aiUsageLogs).values([
      { vendorId: MOCK_UUIDS.v1, featureType: 'background_removal', tokensCost: 5, success: true, createdAt: new Date(baseDate.getTime() - 1 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, featureType: 'inventory_analysis', tokensCost: 10, success: true, createdAt: new Date(baseDate.getTime() - 2 * 86400000) },
      { vendorId: MOCK_UUIDS.v1, featureType: 'demand_forecast', tokensCost: 15, success: true, createdAt: new Date(baseDate.getTime() - 3 * 86400000) },
      { vendorId: MOCK_UUIDS.v2, featureType: 'background_removal', tokensCost: 5, success: true, createdAt: new Date(baseDate.getTime() - 2 * 86400000) },
      { vendorId: MOCK_UUIDS.v2, featureType: 'demand_forecast', tokensCost: 15, success: true, createdAt: new Date(baseDate.getTime() - 4 * 86400000) },
    ]);

    console.log('Seeding complete! Database is fully populated with frontend mock data.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.end();
  }
}

main();
