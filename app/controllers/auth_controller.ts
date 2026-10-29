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
  /**
   * @register
   * @summary Zarejestruj użytkownika
   * @description Publiczny endpoint. Tworzy konto z rolą user, bez automatycznego logowania. Hasło musi mieć od 15 do 128 znaków; password_confirmation musi być identyczne. Email jest normalizowany do małych liter i musi być unikalny.
   * @requestBody <registerValidator>
   * @responseBody 201 - Konto zostało utworzone; zaloguj się przez POST /auth/login
   * @responseBody 422 - Błąd walidacji lub zajęty email
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash: data.password,
    })

    return response.created({ user: publicUser(user) })
  }

  /**
   * @login
   * @summary Zaloguj użytkownika
   * @description Publiczny endpoint. Zwraca token.value ważny 24 godziny oraz user z id, name i email, bez roli i hasła. Każde logowanie tworzy osobny token dostępu (nie JWT). W Swagger UI wklej sam token w Authorize → BearerAuth; w żądaniach HTTP używaj Authorization: Bearer <token>. Email jest przycinany i zamieniany na małe litery. Token identyfikuje autora tworzonych koktajli i komentarzy.
   * @requestBody <loginValidator>
   * @responseBody 200 - Token dostępu i dane użytkownika
   * @responseBody 400 - Nieprawidłowy email lub hasło
   * @responseBody 422 - Błąd walidacji danych logowania
   */
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

  /**
   * @me
   * @summary Pobierz dane zalogowanego użytkownika
   * @description Wymaga tokena Bearer. Zwraca id, name i email; odpowiedź nie zawiera roli ani hasła.
   * @responseBody 200 - Dane zalogowanego użytkownika
   * @responseBody 401 - Brak tokena, token nieprawidłowy, wygasły lub unieważniony
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()

    return response.ok({ user: publicUser(user) })
  }

  /**
   * @logout
   * @summary Wyloguj użytkownika
   * @description Unieważnia wyłącznie bieżący token Bearer. Nie wymaga body. Po wylogowaniu usuń token również z Authorize w Swagger UI.
   * @responseBody 204 - Token został unieważniony; odpowiedź bez body
   * @responseBody 401 - Brak tokena, token nieprawidłowy, wygasły lub unieważniony
   */
  async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()

    return response.noContent()
  }
}
