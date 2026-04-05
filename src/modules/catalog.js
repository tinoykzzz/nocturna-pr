export const STANDARD_PRICES = {
  polo: 45,
  bividi: 45,
  short: 45,
  polera: 99,
};

export const POLERA_COMPARE_AT_PRICE = 120;

export function getStandardPriceForCategory(category) {
  if (!category) return null;
  return STANDARD_PRICES[category] ?? null;
}

export function normalizeCatalogProducts(items) {
  return items.map((item) => {
    const forcedPrice = getStandardPriceForCategory(item.category);
    if (forcedPrice == null) return item;
    return { ...item, price: forcedPrice };
  });
}
