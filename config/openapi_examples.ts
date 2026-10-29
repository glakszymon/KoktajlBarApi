const timestamps = {
  created: '2026-10-25T12:00:00.000+00:00',
  updated: '2026-10-25T12:00:00.000+00:00',
}

const ingredientDetails = [
  {
    name: 'Biały rum',
    description: 'Jasny rum na bazie trzciny cukrowej.',
    alcohol: true,
    image: 'bialy-rum',
  },
  {
    name: 'Sok z limonki',
    description: 'Świeżo wyciśnięty sok z limonki.',
    alcohol: false,
    image: 'sok-z-limonki',
    amount: 25,
    unit: 'ml',
  },
  {
    name: 'Woda gazowana',
    description: 'Schłodzona woda gazowana.',
    alcohol: false,
    image: 'woda-gazowana',
    amount: 60,
    unit: 'ml',
  },
  {
    name: 'Syrop cukrowy',
    description: 'Syrop z cukru i wody w proporcji 1:1.',
    alcohol: false,
    image: 'syrop-cukrowy',
    amount: 15,
    unit: 'ml',
  },
  {
    name: 'Mięta',
    description: 'Świeże liście mięty.',
    alcohol: false,
    image: 'mieta',
    amount: 8,
    unit: 'liści',
  },
  {
    name: 'Lód',
    description: 'Kostki lodu do schłodzenia koktajlu.',
    alcohol: false,
    image: 'lod',
    amount: 6,
    unit: 'kostek',
  },
]

export const ingredientExamples = ingredientDetails.map((ingredient, index) => ({
  id: index + 1,
  name: ingredient.name,
  description: ingredient.description,
  alcohol: ingredient.alcohol,
  photo_url: `https://example.com/images/${ingredient.image}.jpg`,
  ...timestamps,
}))

const cocktailIngredients = ingredientDetails.map(({ amount, unit }, index) => ({
  ingredient_id: index + 1,
  amount,
  unit,
}))

export const addIngredientExample = {
  name: ingredientExamples[0].name,
  description: ingredientExamples[0].description,
  alcohol: ingredientExamples[0].alcohol,
  photoUrl: ingredientExamples[0].photo_url,
}
export const updateIngredientExample = {
  description: 'Biały rum o delikatnym aromacie wanilii i trzciny cukrowej.',
  photoUrl: 'https://example.com/images/bialy-rum-butelka.jpg',
}

export const addCocktailExample = {
  name: 'Mojito',
  category: 'Long Drink',
  recipe:
    'Delikatnie ugnieć miętę z sokiem z limonki i syropem cukrowym. Dodaj rum i lód, dopełnij wodą gazowaną i wymieszaj.',
  ingredients: cocktailIngredients,
}
export const updateCocktailExample = {
  recipe: `${addCocktailExample.recipe} Udekoruj gałązką mięty i plasterkiem limonki.`,
}
export const cocktailExample = {
  id: 1,
  userId: 1,
  rating: null,
  alcohol: true,
  ...addCocktailExample,
  ...timestamps,
  ingredients: ingredientExamples.map((ingredient, index) => ({
    ...ingredient,
    amount: cocktailIngredients[index].amount,
    unit: cocktailIngredients[index].unit,
  })),
}

export const paginationExample = {
  page: 1,
  limit: 10,
  category: addCocktailExample.category,
  alcohol: true,
  sortBy: 'id',
  sortOrder: 'asc',
}

export function paginationMetaExample(total: number) {
  return {
    total,
    perPage: 10,
    currentPage: 1,
    lastPage: 1,
    firstPage: 1,
    firstPageUrl: '/?page=1',
    lastPageUrl: '/?page=1',
    nextPageUrl: null,
    previousPageUrl: null,
  }
}

export const schemaExamples: Record<string, unknown> = {
  Cocktail: cocktailExample,
  Ingredient: ingredientExamples[0],
  CocktailIngredient: { id: 1, cocktail_id: 1, ...cocktailIngredients[0], ...timestamps },
  addCocktailValidator: addCocktailExample,
  updateCocktailValidator: updateCocktailExample,
  addIngredientValidator: addIngredientExample,
  updateIngredientValidator: updateIngredientExample,
  cocktailIdValidator: { id: 1 },
  ingredientIdValidator: { id: 1 },
  paginationValidator: paginationExample,
  PaginationMeta: paginationMetaExample(1),
}

export const operationExamples: Record<string, { request?: unknown; response: unknown }> = {
  'GET /cocktails': {
    response: { data: [{ ...cocktailExample, comments: [] }], meta: paginationMetaExample(1) },
  },
  'GET /cocktails/{id}': { response: { ...cocktailExample, comments: [] } },
  'POST /cocktails': { request: addCocktailExample, response: cocktailExample },
  'PATCH /cocktails/{id}': {
    request: updateCocktailExample,
    response: {
      ...cocktailExample,
      ...updateCocktailExample,
      updated: '2026-10-25T12:30:00.000+00:00',
    },
  },
  'DELETE /cocktails/{id}': { response: { id: 1 } },
  'GET /ingredients': {
    response: { data: ingredientExamples, meta: paginationMetaExample(ingredientExamples.length) },
  },
  'GET /ingredients/{id}': { response: ingredientExamples[0] },
  'POST /ingredients': { request: addIngredientExample, response: ingredientExamples[0] },
  'PATCH /ingredients/{id}': {
    request: updateIngredientExample,
    response: updateIngredientExample,
  },
  'DELETE /ingredients/{id}': { response: { id: 1 } },
}
