import vine from '@vinejs/vine'

export const addCommentValidator = vine.compile(
  vine.object({
    params: vine.object({
      cocktailId: vine.number().positive().withoutDecimals(),
    }),

    rating: vine.number({ strict: true }).withoutDecimals().min(1).max(5),

    content: vine.string().regex(/\S/).trim().minLength(1).maxLength(500).nullable().optional(),
  })
)
export const listCommentsValidator = vine.compile(
  vine.object({
    params: vine.object({
      cocktailId: vine.number().positive().withoutDecimals(),
    }),

    page: vine.number().positive().withoutDecimals().optional(),

    limit: vine.number().positive().withoutDecimals().max(100).optional(),

    sortBy: vine.enum(['id', 'rating', 'createdAt', 'updatedAt']).optional(),

    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)

export const showCommentValidator = vine.compile(
  vine.object({
    params: vine.object({
      cocktailId: vine.number().positive().withoutDecimals(),

      id: vine.number().positive().withoutDecimals(),
    }),
  })
)

export const commentIdValidator = vine.compile(
  vine.object({
    id: vine.number().positive().withoutDecimals(),
  })
)

export const updateCommentValidator = vine.compile(
  vine.object({
    params: vine.object({
      cocktailId: vine.number().positive().withoutDecimals(),

      id: vine.number().positive().withoutDecimals(),
    }),

    rating: vine.number({ strict: true }).withoutDecimals().min(1).max(5).optional(),

    content: vine.string().trim().minLength(1).maxLength(500).nullable().optional(),
  })
)

export const deleteCommentValidator = showCommentValidator
