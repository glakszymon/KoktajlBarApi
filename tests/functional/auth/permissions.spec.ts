import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

import User from '#models/user'

import { createUser } from '#tests/helpers/user'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'

test.group('Auth | uprawnienia', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('wymaga tokena na chronionych trasach', async ({ client }) => {
    const requests = [
      client.get('/auth/me'),
      client.post('/auth/logout'),
      client.get('/ingredients'),
      client.get('/ingredients/1'),
      client.post('/ingredients'),
      client.patch('/ingredients/1'),
      client.delete('/ingredients/1'),
      client.get('/cocktails'),
      client.get('/cocktails/1'),
      client.post('/cocktails'),
      client.patch('/cocktails/1'),
      client.delete('/cocktails/1'),
      client.patch('/users/1/role'),
    ]

    for (const request of requests) {
      const response = await request
      response.assertStatus(401)
    }
  })

  test('user nie może wykonywać operacji administracyjnych', async ({ client, assert }) => {
    const user = await createUser()
    const ingredient = await IngredientFactory.create()

    const requests = [
      client.post('/ingredients').json({ name: 'Nowy składnik' }),
      client.patch(`/ingredients/${ingredient.id}`).json({ name: 'Zmieniony składnik' }),
      client.delete(`/ingredients/${ingredient.id}`),
      client.post('/cocktails').json({ name: 'Nowy koktajl' }),
      client.patch('/cocktails/1').json({ name: 'Zmieniony koktajl' }),
      client.delete('/cocktails/1'),
      client.patch(`/users/${user.id}/role`).json({ role: 'admin' }),
    ]

    for (const request of requests) {
      const response = await request.withGuard('api').loginAs(user)
      response.assertStatus(403)
      response.assertBody({ message: 'Nie masz uprawnień do wykonania tej operacji.' })
    }

    const originalName = ingredient.name

    await ingredient.refresh()
    await user.refresh()

    assert.equal(ingredient.name, originalName)
    assert.equal(user.role, 'user')
  })

  test('admin zmienia rolę innego użytkownika i jego dostęp z istniejącym tokenem', async ({
    client,
    assert,
  }) => {
    const admin = await createUser('admin')
    const user = await createUser()

    const token = await User.accessTokens.create(user)
    const bearer = token.value!.release()

    for (const role of ['admin', 'user'] as const) {
      const response = await client
        .patch(`/users/${user.id}/role`)
        .withGuard('api')
        .loginAs(admin)
        .json({ role })

      response.assertStatus(200)
      response.assertBody({ user: { id: user.id, name: user.name, email: user.email, role } })

      await user.refresh()
      assert.equal(user.role, role)

      const create = await client
        .post('/ingredients')
        .bearerToken(bearer)
        .json({ name: 'Składnik testowy' })

      create.assertStatus(role === 'admin' ? 201 : 403)
    }
  })

  test('admin nie może zmienić własnej roli', async ({ client, assert }) => {
    const admin = await createUser('admin')

    const response = await client
      .patch(`/users/${admin.id}/role`)
      .withGuard('api')
      .loginAs(admin)
      .json({ role: 'user' })

    response.assertStatus(403)
    response.assertBody({ message: 'Nie możesz zmieniać własnej roli.' })

    await admin.refresh()
    assert.equal(admin.role, 'admin')
  })

  test('waliduje rolę i nie zmienia danych użytkownika: {label}')
    .with([
      { label: 'brak roli', payload: {} },
      { label: 'nieznana rola', payload: { role: 'owner' } },
      { label: 'pusta rola', payload: { role: '' } },
      { label: 'rola null', payload: { role: null } },
      { label: 'niepoprawny typ', payload: { role: 123 } },
      { label: 'inna wielkość liter', payload: { role: 'ADMIN' } },
    ])
    .run(async ({ client, assert }, { payload }) => {
      const admin = await createUser('admin')
      const user = await createUser()
      await user.refresh()
      const original = user.serialize()

      const response = await client
        .patch(`/users/${user.id}/role`)
        .withGuard('api')
        .loginAs(admin)
        .unsafeJson(payload)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'role' }] })

      await user.refresh()
      assert.deepEqual(user.serialize(), original)
    })

  test('odrzuca niepoprawne ID przy zmianie roli: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client }, { id }) => {
      const admin = await createUser('admin')

      const response = await client
        .patch(`/users/${id}/role`)
        .withGuard('api')
        .loginAs(admin)
        .json({ role: 'admin' })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'params.id' }] })
    })

  test('zwraca 404 przy zmianie roli nieistniejącego użytkownika', async ({ client }) => {
    const admin = await createUser('admin')
    const user = await createUser()
    await user.delete()

    const response = await client
      .patch(`/users/${user.id}/role`)
      .withGuard('api')
      .loginAs(admin)
      .json({ role: 'admin' })

    response.assertStatus(404)
  })

  test('zmienia wyłącznie rolę osoby wskazanej w ścieżce', async ({ client, assert }) => {
    const admin = await createUser('admin')
    const target = await createUser()
    const other = await createUser()
    const originalHash = target.passwordHash

    const response = await client
      .patch(`/users/${target.id}/role`)
      .withGuard('api')
      .loginAs(admin)
      .unsafeJson({
        role: 'admin',
        params: { id: other.id },
        id: other.id,
        name: 'Podmieniona nazwa',
        email: 'podmieniony@example.com',
        passwordHash: 'podmienione-haslo',
      })

    response.assertStatus(200)
    response.assertBody({
      user: { id: target.id, name: target.name, email: target.email, role: 'admin' },
    })

    await target.refresh()
    await other.refresh()

    assert.equal(target.role, 'admin')
    assert.equal(target.passwordHash, originalHash)
    assert.equal(other.role, 'user')
  })

  test('ponowne nadanie tej samej roli jest poprawne', async ({ client, assert }) => {
    const admin = await createUser('admin')
    const user = await createUser()

    const response = await client
      .patch(`/users/${user.id}/role`)
      .withGuard('api')
      .loginAs(admin)
      .json({ role: 'user' })

    response.assertStatus(200)

    await user.refresh()
    assert.equal(user.role, 'user')
  })

  test('nie pozwala ominąć zakazu zmiany własnej roli przez params w body', async ({
    client,
    assert,
  }) => {
    const admin = await createUser('admin')
    const other = await createUser()

    const response = await client
      .patch(`/users/${admin.id}/role`)
      .withGuard('api')
      .loginAs(admin)
      .unsafeJson({
        role: 'user',
        params: { id: other.id },
      })

    response.assertStatus(403)
    response.assertBody({ message: 'Nie możesz zmieniać własnej roli.' })

    await admin.refresh()
    assert.equal(admin.role, 'admin')
  })
})
