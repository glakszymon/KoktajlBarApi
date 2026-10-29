import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    email: vine.string().trim().toLowerCase().email().maxLength(254).unique({
      table: 'users',
      column: 'email',
      caseInsensitive: true,
    }),
    password: vine.string().minLength(15).maxLength(128).confirmed(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().toLowerCase().email().maxLength(254),
    password: vine.string().minLength(1),
  })
)
