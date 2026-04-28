export const storefrontSectionRoutes = {
  home: '/',
  shop: '/shop',
  categories: '/categories',
  deals: '/deals',
  reviews: '/reviews',
  faq: '/faq',
  newsletter: '/newsletter',
  cart: '/cart',
  checkout: '/checkout',
  login: '/login',
  signIn: '/sign-in',
  account: '/account',
  profile: '/profile',
  paymentSuccess: '/payment-success',
  paymentCancel: '/payment-cancel',
} as const;

export const storefrontSectionTargets = {
  [storefrontSectionRoutes.shop]: 'products',
  [storefrontSectionRoutes.categories]: 'categories',
  [storefrontSectionRoutes.deals]: 'deals',
  [storefrontSectionRoutes.reviews]: 'testimonials',
  [storefrontSectionRoutes.faq]: 'faq',
  [storefrontSectionRoutes.newsletter]: 'newsletter',
} as const;

export function getProductRoute(productId: number) {
  return `/product/${productId}`;
}
