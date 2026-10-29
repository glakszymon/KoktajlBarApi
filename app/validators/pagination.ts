import vine from '@vinejs/vine'

export const paginationCocktailValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().positive().optional(),
    limit: vine.number().withoutDecimals().positive().max(100).optional(),
    category: vine.string().optional(),
    alcohol: vine.boolean().optional(),
    userId: vine.number().withoutDecimals().positive().optional(),
    sortBy: vine.enum(['id', 'name', 'category', 'created', 'updated']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
    ingredientIds: vine
      .string()
      .trim()
      .regex(/^[1-9]\d*(,[1-9]\d*){0,49}$/)
      .optional(),
  })
)

export const paginationIngredientValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().positive().optional(),
    limit: vine.number().withoutDecimals().positive().max(100).optional(),
    alcohol: vine.boolean().optional(),
    sortBy: vine.enum(['id', 'name', 'created', 'updated']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)

// export const paginationCommentValidator = vine.compile(
//   vine.object({
//     page: vine.number().withoutDecimals().positive().optional(),
//     limit: vine.number().withoutDecimals().positive().max(10).optional(),
//     sortBy: vine.enum(['id', 'rating', 'created', 'updated']).optional(),
//     sortOrder: vine.enum(['asc', 'desc']).optional(),
//   })
// )
