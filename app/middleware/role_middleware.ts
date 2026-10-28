import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

type UserRole = 'user' | 'admin'

export default class RoleMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn, options: { roles: UserRole[] }) {
    const user = auth.use('api').getUserOrFail()

    if (!options.roles.some((role) => role === user.role)) {
      return response.forbidden({
        message: 'Nie masz uprawnień do wykonania tej operacji.',
      })
    }

    return next()
  }
}
