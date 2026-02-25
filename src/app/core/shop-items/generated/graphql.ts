export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Category = {
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  shopItems?: Maybe<Array<ShopItem>>;
};

export type CreateCategoryInput = {
  /** Opis kategorii */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Nazwa kategorii */
  name: Scalars['String']['input'];
};

export type CreateShopItemDetailsInput = {
  color: Scalars['String']['input'];
  manufacturer: Scalars['String']['input'];
  material: Scalars['String']['input'];
  weight: Scalars['Float']['input'];
};

export type CreateShopItemInput = {
  /** ID Kategorii do której należy przedmiot */
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  /** Description */
  description?: InputMaybe<Scalars['String']['input']>;
  details?: InputMaybe<CreateShopItemDetailsInput>;
  /** URL obrazu */
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  /** Czy produkt jest dostępny? */
  isAvailable?: InputMaybe<Scalars['Boolean']['input']>;
  /** Name */
  name: Scalars['String']['input'];
  /** Price */
  price: Scalars['Int']['input'];
};

export type GetShopItemsFilterInput = {
  /** ID Kategorii */
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  /** Ile elementów pobrać (limit) */
  limit?: Scalars['Int']['input'];
  /** Cena maksymalna */
  maxPrice?: InputMaybe<Scalars['Float']['input']>;
  /** Cena minimalna */
  minPrice?: InputMaybe<Scalars['Float']['input']>;
  /** Ile elementów pominąć (offset) */
  offset?: Scalars['Int']['input'];
  /** Wyszukaj po nazwie */
  search?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  createCategory: Category;
  createShopItem: ShopItem;
  removeCategory: Category;
  removeShopItem: ShopItem;
  updateCategory: Category;
  updateShopItem: ShopItem;
};


export type MutationCreateCategoryArgs = {
  createCategoryInput: CreateCategoryInput;
};


export type MutationCreateShopItemArgs = {
  createShopItemInput: CreateShopItemInput;
};


export type MutationRemoveCategoryArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveShopItemArgs = {
  id: Scalars['Int']['input'];
};


export type MutationUpdateCategoryArgs = {
  updateCategoryInput: UpdateCategoryInput;
};


export type MutationUpdateShopItemArgs = {
  updateShopItemInput: UpdateShopItemInput;
};

export type Query = {
  categories: Array<Category>;
  category: Category;
  shopItem: ShopItem;
  shopItems: Array<ShopItem>;
};


export type QueryCategoryArgs = {
  id: Scalars['Int']['input'];
};


export type QueryShopItemArgs = {
  id: Scalars['Int']['input'];
};


export type QueryShopItemsArgs = {
  filter?: InputMaybe<GetShopItemsFilterInput>;
};

export type ShopItem = {
  category?: Maybe<Category>;
  /** Description */
  description?: Maybe<Scalars['String']['output']>;
  details?: Maybe<ShopItemDetails>;
  /** ID */
  id: Scalars['Int']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isAvailable: Scalars['Boolean']['output'];
  /** Name */
  name: Scalars['String']['output'];
  /** Price */
  price: Scalars['Int']['output'];
};

export type ShopItemDetails = {
  /** Kolor */
  color: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  /** Producent (np. Shimano) */
  manufacturer: Scalars['String']['output'];
  /** Materiał (np. Carbon) */
  material: Scalars['String']['output'];
  /** Waga w kg */
  weight: Scalars['Float']['output'];
};

export type UpdateCategoryInput = {
  /** Opis kategorii */
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  /** Nazwa kategorii */
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateShopItemInput = {
  /** ID Kategorii do której należy przedmiot */
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  /** Description */
  description?: InputMaybe<Scalars['String']['input']>;
  details?: InputMaybe<CreateShopItemDetailsInput>;
  id: Scalars['Int']['input'];
  /** URL obrazu */
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  /** Czy produkt jest dostępny? */
  isAvailable?: InputMaybe<Scalars['Boolean']['input']>;
  /** Name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Price */
  price?: InputMaybe<Scalars['Int']['input']>;
};
