import vine from '@vinejs/vine'

export const addCocktailValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(30),
    category: vine.string().trim().minLength(3).maxLength(30).optional(),
    recipe: vine.string().maxLength(1000).optional(),

    ingredients: vine
      .array(
        vine.object({
          ingredient_id: vine.number().positive().exists({ table: 'ingredients', column: 'id' }),
          amount: vine.number().positive().optional(),
          unit: vine.string().trim().minLength(1).maxLength(20).optional(),
        })
      )
      .optional(),
  })
)

export const cocktailIdValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)

export const updateCocktailValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(50).optional(),
    category: vine.string().trim().minLength(3).maxLength(50).optional(),
    recipe: vine.string().maxLength(1000).optional(),

    ingredients: vine
      .array(
        vine.object({
          ingredient_id: vine.number().positive().exists({ table: 'ingredients', column: 'id' }),
          amount: vine.number().positive().optional(),
          unit: vine.string().trim().minLength(1).maxLength(20).optional(),
        })
      )
      .optional(),
  })
)
