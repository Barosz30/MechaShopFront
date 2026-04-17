import type { Category, Product, CategorySlug } from '../types';

interface GraphQlResponse<TData> {
  data?: TData;
  errors?: Array<{ message: string }>;
}

interface BackendCategory {
  id: number;
  name: string;
  description?: string | null;
}

interface BackendShopItem {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  stock?: number | null;
  isAvailable: boolean;
  imageUrl?: string | null;
  category?: BackendCategory | null;
  details?: {
    manufacturer?: string | null;
    material?: string | null;
    weight?: number | null;
    color?: string | null;
  } | null;
}

interface CategoriesQueryData {
  categories: BackendCategory[];
}

interface ShopItemsQueryData {
  shopItems: BackendShopItem[];
}

function normalizeGraphQlUrl(url: string) {
  return url.replace(/\/+$/, '');
}

const backendApiUrl = normalizeGraphQlUrl(
  import.meta.env.VITE_MECHANICAL_SHOP_API_URL ??
    'https://mechanicalshopbackend.onrender.com/graphql',
);

const categorySlugOrder: Array<Exclude<CategorySlug, 'All'>> = [
  'Keyboards',
  'Switches',
  'Keycaps',
  'Deskmats',
  'Accessories',
];

const categoryAccentBySlug: Record<Exclude<CategorySlug, 'All'>, string> = {
  Keyboards: 'from-cyan-400/80 to-sky-500/60',
  Switches: 'from-violet-400/80 to-fuchsia-500/60',
  Keycaps: 'from-amber-300/80 to-orange-500/60',
  Deskmats: 'from-emerald-300/80 to-teal-500/60',
  Accessories: 'from-rose-300/80 to-pink-500/60',
};

const productAccentBySlug: Record<Exclude<CategorySlug, 'All'>, string> = {
  Keyboards: 'from-cyan-400 to-sky-500',
  Switches: 'from-fuchsia-400 to-purple-500',
  Keycaps: 'from-amber-300 to-orange-500',
  Deskmats: 'from-emerald-400 to-teal-500',
  Accessories: 'from-violet-400 to-fuchsia-500',
};

function normalizeCategorySlug(categoryName: string, fallbackIndex = 0): Exclude<CategorySlug, 'All'> {
  const normalized = categoryName.trim().toLowerCase();
  const explicitMap: Record<string, Exclude<CategorySlug, 'All'>> = {
    keyboards: 'Keyboards',
    switches: 'Switches',
    keycaps: 'Keycaps',
    deskmats: 'Deskmats',
    accessories: 'Accessories',
  };

  if (explicitMap[normalized]) {
    return explicitMap[normalized];
  }

  return categorySlugOrder[fallbackIndex % categorySlugOrder.length] ?? 'Accessories';
}

async function executeGraphQl<TData>(query: string, variables?: Record<string, unknown>) {
  const response = await fetch(backendApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphQlResponse<TData>;

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? 'GraphQL request failed');
  }

  if (!payload.data) {
    throw new Error('GraphQL response is missing data');
  }

  return payload.data;
}

function buildSpecs(item: BackendShopItem) {
  return [
    {
      label: 'Manufacturer',
      value: item.details?.manufacturer?.trim() || 'MechaShop Labs',
    },
    {
      label: 'Material',
      value: item.details?.material?.trim() || 'Aluminum',
    },
    {
      label: 'Weight',
      value:
        typeof item.details?.weight === 'number'
          ? `${item.details.weight.toFixed(1)} kg`
          : 'N/A',
    },
  ];
}

function buildFeatures(item: BackendShopItem) {
  return [
    `${item.details?.manufacturer?.trim() || 'MechaShop Labs'} tuned profile for daily use.`,
    `${item.details?.material?.trim() || 'Premium alloy'} construction with consistent finish.`,
    typeof item.stock === 'number' && item.stock >= 0
      ? `${item.stock} units currently in stock.`
      : 'Limited stock availability.',
  ];
}

export async function fetchCatalogCategories(): Promise<Category[]> {
  const query = `
    query Categories {
      categories {
        id
        name
        description
      }
    }
  `;
  const data = await executeGraphQl<CategoriesQueryData>(query);

  return data.categories.map((category, index) => {
    const slug = normalizeCategorySlug(category.name, index);
    return {
      slug,
      title: category.name,
      description:
        category.description?.trim() ||
        'Curated keyboard parts selected for premium builds.',
      accent: categoryAccentBySlug[slug],
      featured: 'Curated mechanical keyboard essentials',
    };
  });
}

export async function fetchCatalogProducts(): Promise<Product[]> {
  const query = `
    query ShopItems($filter: GetShopItemsFilterInput) {
      shopItems(filter: $filter) {
        id
        name
        price
        description
        isAvailable
        stock
        imageUrl
        category {
          id
          name
        }
        details {
          manufacturer
          material
          weight
          color
        }
      }
    }
  `;

  const data = await executeGraphQl<ShopItemsQueryData>(query, {
    filter: {
      limit: 200,
      offset: 0,
      isAvailable: true,
      sortBy: 'CREATED_AT',
      sortOrder: 'DESC',
    },
  });

  return data.shopItems.map((item, index) => {
    const slug = normalizeCategorySlug(item.category?.name ?? '', index);
    const description = item.description?.trim() || `${item.name} for premium mechanical setups.`;
    const badge = item.stock && item.stock > 10 ? 'In Stock' : item.stock && item.stock > 0 ? 'Low Stock' : 'Preorder';

    return {
      id: item.id,
      name: item.name,
      category: slug,
      price: item.price,
      rating: 4.6 + (index % 4) * 0.1,
      badge,
      blurb: description.slice(0, 88),
      description,
      features: buildFeatures(item),
      specs: buildSpecs(item),
      image: item.imageUrl || `https://picsum.photos/seed/mechashop-${item.id}/900/675`,
      accent: productAccentBySlug[slug],
      promotion: index < 4
        ? {
            id: 'weekly-spotlight',
            badge: 'Weekly spotlight',
            discountPercent: 18,
          }
        : undefined,
    };
  });
}
