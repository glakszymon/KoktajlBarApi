import type { Operation, Schema } from './openapi.js'

/** Complete auth contracts and correct security metadata emitted by AutoSwagger. */
export function documentAuth(document: {
  components: { schemas: Record<string, Schema> }
  paths?: Record<string, Record<string, Operation>>
}) {
  const schemas = document.components.schemas
  const user = { id: 1, name: 'Jan Kowalski', email: 'jan@example.com' }
  const password = 'Przykladowe-haslo-123!'
  const json = (schema: object, example?: unknown) => ({
    'application/json': { schema, ...(example === undefined ? {} : { example }) },
  })
  const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })

  schemas.PublicUser = {
    type: 'object',
    required: ['id', 'name', 'email'],
    properties: {
      id: { type: 'integer', minimum: 1 },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
    },
    example: user,
  }
  schemas.AuthUserResponse = {
    type: 'object',
    required: ['user'],
    properties: { user: ref('PublicUser') },
    example: { user },
  }
  schemas.InvalidCredentialsError = {
    type: 'object',
    description:
      'Błąd logowania dla Accept: application/json. Pola diagnostyczne mogą różnić się między development i production.',
    properties: {
      errors: {
        type: 'array',
        items: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    example: { errors: [{ message: 'Invalid user credentials' }] },
  }
  schemas.LoginResponse = {
    type: 'object',
    required: ['token', 'user'],
    properties: {
      token: {
        type: 'object',
        required: ['type', 'value', 'expiresAt'],
        properties: {
          type: { type: 'string', enum: ['bearer'] },
          value: { type: 'string', description: 'Token do nagłówka Authorization.' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      user: ref('PublicUser'),
    },
    example: {
      token: {
        type: 'bearer',
        value: 'PRZYKLADOWY_TOKEN_ZASTAP_WYNIKIEM_LOGOWANIA',
        expiresAt: '2026-10-29T12:00:00.000Z',
      },
      user,
    },
  }
  schemas.UpdateUserRoleRequest = {
    type: 'object',
    required: ['role'],
    properties: { role: { type: 'string', enum: ['user', 'admin'] } },
    example: { role: 'admin' },
  }
  schemas.UserRoleResponse = {
    type: 'object',
    required: ['user'],
    properties: {
      user: {
        type: 'object',
        required: ['id', 'name', 'email', 'role'],
        properties: {
          ...schemas.PublicUser.properties,
          role: { type: 'string', enum: ['user', 'admin'] },
        },
      },
    },
    example: { user: { ...user, id: 2, role: 'admin' } },
  }
  for (const name of ['registerValidator', 'loginValidator']) {
    const schema = schemas[name]
    const properties = schema.properties!
    properties.email.format = 'email'
    properties.password.format = 'password'
    const example: Record<string, string> = { email: user.email, password }
    if (name === 'registerValidator') {
      properties.password_confirmation = {
        type: 'string',
        format: 'password',
        description: 'Musi być identyczne z password.',
        example: password,
      }
      schema.required = ['name', 'email', 'password', 'password_confirmation']
      Object.assign(example, { name: user.name, password_confirmation: password })
    }
    schema.example = example
    for (const [field, value] of Object.entries(example)) {
      properties[field].example = value
    }
  }

  for (const [path, methods] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'patch', 'delete'].includes(method)) continue
      const resource = path.startsWith('/ingredients') || path.startsWith('/cocktails')
      const roleChange = path === '/users/{id}/role'
      const auth = path.startsWith('/auth/')
      if (!resource && !roleChange && !auth) continue

      const publicEndpoint =
        path === '/auth/register' || path === '/auth/login' || (resource && method === 'get')
      const admin = roleChange || (path.startsWith('/ingredients') && method !== 'get')
      const owner = path.startsWith('/cocktails') && (method === 'patch' || method === 'delete')
      const comment = path.includes('/comments/')
      operation.security = publicEndpoint ? [] : [{ BearerAuth: [] }]
      const access = publicEndpoint
        ? 'Endpoint publiczny — nie wymaga tokena.'
        : admin
          ? 'Wymaga tokena Bearer i roli admin.'
          : owner
            ? `Wymaga tokena Bearer ${comment ? 'autora komentarza' : 'właściciela koktajlu'} lub administratora.`
            : 'Wymaga tokena Bearer; dostęp dla ról user i admin. Autor pochodzi z tokena.'
      operation.description = `${operation.description ?? ''}\n\n${access}`.trim()
      const responses = (operation.responses ??= {})
      delete responses['403']
      if (publicEndpoint) delete responses['401']
      if (!publicEndpoint) {
        responses['401'] = {
          description: 'Brak tokena, token nieprawidłowy, wygasły lub unieważniony.',
        }
      }
      if (admin) {
        responses['403'] = {
          description: roleChange
            ? 'Brak roli admin lub próba zmiany własnej roli.'
            : 'Zalogowany użytkownik nie ma roli admin.',
          content: json(
            { type: 'object', required: ['message'], properties: { message: { type: 'string' } } },
            { message: 'Nie masz uprawnień do wykonania tej operacji.' }
          ),
        }
      }
      if (owner) {
        responses['403'] = {
          description: comment
            ? 'Użytkownik nie jest autorem komentarza ani administratorem. Samo posiadanie koktajlu nie daje prawa usuwania cudzych komentarzy.'
            : 'Użytkownik nie jest właścicielem koktajlu ani administratorem.',
          ...(comment
            ? {}
            : {
                content: json(
                  {
                    type: 'object',
                    required: ['message'],
                    properties: { message: { type: 'string' } },
                  },
                  {
                    message:
                      method === 'patch'
                        ? 'Możesz edytować tylko własne koktajle.'
                        : 'Możesz usuwać tylko własne koktajle.',
                  }
                ),
              }),
        }
      }
      if (auth || roleChange) {
        if (path === '/auth/login') {
          responses['400'] = {
            description: 'Nieprawidłowy email lub hasło (Accept: application/json).',
            content: json(ref('InvalidCredentialsError'), schemas.InvalidCredentialsError.example),
          }
        }
        if (path === '/auth/logout') {
          delete operation.requestBody
          responses['204'] = { description: 'Bieżący token unieważniony. Odpowiedź bez body.' }
          continue
        }
        const responseSchema = roleChange
          ? 'UserRoleResponse'
          : path === '/auth/login'
            ? 'LoginResponse'
            : 'AuthUserResponse'
        const status = path === '/auth/register' ? '201' : '200'
        responses[status] = {
          description: responses[status]?.description ?? 'Operacja zakończona pomyślnie.',
          content: json(ref(responseSchema), schemas[responseSchema].example),
        }
        if (path === '/auth/me') continue
        const requestSchema = roleChange
          ? 'UpdateUserRoleRequest'
          : path === '/auth/login'
            ? 'loginValidator'
            : 'registerValidator'
        operation.requestBody = {
          required: true,
          content: json(ref(requestSchema), schemas[requestSchema].example),
        }
        responses['422'] = {
          description: 'Błąd walidacji danych (Accept: application/json).',
          content: json(ref('ValidationError')),
        }
      }
    }
  }
}
