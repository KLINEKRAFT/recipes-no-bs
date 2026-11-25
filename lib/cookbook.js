export const CATEGORIES = ["Appetizers", "Mains", "Sides", "Breads", "Sauces", "Desserts", "Other"];

// Older cookbook entries gain categories without a database migration.
export function recipeMetadata(recipe = {}) {
  const title = String(recipe.title || "").toLowerCase();
  let category = CATEGORIES.includes(recipe.category) ? recipe.category : "Other";
  if (category === "Other") {
    if (/\b(pie|cake|cheesecake|crisp|crumble|cookie|brownie|pudding|dessert)\b/.test(title)) category = "Desserts";
    else if (/\bgravy\b/.test(title) || (/\b(sauce|relish|dressing)\b/.test(title) && !/\b(stuffing|turkey|chicken|pasta)\b/.test(title))) category = "Sauces";
    else if (/\b(dip|deviled eggs|baked brie|crostini|appetizer)\b/.test(title)) category = "Appetizers";
    else if (/\b(bread|cornbread|rolls|biscuits|focaccia)\b/.test(title)) category = "Breads";
    else if (/\b(potato|potatoes|stuffing|carrots|beans|sprouts|salad|pilaf|creamed corn|casserole)\b/.test(title)) category = "Sides";
    else if (/\b(turkey|chicken|beef|pork|ham|salmon|pasta|lasagna|steak|meatballs)\b/.test(title)) category = "Mains";
  }
  const tags = Array.isArray(recipe.tags)
    ? [...new Set(recipe.tags.filter(tag => typeof tag === "string").map(tag => tag.trim().slice(0, 30)).filter(Boolean))].slice(0, 6)
    : [];
  return { category, tags };
}

export function cookbookEntry(recipe, url, fields = {}) {
  const metadata = recipeMetadata(recipe);
  return { ...fields, title: recipe.title, source: recipe.source || "", url,
    cook_time: recipe.cook_time || recipe.total_time || "", ...metadata,
    data: { ...recipe, ...metadata } };
}
