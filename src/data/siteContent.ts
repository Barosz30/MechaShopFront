import type { FAQItem, Testimonial } from '../types';
import { storefrontSectionRoutes } from '../config/routes';

export const navLinks = [
  { label: 'Shop', href: storefrontSectionRoutes.shop },
  { label: 'Categories', href: storefrontSectionRoutes.categories },
  { label: 'Deals', href: storefrontSectionRoutes.deals },
  { label: 'Reviews', href: storefrontSectionRoutes.reviews },
  { label: 'FAQ', href: storefrontSectionRoutes.faq },
];

export const testimonials: Testimonial[] = [
  {
    quote: 'My Aurora TKL Pro showed up feeling every bit as dialed-in as the photos. The sound profile and finish made it an instant desk upgrade.',
    name: 'Aria Chen',
    title: 'Daily driver buyer',
  },
  {
    quote: 'I added switches and a deskmat to hit free shipping, and the whole cart-to-checkout flow stayed quick even while I compared a few options.',
    name: 'Milo Ortega',
    title: 'Keyboard collector',
  },
  {
    quote: 'MechaShop feels curated instead of crowded. The bundles make sense, the filters are fast, and the product cards surface exactly what I need.',
    name: 'Jules Ramirez',
    title: 'Custom build enthusiast',
  },
];

export const faqs: FAQItem[] = [
  {
    question: 'How quickly do in-stock items ship?',
    answer: 'Orders for in-stock items are typically packed within 1 business day and leave the warehouse within 48 hours.',
  },
  {
    question: 'Can I mix products across categories for free shipping?',
    answer: 'Yes. Boards, switches, keycaps, deskmats, and accessories all count toward the $250 free-shipping threshold.',
  },
  {
    question: 'Do you reserve stock once I place an order?',
    answer: 'Yes. Available items are reserved as soon as your order is submitted, and you will receive confirmation details by email.',
  },
  {
    question: 'What happens to spotlight pricing if the timer ends?',
    answer: 'Eligible items added before the timer ends keep their locked spotlight price in cart and checkout for the current session. New adds after the timer use the regular price until the next cycle.',
  },
  {
    question: 'What if I need help matching switches, caps, or accessories?',
    answer: 'Reach out through support and the MechaShop team can help pair layouts, materials, and finishing accessories for your build.',
  },
];

export const footerLinks = [
  { label: 'Shipping', href: storefrontSectionRoutes.deals },
  { label: 'Support', href: storefrontSectionRoutes.faq },
  { label: 'Newsletter', href: storefrontSectionRoutes.newsletter },
  { label: 'Top', href: storefrontSectionRoutes.home },
];
