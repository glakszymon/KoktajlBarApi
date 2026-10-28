import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'

function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash: data.password,
    })

    return response.created({ user: publicUser(user) })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return response.ok({
      token: {
        type: 'bearer',
        value: token.value!.release(),
        expiresAt: token.expiresAt?.toISOString() ?? null,
      },
      user: publicUser(user),
    })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()

    return response.ok({ user: publicUser(user) })
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()

    return response.noContent()
  }
}
