import { defaultRegionKey, regionalConfigs } from '../config/regions';
import type { Category, DealCycleState, Product } from '../types';

export const freeShippingThreshold = 250;
export const productImageWidth = 900;
export const productImageHeight = 675;
export const heroImageWidth = 1400;
export const heroImageHeight = 933;
export const productCardImageSizes =
  '(min-width: 1280px) 30rem, (min-width: 768px) calc(50vw - 3.5rem), calc(100vw - 2.5rem)';
export const quickViewImageSizes =
  '(min-width: 1280px) 34rem, (min-width: 1024px) calc(50vw - 3rem), calc(100vw - 2rem)';
export const cartItemImageSizes = '96px';
export const checkoutItemImageSizes = '64px';

const weeklySpotlightPromotion = {
  id: 'weekly-spotlight',
  badge: 'Weekly spotlight',
  discountPercent: 18,
} as const;

export const categories: Category[] = [
  {
    slug: 'Keyboards',
    title: 'Custom Keyboards',
    description: 'Prebuilt and enthusiast boards tuned for speed, acoustics, and all-day comfort.',
    accent: 'from-cyan-400/80 to-sky-500/60',
    featured: 'Low-profile, TKL, and premium full-size builds',
  },
  {
    slug: 'Switches',
    title: 'Switch Packs',
    description: 'Linear, tactile, and silent options with hand-picked spring weights and housings.',
    accent: 'from-violet-400/80 to-fuchsia-500/60',
    featured: 'Factory-lubed favorites and boutique switch picks',
  },
  {
    slug: 'Keycaps',
    title: 'Keycap Sets',
    description: 'PBT and ABS sets with striking legends, artisan accents, and durable finishes.',
    accent: 'from-amber-300/80 to-orange-500/60',
    featured: 'Cherry, OEM, and sculpted profile collections',
  },
  {
    slug: 'Deskmats',
    title: 'Deskmats',
    description: 'Statement surfaces that tie together color stories and keep your setup grounded.',
    accent: 'from-emerald-300/80 to-teal-500/60',
    featured: 'Large-format drops with stitched performance edges',
  },
  {
    slug: 'Accessories',
    title: 'Accessories',
    description: 'Cables, knobs, wrist rests, and tuning tools that complete the build.',
    accent: 'from-rose-300/80 to-pink-500/60',
    featured: 'Small details that elevate feel and finish',
  },
];

export const products: Product[] = [
  {
    id: 1,
    name: 'Aurora TKL Pro',
    category: 'Keyboards',
    price: 189,
    rating: 4.9,
    badge: 'Best Seller',
    blurb: 'A gasket-mounted tenkeyless board with dampened acoustics and tri-mode connectivity.',
    description:
      'Aurora TKL Pro balances a crisp competitive layout with a softer, fuller sound profile thanks to layered foam, a flex-tuned plate, and a refined gasket mount.',
    features: [
      'Tri-mode wireless and wired connectivity for desk or travel setups.',
      'Foam-tuned internals for a deeper signature without losing clarity.',
      'Hot-swappable sockets make switch changes fast and tool-friendly.',
    ],
    specs: [
      { label: 'Layout', value: 'TKL / 87-key' },
      { label: 'Mount', value: 'Gasket mount' },
      { label: 'Connectivity', value: 'USB-C, 2.4 GHz, Bluetooth' },
    ],
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80',
    accent: 'from-cyan-400 to-sky-500',
    promotion: weeklySpotlightPromotion,
  },
  {
    id: 2,
    name: 'Forge65 Alloy',
    category: 'Keyboards',
    price: 229,
    rating: 4.8,
    badge: 'Hot Swap',
    blurb: 'CNC aluminum 65% board with a premium weight, flex-cut PCB, and south-facing RGB.',
    description:
      'Forge65 Alloy is aimed at buyers who want a compact metal board with premium heft, flexible typing feel, and the freedom to tune switches and caps over time.',
    features: [
      'CNC aluminum case with a dense premium feel on desk.',
      'Flex-cut PCB adds controlled give for longer typing sessions.',
      'South-facing RGB keeps compatibility clean with enthusiast keycap sets.',
    ],
    specs: [
      { label: 'Layout', value: '65% compact' },
      { label: 'Case', value: 'CNC aluminum' },
      { label: 'PCB', value: 'Hot-swap, south-facing RGB' },
    ],
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=900&q=80',
    accent: 'from-indigo-400 to-violet-500',
  },
  {
    id: 3,
    name: 'Nebula Linear 70-Pack',
    category: 'Switches',
    price: 42,
    rating: 4.7,
    badge: 'Smooth',
    blurb: 'Factory-lubed linears with a clean bottom-out and bright sound profile.',
    description:
      'Nebula Linear switches are built for a smooth stock experience with minimal scratch, fast return, and a lively clack that suits lighter boards and gaming builds.',
    features: [
      'Factory-lubed rails reduce wobble and improve first-install feel.',
      'Bright sound profile pairs well with aluminum and polycarbonate builds.',
      '70-pack covers most compact layouts with a few extras for testing.',
    ],
    specs: [
      { label: 'Pack size', value: '70 switches' },
      { label: 'Feel', value: 'Linear' },
      { label: 'Factory prep', value: 'Pre-lubed' },
    ],
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
    accent: 'from-fuchsia-400 to-purple-500',
    promotion: weeklySpotlightPromotion,
  },
  {
    id: 4,
    name: 'Atlas Tactile 70-Pack',
    category: 'Switches',
    price: 45,
    rating: 4.8,
    badge: 'Tactile',
    blurb: 'Pronounced bump with long-pole stems for crisp feedback and confident typing.',
    description:
      'Atlas Tactile is tuned for shoppers who want a more deliberate press, sharper sound, and a tactile event that stays clear even in foam-heavy boards.',
    features: [
      'Pronounced bump helps with accuracy and confident actuation.',
      'Long-pole stems bring a cleaner, brighter bottom-out character.',
      'Balanced spring weight keeps the switch lively without feeling heavy.',
    ],
    specs: [
      { label: 'Pack size', value: '70 switches' },
      { label: 'Feel', value: 'Tactile' },
      { label: 'Stem style', value: 'Long-pole' },
    ],
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80',
    accent: 'from-emerald-400 to-cyan-500',
  },
  {
    id: 5,
    name: 'Signal PBT Keycap Set',
    category: 'Keycaps',
    price: 89,
    rating: 4.9,
    badge: 'New Drop',
    blurb: 'Dye-sub PBT set with high-contrast legends and a sharp sci-fi accent palette.',
    description:
      'Signal PBT pairs durable dye-sub legends with a bold sci-fi palette, giving boards a bright visual identity without sacrificing day-to-day durability.',
    features: [
      'High-contrast legends stay crisp across long typing sessions.',
      'Durable PBT texture resists shine better than many stock ABS sets.',
      'Accent keys add a faster visual refresh without rebuilding the board.',
    ],
    specs: [
      { label: 'Material', value: 'Dye-sub PBT' },
      { label: 'Profile', value: 'Cherry profile' },
      { label: 'Compatibility', value: '60% to full-size kits' },
    ],
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80',
    accent: 'from-amber-300 to-orange-500',
    promotion: weeklySpotlightPromotion,
  },
  {
    id: 6,
    name: 'Mono Night Keycap Set',
    category: 'Keycaps',
    price: 94,
    rating: 4.7,
    badge: 'Restock',
    blurb: 'Minimal monochrome keycaps with layered icon modifiers and textured PBT finish.',
    description:
      'Mono Night is a restrained monochrome set made for cleaner desk aesthetics, with icon-rich modifier keys and enough texture to keep the board feeling premium.',
    features: [
      'Monochrome colorway works across dark, silver, and transparent builds.',
      'Layered icon modifiers add visual depth without excess clutter.',
      'Textured PBT finish keeps the set feeling dry and controlled.',
    ],
    specs: [
      { label: 'Material', value: 'Textured PBT' },
      { label: 'Profile', value: 'OEM profile' },
      { label: 'Theme', value: 'Monochrome with icon mods' },
    ],
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=900&q=80',
    accent: 'from-slate-300 to-slate-500',
  },
  {
    id: 7,
    name: 'Vector Deskmat',
    category: 'Deskmats',
    price: 34,
    rating: 4.6,
    badge: 'Wide',
    blurb: 'Large stitched deskmat with a radar-grid illustration and smooth speed surface.',
    description:
      'Vector Deskmat gives compact and full-size builds a grounded base with enough room for keyboard, mouse, and accessories while keeping glide quick and consistent.',
    features: [
      'Oversized layout keeps the board and mouse area visually unified.',
      'Stitched edges improve durability during daily desk use.',
      'Smooth speed surface supports gaming and office movement equally well.',
    ],
    specs: [
      { label: 'Size', value: '900 x 400 mm' },
      { label: 'Surface', value: 'Smooth speed weave' },
      { label: 'Edge finish', value: 'Stitched' },
    ],
    image: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=900&q=80',
    accent: 'from-teal-400 to-emerald-500',
  },
  {
    id: 8,
    name: 'Horizon Deskmat',
    category: 'Deskmats',
    price: 38,
    rating: 4.8,
    badge: 'Limited',
    blurb: 'Gradient deskmat inspired by synthwave panels and glowing horizon lines.',
    description:
      'Horizon Deskmat is designed for builders who want their setup to feel more cinematic, with a warmer palette and a smoother visual transition under the whole desk zone.',
    features: [
      'Synthwave-inspired gradient creates a stronger focal point on desk.',
      'Large footprint helps unify keyboard, mouse, and audio gear.',
      'Soft cloth top keeps tracking stable while muting desk noise.',
    ],
    specs: [
      { label: 'Size', value: '900 x 400 mm' },
      { label: 'Style', value: 'Gradient print' },
      { label: 'Base', value: 'Anti-slip rubber' },
    ],
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    accent: 'from-pink-400 to-rose-500',
  },
  {
    id: 9,
    name: 'CoilLink USB-C Cable',
    category: 'Accessories',
    price: 29,
    rating: 4.5,
    badge: 'Match Your Build',
    blurb: 'A coiled aviator cable with flexible sleeving and durable metal connectors.',
    description:
      'CoilLink USB-C Cable is an easy visual upgrade that adds a coiled desk-side profile, sturdy connector hardware, and cleaner cable management for display-ready builds.',
    features: [
      'Coiled host side reduces slack across smaller desks.',
      'Aviator connector makes swaps and storage more convenient.',
      'Sleeved finish helps the cable feel more premium than stock leads.',
    ],
    specs: [
      { label: 'Connector', value: 'USB-C to USB-A' },
      { label: 'Style', value: 'Coiled with aviator disconnect' },
      { label: 'Length', value: '1.5 m total run' },
    ],
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80',
    accent: 'from-cyan-300 to-blue-500',
  },
  {
    id: 10,
    name: 'Forge Wrist Rest',
    category: 'Accessories',
    price: 54,
    rating: 4.7,
    badge: 'Comfort Pick',
    blurb: 'Machined walnut wrist rest with a gentle contour and anti-slip base.',
    description:
      'Forge Wrist Rest adds a warmer material finish to the desk while reducing strain during longer sessions, especially on taller front-profile keyboards.',
    features: [
      'Gentle contour supports wrists without forcing a rigid angle.',
      'Walnut finish adds contrast against metal or monochrome builds.',
      'Anti-slip feet keep alignment steady through long sessions.',
    ],
    specs: [
      { label: 'Material', value: 'Machined walnut' },
      { label: 'Support', value: 'Low-angle contoured top' },
      { label: 'Base', value: 'Anti-slip feet' },
    ],
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=900&q=80',
    accent: 'from-orange-300 to-amber-600',
  },
  {
    id: 11,
    name: 'Pulse75 Wireless',
    category: 'Keyboards',
    price: 209,
    rating: 4.8,
    badge: 'Wireless',
    blurb: 'A compact 75% layout with OLED controls, fast pairing, and rich foam tuning.',
    description:
      'Pulse75 Wireless is made for compact power users who want navigation keys intact, a travel-friendly footprint, and fast access to layers, profiles, and connectivity controls.',
    features: [
      '75% layout keeps arrows and utility keys without wasting desk space.',
      'OLED controls simplify profile switching and battery checks.',
      'Foam tuning brings a fuller signature straight out of the box.',
    ],
    specs: [
      { label: 'Layout', value: '75% compact' },
      { label: 'Display', value: 'Integrated OLED' },
      { label: 'Connectivity', value: 'USB-C, 2.4 GHz, Bluetooth' },
    ],
    image: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=900&q=80',
    accent: 'from-sky-400 to-indigo-500',
    promotion: weeklySpotlightPromotion,
  },
  {
    id: 12,
    name: 'Tune Kit Essentials',
    category: 'Accessories',
    price: 24,
    rating: 4.6,
    badge: 'Starter Kit',
    blurb: 'Puller, brush, switch opener, and lube station for first-time modding sessions.',
    description:
      'Tune Kit Essentials bundles the basic tools most newcomers need to start cleaning, swapping, and lightly tuning a board without piecing together separate accessories.',
    features: [
      'Covers the common first-time tools needed for switch and cap work.',
      'Compact pieces are easy to store between build sessions.',
      'A good add-on for shoppers building a first tuning kit cart.',
    ],
    specs: [
      { label: 'Included', value: 'Puller, brush, opener, lube station' },
      { label: 'Use case', value: 'Beginner modding and maintenance' },
      { label: 'Portability', value: 'Compact starter kit' },
    ],
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    accent: 'from-violet-400 to-fuchsia-500',
  },
];

export function formatPrice(value: number) {
  const defaultRegion = regionalConfigs[defaultRegionKey];

  return new Intl.NumberFormat(defaultRegion.locale, {
    style: 'currency',
    currency: defaultRegion.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getDiscountedPrice(price: number, discountPercent: number) {
  return Math.round(price * (1 - discountPercent / 100));
}

export function getProductPricing(product: Product, dealState: DealCycleState) {
  const promotion = product.promotion;
  const isPromotionActive =
    dealState.phase === 'active' && promotion?.id === weeklySpotlightPromotion.id;

  if (!isPromotionActive || !promotion) {
    return {
      currentPrice: product.price,
      originalPrice: undefined,
      promotionBadge: undefined,
      discountPercent: undefined,
    };
  }

  return {
    currentPrice: getDiscountedPrice(product.price, promotion.discountPercent),
    originalPrice: product.price,
    promotionBadge: promotion.badge,
    discountPercent: promotion.discountPercent,
  };
}

export function buildResponsiveImageUrl(imageUrl: string, width: number) {
  try {
    const url = new URL(imageUrl);

    if (!url.hostname.includes('images.unsplash.com')) {
      return imageUrl;
    }

    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('w', String(width));
    return url.toString();
  } catch {
    return imageUrl;
  }
}

export function buildResponsiveSrcSet(imageUrl: string, widths: number[]) {
  const srcSet = widths
    .map((width) => `${buildResponsiveImageUrl(imageUrl, width)} ${width}w`)
    .join(', ');

  return srcSet.length > 0 ? srcSet : undefined;
}
