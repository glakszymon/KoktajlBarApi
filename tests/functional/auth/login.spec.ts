import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

import User from '#models/user'

import { createUser, testPassword } from '#tests/helpers/user'

test.group('Auth | logowanie i tokeny', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('loguje i pozwala użyć zwróconego tokena do odczytu własnych danych', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const before = Date.now()

    const response = await client.post('/auth/login').json({
      email: `  ${user.email.toUpperCase()}  `,
      password: testPassword,
    })

    response.assertStatus(200)

    const body = response.body()
    const publicUser = { id: user.id, name: user.name, email: user.email }

    assert.deepEqual(body.user, publicUser)

    assert.equal(body.token.type, 'bearer')
    assert.isString(body.token.value)
    assert.isNotEmpty(body.token.value)
    assert.isNotNull(body.token.expiresAt)

    const expiry = Date.parse(body.token.expiresAt!)
    assert.closeTo(expiry, before + 24 * 60 * 60 * 1000, 5000)
    assert.lengthOf(await User.accessTokens.all(user), 1)

    const me = await client.get('/auth/me').bearerToken(body.token.value)

    me.assertStatus(200)
    me.assertBody({ user: publicUser })
  })

  test('odrzuca nieprawidłowe dane uwierzytelniające: {label}')
    .with([
      { label: 'błędne hasło', unknownEmail: false },
      { label: 'nieistniejący użytkownik', unknownEmail: true },
    ])
    .run(async ({ client, assert }, { unknownEmail }) => {
      const user = await createUser()

      const response = await client.post('/auth/login').json({
        email: unknownEmail ? 'nieistniejacy@example.com' : user.email,
        password: unknownEmail ? testPassword : 'niepoprawne-haslo',
      })

      response.assertStatus(400)

      assert.lengthOf(await User.accessTokens.all(user), 0)
    })

  test('waliduje dane logowania: {label}')
    .with([
      { label: 'brak emaila', payload: { password: testPassword }, field: 'email' },
      { label: 'brak hasła', payload: { email: 'jan@example.com' }, field: 'password' },
      { label: 'błędny email', payload: { email: 'abc', password: testPassword }, field: 'email' },
      { label: 'pusty email', payload: { email: '', password: testPassword }, field: 'email' },
      {
        label: 'puste hasło',
        payload: { email: 'jan@example.com', password: '' },
        field: 'password',
      },
      {
        label: 'email nie jest tekstem',
        payload: { email: 123, password: testPassword },
        field: 'email',
      },
      {
        label: 'hasło nie jest tekstem',
        payload: { email: 'jan@example.com', password: 123 },
        field: 'password',
      },
    ])
    .run(async ({ client }, { payload, field }) => {
      const response = await client.post('/auth/login').unsafeJson(payload)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })
    })

  test('odrzuca nieprawidłowy i wygasły token', async ({ client }) => {
    const user = await createUser()
    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: -60,
    })

    const invalid = await client.get('/auth/me').bearerToken('nieprawidlowy-token')
    invalid.assertStatus(401)

    const expired = await client.get('/auth/me').bearerToken(token.value!.release())
    expired.assertStatus(401)
  })

  test('wylogowanie unieważnia tylko bieżący token', async ({ client, assert }) => {
    const user = await createUser()

    const first = await client
      .post('/auth/login')
      .json({ email: user.email, password: testPassword })

    const second = await client
      .post('/auth/login')
      .json({ email: user.email, password: testPassword })

    first.assertStatus(200)
    second.assertStatus(200)

    const firstToken = first.body().token.value
    const secondToken = second.body().token.value

    assert.notEqual(firstToken, secondToken)

    const logout = await client.post('/auth/logout').bearerToken(firstToken)
    logout.assertStatus(204)
    assert.isEmpty(logout.text())

    const revoked = await client.get('/auth/me').bearerToken(firstToken)
    revoked.assertStatus(401)

    const active = await client.get('/auth/me').bearerToken(secondToken)
    active.assertStatus(200)
    assert.lengthOf(await User.accessTokens.all(user), 1)
  })

  test('nie akceptuje zmodyfikowanego tokena i nie unieważnia oryginału', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const accessToken = await User.accessTokens.create(user)
    const token = accessToken.value!.release()
    const tampered = `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`

    const rejected = await client.post('/auth/logout').bearerToken(tampered)
    rejected.assertStatus(401)

    const active = await client.get('/auth/me').bearerToken(token)
    active.assertStatus(200)
    assert.lengthOf(await User.accessTokens.all(user), 1)
  })

  test('token identyfikuje właściciela, a wylogowanie nie narusza konta innej osoby', async ({
    client,
    assert,
  }) => {
    const first = await createUser()
    const second = await createUser('admin')

    const firstAccessToken = await User.accessTokens.create(first)
    const secondAccessToken = await User.accessTokens.create(second)
    const firstToken = firstAccessToken.value!.release()
    const secondToken = secondAccessToken.value!.release()

    const me = await client.get('/auth/me').bearerToken(firstToken).qs({ id: second.id })

    me.assertStatus(200)
    me.assertBody({ user: { id: first.id, name: first.name, email: first.email } })

    const logout = await client.post('/auth/logout').bearerToken(firstToken)
    logout.assertStatus(204)

    const repeated = await client.post('/auth/logout').bearerToken(firstToken)
    repeated.assertStatus(401)

    const other = await client.get('/auth/me').bearerToken(secondToken)
    other.assertStatus(200)
    other.assertBody({ user: { id: second.id, name: second.name, email: second.email } })

    assert.lengthOf(await User.accessTokens.all(first), 0)
    assert.lengthOf(await User.accessTokens.all(second), 1)
  })

  test('odrzuca token po usunięciu jego właściciela', async ({ client }) => {
    const user = await createUser()
    const accessToken = await User.accessTokens.create(user)
    const token = accessToken.value!.release()

    await user.delete()

    const response = await client.get('/auth/me').bearerToken(token)

    response.assertStatus(401)
  })

  test('nie przyjmuje tokena w query string zamiast nagłówka Bearer', async ({ client }) => {
    const user = await createUser()
    const accessToken = await User.accessTokens.create(user)
    const token = accessToken.value!.release()

    const response = await client.get('/auth/me').qs({ token, access_token: token })

    response.assertStatus(401)
  })
})
