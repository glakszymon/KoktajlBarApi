import vine from '@vinejs/vine'

export const addCocktailIngredientValidator = vine.compile(
  vine.object({
    ingredientId: vine.number().positive(),
    cocktailId: vine.number().positive(),
    amount: vine.number().optional(),
    unit: vine.string().optional(),
  })
)
