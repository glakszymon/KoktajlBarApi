import vine from '@vinejs/vine'

export const addCommentValidator = vine.compile(
  vine.object({
    params: vine.object({
      cocktailId: vine.number().positive().withoutDecimals(),
    }),

    rating: vine.number().withoutDecimals().min(1).max(5),

    content: vine.string().trim().minLength(1).maxLength(500).nullable().optional(),
  })
)

export const listCommentsValidator = vine.compile(
  vine.object({
    params: vine.object({
      cocktailId: vine.number().positive().withoutDecimals(),
    }),

    page: vine.number().positive().withoutDecimals().optional(),

    limit: vine.number().positive().withoutDecimals().max(100).optional(),
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

export const updateCommentValidator = vine.compile(
  vine.object({
    params: vine.object({
      cocktailId: vine.number().positive().withoutDecimals(),

      id: vine.number().positive().withoutDecimals(),
    }),

    rating: vine.number().withoutDecimals().min(1).max(5).optional(),

    content: vine.string().trim().minLength(1).maxLength(500).nullable().optional(),
  })
)

export const deleteCommentValidator = showCommentValidator
