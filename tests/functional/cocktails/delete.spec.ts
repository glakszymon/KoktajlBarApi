import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import Cocktail from '#models/cocktail'
import type User from '#models/user'

import { createUser } from '#tests/helpers/user'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'

test.group('Cocktails | usuwanie', (group) => {
  let admin: User
  let owner: User

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  group.each.setup(async () => {
    admin = await createUser('admin')
    owner = await createUser()
  })

  test('usuwa koktajl i jego powiązania, zachowując składniki i inny koktajl', async ({
    client,
    assert,
  }) => {
    const [cocktail, other] = await Cocktail.createMany([
      { name: 'Mojito', userId: owner.id },
      { name: 'Inny koktajl', userId: owner.id },
    ])
    const ingredients = await IngredientFactory.createMany(2)

    await cocktail.related('ingredients').attach(ingredients.map((item) => item.id))
    await other.related('ingredients').attach({ [ingredients[0].id]: { amount: 20, unit: 'ml' } })

    const response = await client
      .delete(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(admin)

    response.assertStatus(200)
    response.assertBody({ id: cocktail.id })

    assert.isNull(await Cocktail.find(cocktail.id))
    assert.lengthOf(await db.from('cocktail_ingredients').where('cocktail_id', cocktail.id), 0)

    for (const ingredient of ingredients) await ingredient.refresh()

    await other.refresh()

    assert.equal(other.name, 'Inny koktajl')

    await other.load('ingredients')

    assert.lengthOf(other.ingredients, 1)
    assert.equal(other.ingredients[0].id, ingredients[0].id)
    assert.equal(other.ingredients[0].$extras.pivot_amount, 20)

    const read = await client.get(`/cocktails/${cocktail.id}`).withGuard('api').loginAs(admin)
    read.assertStatus(404)

    const repeated = await client
      .delete(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(admin)

    repeated.assertStatus(404)
  })

  test('właściciel usuwa własny koktajl i powiązania, zachowując składnik', async ({
    client,
    assert,
  }) => {
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: owner.id })
    const ingredient = await IngredientFactory.create()
    await cocktail.related('ingredients').attach({ [ingredient.id]: { amount: 50, unit: 'ml' } })

    const response = await client
      .delete(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(owner)

    response.assertStatus(200)

    assert.isNull(await Cocktail.find(cocktail.id))
    assert.lengthOf(await db.from('cocktail_ingredients').where('cocktail_id', cocktail.id), 0)
    await ingredient.refresh()
  })

  test('odrzuca niepoprawne ID: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client }, { id }) => {
      const response = await client.delete(`/cocktails/${id}`).withGuard('api').loginAs(admin)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'id' }] })
    })

  test('zwraca 404 dla nieistniejącego koktajlu', async ({ client }) => {
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: owner.id })
    await cocktail.delete()

    const response = await client
      .delete(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(admin)

    response.assertStatus(404)
  })

  test('nie usuwa koktajlu ani relacji bez tokena lub jako obcy użytkownik', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: owner.id })
    const ingredient = await IngredientFactory.create()

    await cocktail.related('ingredients').attach({ [ingredient.id]: { amount: 50, unit: 'ml' } })
    await cocktail.refresh()
    const original = cocktail.serialize()

    const anonymous = await client.delete(`/cocktails/${cocktail.id}`)
    anonymous.assertStatus(401)

    const forbidden = await client
      .delete(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(user)

    forbidden.assertStatus(403)

    await cocktail.refresh()

    assert.deepEqual(cocktail.serialize(), original)
    await cocktail.load('ingredients')
    assert.lengthOf(cocktail.ingredients, 1)
    assert.equal(cocktail.ingredients[0].id, ingredient.id)
    assert.equal(cocktail.ingredients[0].$extras.pivot_amount, 50)
    assert.equal(cocktail.ingredients[0].$extras.pivot_unit, 'ml')
  })
})
