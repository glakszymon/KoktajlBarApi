import { type HttpContext } from '@adonisjs/core/http'
import { updateUserRoleValidator } from '#validators/user_role'
import User from '#models/user'

export default class UserRolesController {
  async update({ request, auth, response }: HttpContext) {
    const data = await request.validateUsing(updateUserRoleValidator)

    const actor = auth.use('api').getUserOrFail()

    if (actor.id === data.params.id) {
      return response.forbidden({
        message: 'Nie możesz zmieniać własnej roli.',
      })
    }

    const user = await User.findOrFail(data.params.id)

    user.role = data.role
    await user.save()

    return response.ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  }
}
