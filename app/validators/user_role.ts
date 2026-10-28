import vine from '@vinejs/vine'

export const updateUserRoleValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.number().positive().withoutDecimals(),
    }),

    role: vine.enum(['user', 'admin']),
  })
)
