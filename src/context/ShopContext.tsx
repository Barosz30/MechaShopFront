import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  categories as fallbackCategories,
  freeShippingThreshold,
  getProductPricing,
  products as fallbackProducts,
} from '../data/products';
import {
  fetchCatalogCategories,
  fetchCatalogProducts,
} from '../api/mechanicalShopApi';
import { useWeeklyDeal } from '../hooks/useWeeklyDeal';
import { useTelemetry } from './TelemetryContext';
import type {
  CartItem,
  CartToast,
  Category,
  CategorySlug,
  Product,
} from '../types';

interface ShopContextValue {
  products: Product[];
  categories: Category[];
  weeklyDeal: ReturnType<typeof useWeeklyDeal>;
  cartItems: CartItem[];
  searchQuery: string;
  activeCategory: CategorySlug;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  filteredProducts: Product[];
  cartCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  cartToast: CartToast | null;
  shippingRemaining: number;
  freeShippingProgress: number;
  qualifiesForFreeShipping: boolean;
  isCatalogLoading: boolean;
  catalogStatusMessage: string | null;
  setSearchQuery: (value: string) => void;
  setActiveCategory: (value: CategorySlug) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  completeMockOrder: () => void;
  dismissCartToast: () => void;
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

const cartStorageKey = 'mechashop-cart-v2';

interface StoredCartItem {
  id: number;
  quantity: number;
  price: number;
  originalPrice?: number;
  appliedPromotionId?: CartItem['appliedPromotionId'];
}

interface StoredCartState {
  version: 2;
  items: StoredCartItem[];
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isValidStoredCartState(value: unknown): value is StoredCartState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const parsedValue = value as Partial<StoredCartState>;
  return parsedValue.version === 2 && Array.isArray(parsedValue.items);
}

function buildCartItem(
  product: Product,
  quantity: number,
  weeklyDeal: ReturnType<typeof useWeeklyDeal>,
  lockedPrice?: StoredCartItem,
) {
  const normalizedQuantity = Math.max(1, Math.floor(quantity));

  if (
    lockedPrice?.appliedPromotionId === 'weekly-spotlight' &&
    typeof lockedPrice.originalPrice === 'number' &&
    lockedPrice.originalPrice === product.price &&
    typeof lockedPrice.price === 'number' &&
    lockedPrice.price <= lockedPrice.originalPrice
  ) {
    return {
      ...product,
      quantity: normalizedQuantity,
      price: lockedPrice.price,
      originalPrice: lockedPrice.originalPrice,
      appliedPromotionId: lockedPrice.appliedPromotionId,
    } satisfies CartItem;
  }

  const pricing = getProductPricing(product, weeklyDeal);
  return {
    ...product,
    quantity: normalizedQuantity,
    price: pricing.currentPrice,
    originalPrice: pricing.originalPrice,
    appliedPromotionId: pricing.originalPrice !== undefined ? product.promotion?.id : undefined,
  } satisfies CartItem;
}

function restoreCartItems(weeklyDeal: ReturnType<typeof useWeeklyDeal>, products: Product[]) {
  if (!canUseLocalStorage()) {
    return [] as CartItem[];
  }

  try {
    const rawValue = window.localStorage.getItem(cartStorageKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isValidStoredCartState(parsedValue)) {
      return [];
    }

    return parsedValue.items.reduce<CartItem[]>((restoredItems, storedItem) => {
      if (
        !Number.isFinite(storedItem.id) ||
        !Number.isFinite(storedItem.quantity) ||
        storedItem.quantity <= 0
      ) {
        return restoredItems;
      }

      const product = products.find((candidate) => candidate.id === storedItem.id);
      if (!product) {
        return restoredItems;
      }

      return [
        ...restoredItems,
        buildCartItem(product, storedItem.quantity, weeklyDeal, storedItem),
      ];
    }, []);
  } catch {
    return [];
  }
}

function persistCartItems(cartItems: CartItem[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const payload: StoredCartState = {
      version: 2,
      items: cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        appliedPromotionId: item.appliedPromotionId,
      })),
    };
    window.localStorage.setItem(cartStorageKey, JSON.stringify(payload));
  } catch {
    // Ignore persistence failures and keep in-memory cart functional.
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const weeklyDeal = useWeeklyDeal();
  const { track } = useTelemetry();
  const weeklyDealRef = useRef(weeklyDeal);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(fallbackProducts);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(fallbackCategories);
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    restoreCartItems(weeklyDeal, fallbackProducts),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategorySlug>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartToast, setCartToast] = useState<CartToast | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogStatusMessage, setCatalogStatusMessage] = useState<string | null>(
    'Loading catalog data...',
  );

  const withTimeout = useCallback(
    async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
      let timeoutId: number | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new Error(`${label} request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      }
    },
    [],
  );

  useEffect(() => {
    weeklyDealRef.current = weeklyDeal;
  }, [weeklyDeal]);

  useEffect(() => {
    persistCartItems(cartItems);
  }, [cartItems]);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        const [apiCategories, apiProducts] = await Promise.all([
          withTimeout(fetchCatalogCategories(), 5000, 'categories'),
          withTimeout(fetchCatalogProducts(), 5000, 'products'),
        ]);

        if (!isMounted) {
          return;
        }

        if (apiCategories.length > 0) {
          setCatalogCategories(apiCategories);
        }

        if (apiProducts.length > 0) {
          setCatalogProducts(apiProducts);
          setCartItems((currentItems) => {
            if (currentItems.length > 0) {
              return currentItems;
            }
            return restoreCartItems(weeklyDealRef.current, apiProducts);
          });
        }

        if (apiCategories.length > 0 || apiProducts.length > 0) {
          setCatalogStatusMessage(null);
        } else {
          setCatalogStatusMessage(
            'Live catalog is currently unavailable. Showing local fallback products.',
          );
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setCatalogStatusMessage(
          'Live catalog is currently unavailable. Showing local fallback products.',
        );
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [withTimeout]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return catalogProducts.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${product.name} ${product.category} ${product.badge} ${product.blurb}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery, catalogProducts]);

  const addToCart = useCallback(
    (product: Product) => {
      const cartProduct = buildCartItem(product, 1, weeklyDealRef.current);

      setCartItems((currentItems) => {
        const existingItem = currentItems.find((item) => item.id === product.id);
        if (existingItem) {
          const shouldKeepLockedSpotlightPrice =
            existingItem.appliedPromotionId === 'weekly-spotlight' &&
            typeof existingItem.originalPrice === 'number';

          return currentItems.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  price: shouldKeepLockedSpotlightPrice
                    ? existingItem.price
                    : cartProduct.price,
                  originalPrice: shouldKeepLockedSpotlightPrice
                    ? existingItem.originalPrice
                    : cartProduct.originalPrice,
                  appliedPromotionId: shouldKeepLockedSpotlightPrice
                    ? existingItem.appliedPromotionId
                    : cartProduct.appliedPromotionId,
                }
              : item,
          );
        }

        return [...currentItems, cartProduct];
      });

      setCartToast({
        id: Date.now() + Math.round(Math.random() * 1000),
        name: product.name,
        price: cartProduct.price,
      });

      track('add_to_cart', {
        productId: product.id,
      });
    },
    [track],
  );

  const removeFromCart = useCallback((productId: number) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCartItems((currentItems) => {
      if (quantity <= 0) {
        return currentItems.filter((item) => item.id !== productId);
      }

      return currentItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      );
    });
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const openCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      return;
    }

    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    track('checkout_start', {
      cartCount: cartItems.reduce((count, item) => count + item.quantity, 0),
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    });
  }, [cartItems, track]);

  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);
  const completeMockOrder = useCallback(() => {
    setCartItems([]);
    setIsCheckoutOpen(false);
  }, []);
  const dismissCartToast = useCallback(() => setCartToast(null), []);

  const cartCount = useMemo(
    () => cartItems.reduce((count, item) => count + item.quantity, 0),
    [cartItems],
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;
  const shippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const shippingCost = subtotal === 0 || qualifiesForFreeShipping ? 0 : 18;
  const total = subtotal + shippingCost;

  const value = useMemo(
    () => ({
      products: catalogProducts,
      categories: catalogCategories,
      weeklyDeal,
      cartItems,
      searchQuery,
      activeCategory,
      isCartOpen,
      isCheckoutOpen,
      filteredProducts,
      cartCount,
      subtotal,
      shippingCost,
      total,
      cartToast,
      shippingRemaining,
      freeShippingProgress,
      qualifiesForFreeShipping,
      isCatalogLoading,
      catalogStatusMessage,
      setSearchQuery,
      setActiveCategory,
      addToCart,
      removeFromCart,
      updateQuantity,
      openCart,
      closeCart,
      openCheckout,
      closeCheckout,
      completeMockOrder,
      dismissCartToast,
    }),
    [
      activeCategory,
      addToCart,
      cartCount,
      cartItems,
      cartToast,
      catalogCategories,
      catalogProducts,
      closeCart,
      closeCheckout,
      completeMockOrder,
      dismissCartToast,
      filteredProducts,
      freeShippingProgress,
      isCatalogLoading,
      isCartOpen,
      catalogStatusMessage,
      isCheckoutOpen,
      openCart,
      openCheckout,
      qualifiesForFreeShipping,
      removeFromCart,
      searchQuery,
      shippingCost,
      shippingRemaining,
      subtotal,
      total,
      updateQuantity,
      weeklyDeal,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used inside ShopProvider');
  }
  return context;
}
