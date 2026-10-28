import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

import type User from '#models/user'

import { createUser } from '#tests/helpers/user'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'

test.group('Ingredients | aktualizacja', (group) => {
  let admin: User

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  group.each.setup(async () => {
    admin = await createUser('admin')
  })

  test('aktualizuje wszystkie pola i zwraca zapisany składnik', async ({ client, assert }) => {
    const ingredient = await IngredientFactory.merge({ alcohol: true }).create()
    const untouched = await IngredientFactory.create()
    await untouched.refresh()
    const original = untouched.serialize()

    const payload = {
      name: '  Świeża mięta  ',
      description: '  Liście do dekoracji  ',
      alcohol: false,
      photoUrl: 'https://example.com/mint.jpg',
    }
    const expected = { ...payload, name: 'Świeża mięta', description: 'Liście do dekoracji' }

    const response = await client
      .patch(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(admin)
      .json(payload)

    response.assertStatus(200)
    response.assertBodyContains({ id: ingredient.id, ...expected })

    await ingredient.refresh()

    assert.equal(ingredient.name, expected.name)
    assert.equal(ingredient.description, expected.description)
    assert.equal(Number(ingredient.alcohol), 0)
    assert.equal(ingredient.photoUrl, expected.photoUrl)

    await untouched.refresh()
    assert.deepEqual(untouched.serialize(), original)

    const read = await client.get(`/ingredients/${ingredient.id}`).withGuard('api').loginAs(admin)
    read.assertStatus(200)
    read.assertBodyContains({ id: ingredient.id, ...expected, alcohol: 0 })
  })

  test('zmienia tylko przesłane pole: {label}')
    .with([
      { label: 'minimalna nazwa', changes: { name: 'AB' } },
      { label: 'maksymalna nazwa', changes: { name: 'A'.repeat(100) } },
      { label: 'maksymalny opis', changes: { description: 'A'.repeat(500) } },
      { label: 'flaga alkoholu false', changes: { alcohol: false } },
      { label: 'usunięcie zdjęcia', changes: { photoUrl: null } },
      { label: 'nowe zdjęcie', changes: { photoUrl: 'https://example.com/new.jpg' } },
    ])
    .run(async ({ client, assert }, { changes }) => {
      const ingredient = await IngredientFactory.merge({ alcohol: true }).create()
      await ingredient.refresh()
      const expected = {
        name: ingredient.name,
        description: ingredient.description,
        alcohol: ingredient.alcohol,
        photoUrl: ingredient.photoUrl,
        ...changes,
      }

      const response = await client
        .patch(`/ingredients/${ingredient.id}`)
        .withGuard('api')
        .loginAs(admin)
        .json(changes)

      response.assertStatus(200)
      const { alcohol, ...expectedFields } = expected
      response.assertBodyContains({ id: ingredient.id, ...expectedFields })
      assert.equal(Number(response.body().alcohol), Number(alcohol))

      await ingredient.refresh()

      for (const field of ['name', 'description', 'alcohol', 'photoUrl'] as const) {
        assert.equal(ingredient[field], expected[field])
      }
    })

  test('odrzuca niepoprawne dane bez częściowego zapisu: {label}')
    .with([
      { label: 'jeden znak nazwy', changes: { name: 'X' }, field: 'name' },
      { label: 'za długa nazwa', changes: { name: 'A'.repeat(101) }, field: 'name' },
      { label: 'za długi opis', changes: { description: 'A'.repeat(501) }, field: 'description' },
      { label: 'błędna flaga alkoholu', changes: { alcohol: 'wrong' }, field: 'alcohol' },
      { label: 'błędny URL', changes: { photoUrl: 'nie-jest-adresem' }, field: 'photoUrl' },
    ])
    .run(async ({ client, assert }, { changes, field }) => {
      const ingredient = await IngredientFactory.create()
      await ingredient.refresh()
      const original = ingredient.serialize()

      const response = await client
        .patch(`/ingredients/${ingredient.id}`)
        .withGuard('api')
        .loginAs(admin)
        .unsafeJson({ name: 'Nowa nazwa', ...changes })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })

      await ingredient.refresh()
      assert.deepEqual(ingredient.serialize(), original)
    })

  test('pomija pustą opcjonalną nazwę i aktualizuje pozostałe pola', async ({ client, assert }) => {
    const ingredient = await IngredientFactory.create()
    const originalName = ingredient.name

    const response = await client
      .patch(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(admin)
      .json({ name: '   ', description: 'Nowy opis' })

    response.assertStatus(200)

    await ingredient.refresh()
    assert.equal(ingredient.name, originalName)
    assert.equal(ingredient.description, 'Nowy opis')
  })

  test('odrzuca niepoprawne ID: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client }, { id }) => {
      const response = await client
        .patch(`/ingredients/${id}`)
        .withGuard('api')
        .loginAs(admin)
        .json({ name: 'Mięta' })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'id' }] })
    })

  test('zwraca 404 dla nieistniejącego składnika', async ({ client }) => {
    const ingredient = await IngredientFactory.create()
    await ingredient.delete()

    const response = await client
      .patch(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(admin)
      .json({ name: 'Mięta' })

    response.assertStatus(404)
  })

  test('odmawia aktualizacji bez tokena lub bez roli admin', async ({ client, assert }) => {
    const user = await createUser()
    const ingredient = await IngredientFactory.create()
    await ingredient.refresh()
    const original = ingredient.serialize()

    const anonymous = await client.patch(`/ingredients/${ingredient.id}`).json({ name: 'Mięta' })
    anonymous.assertStatus(401)

    const forbidden = await client
      .patch(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(user)
      .json({ name: 'Mięta' })

    forbidden.assertStatus(403)

    await ingredient.refresh()
    assert.deepEqual(ingredient.serialize(), original)
  })
})
