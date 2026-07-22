import { isFashionCategory, type ArtStyle, type Category, type Product } from "./types";
import type { Filters } from "@/components/consumer/FilterSheet";

export function applyFilters(
  products: Product[],
  query: string,
  filters: Filters,
  category?: Category,
  /**
   * The style catalog, used to resolve the selected style ids (from the filter
   * sheet) to the human-readable names that products are tagged with.
   */
  artStyles?: ArtStyle[],
): Product[] {
  // Keep legacy non-fashion catalog records out of every consumer search and
  // category view while the product is focused exclusively on fashion.
  let list = products.filter((product) => isFashionCategory(product.category));
  if (category && category !== "All") list = list.filter((p) => p.category === category);
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  list = list.filter((p) => p.priceGHS <= filters.priceMax);
  if (filters.sizes.length)
    list = list.filter((p) => p.sizes.some((s) => filters.sizes.includes(s)));
  if (filters.inStockOnly) list = list.filter((p) => !p.soldOut);
  // Style filter: selected ids → tag names, matched against each product's
  // vendor-assigned styleTags (case-insensitive). Products with no tags are
  // excluded once a style filter is active.
  if (filters.styles.length && artStyles?.length) {
    const selectedNames = new Set(
      artStyles
        .filter((s) => filters.styles.includes(s.id))
        .map((s) => s.name.toLowerCase()),
    );
    if (selectedNames.size) {
      list = list.filter((p) =>
        (p.styleTags ?? []).some((t) => selectedNames.has(t.toLowerCase())),
      );
    }
  }
  // origins are illustrative — skip silently
  switch (filters.sort) {
    case "Price Low-High":
      list.sort((a, b) => a.priceGHS - b.priceGHS);
      break;
    case "Price High-Low":
      list.sort((a, b) => b.priceGHS - a.priceGHS);
      break;
    case "Most Popular":
      list.sort((a, b) => b.rating - a.rating);
      break;
    default:
      // Newest: keep original order
      break;
  }
  return list;
}

export const CATEGORIES: Category[] = [
  "All",
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
];
