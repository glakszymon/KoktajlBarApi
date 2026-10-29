import vine from '@vinejs/vine'

const ingredientSchema = {
  name: vine.string().trim().minLength(2).maxLength(100),
  description: vine.string().trim().maxLength(500).optional(),
  alcohol: vine.boolean().optional(),
  photoUrl: vine.string().url().optional().nullable(),
}

export const addIngredientValidator = vine.compile(
  vine.object({
    ...ingredientSchema,
  })
)

export const ingredientIdValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)

export const updateIngredientValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .parse((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
      .trim()
      .minLength(2)
      .maxLength(100)
      .optional(),
    description: vine.string().trim().maxLength(500).optional(),
    alcohol: vine.boolean().optional(),
    photoUrl: vine.string().url().optional().nullable(),
  })
)
