import vine from '@vinejs/vine'

const cocktailSchema = {
  name: vine.string().trim().minLength(2).maxLength(30),
  category: vine.string().trim().minLength(3).maxLength(30).optional(),
  recipe: vine.string().optional(),
}

export const addCocktailValidator = vine.compile(
  vine.object({
    ...cocktailSchema,
  })
)

export const cocktailIdValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)

export const updateCocktailValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(30).optional(),
    category: vine.string().trim().minLength(3).maxLength(30).optional(),
    recipe: vine.string().optional(),
  })
)
