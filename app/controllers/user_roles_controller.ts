import { type HttpContext } from '@adonisjs/core/http'
import { updateUserRoleValidator } from '#validators/user_role'
import User from '#models/user'

export default class UserRolesController {
  /**
   * @update
   * @summary Zmień rolę użytkownika
   * @description Wymaga roli admin. Body zawiera wyłącznie role: user lub admin; id podaj w ścieżce. Administrator nie może zmienić własnej roli.
   * @paramPath id - ID innego użytkownika, dodatnia liczba całkowita - @type(integer) @required @example(2)
   * @requestBody {"role":"admin"}
   * @responseBody 200 - Dane użytkownika wraz z nową rolą
   * @responseBody 403 - Brak roli admin lub próba zmiany własnej roli
   * @responseBody 404 - Nie znaleziono użytkownika
   * @responseBody 422 - Nieprawidłowe ID lub rola
   */
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
