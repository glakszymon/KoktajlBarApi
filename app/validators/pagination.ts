import vine from '@vinejs/vine'

export const paginationValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().positive().optional(),
    limit: vine.number().withoutDecimals().positive().max(100).optional(),
    category: vine.string().optional(),
    alcohol: vine.boolean().optional(),
    sortBy: vine.enum(['id', 'name', 'category', 'created', 'updated']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)
