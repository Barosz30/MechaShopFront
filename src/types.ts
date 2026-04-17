export type CategorySlug =
  | 'All'
  | 'Keyboards'
  | 'Switches'
  | 'Keycaps'
  | 'Deskmats'
  | 'Accessories';

export type PromotionId = 'weekly-spotlight';

export interface ProductPromotion {
  id: PromotionId;
  badge: string;
  discountPercent: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  name: string;
  category: Exclude<CategorySlug, 'All'>;
  price: number;
  rating: number;
  badge: string;
  blurb: string;
  description: string;
  features: string[];
  specs: ProductSpec[];
  image: string;
  accent: string;
  originalPrice?: number;
  appliedPromotionId?: PromotionId;
  promotion?: ProductPromotion;
}

export interface Category {
  slug: Exclude<CategorySlug, 'All'>;
  title: string;
  description: string;
  accent: string;
  featured: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CartToast {
  id: number;
  name: string;
  price?: number;
}

export type DealPhase = 'active' | 'cooldown';

export interface DealCycleState {
  phase: DealPhase;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  countdownTargetDate: number;
  activeUntil: number;
  nextCycleStart: number;
}

export interface RegionConfig {
  locale: string;
  currency: string;
  name: string;
}

export type TelemetryEventName =
  | 'add_to_cart'
  | 'open_quick_view'
  | 'checkout_start'
  | 'checkout_success'
  | 'checkout_error';

export interface TelemetryEventPayload {
  productId?: number;
  route?: string;
  cartCount?: number;
  total?: number;
  reference?: string;
  errorMessage?: string;
}
