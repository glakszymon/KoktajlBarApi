import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

import type User from '#models/user'
import Ingredient from '#models/ingredient'
import Cocktail from '#models/cocktail'

import { createUser } from '#tests/helpers/user'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'

test.group('Ingredients | usuwanie', (group) => {
  let admin: User

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  group.each.setup(async () => {
    admin = await createUser('admin')
  })

  test('usuwa wskazany składnik i pozostawia pozostałe bez zmian', async ({ client, assert }) => {
    const ingredient = await IngredientFactory.create()
    const untouched = await IngredientFactory.create()
    await untouched.refresh()
    const original = untouched.serialize()

    const response = await client
      .delete(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(admin)

    response.assertStatus(200)
    response.assertBody({ id: ingredient.id })

    assert.isNull(await Ingredient.find(ingredient.id))

    await untouched.refresh()
    assert.deepEqual(untouched.serialize(), original)

    const read = await client.get(`/ingredients/${ingredient.id}`).withGuard('api').loginAs(admin)
    read.assertStatus(404)

    const repeated = await client
      .delete(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(admin)

    repeated.assertStatus(404)
  })

  test('odrzuca niepoprawne ID: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client }, { id }) => {
      const response = await client.delete(`/ingredients/${id}`).withGuard('api').loginAs(admin)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'id' }] })
    })

  test('zwraca 404 dla nieistniejącego składnika', async ({ client }) => {
    const ingredient = await IngredientFactory.create()
    await ingredient.delete()

    const response = await client
      .delete(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(admin)

    response.assertStatus(404)
  })

  test('chroni składnik używany w koktajlu i pozwala go usunąć po odpięciu', async ({
    client,
    assert,
  }) => {
    const ingredient = await IngredientFactory.create()
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: admin.id })

    await cocktail.related('ingredients').attach({ [ingredient.id]: { amount: 50, unit: 'ml' } })

    const conflict = await client
      .delete(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(admin)

    conflict.assertStatus(409)
    conflict.assertBody({
      code: 'E_RESOURCE_IN_USE',
      message: 'Nie można usunąć zasobu, ponieważ jest używany przez inne rekordy.',
    })

    assert.isNotNull(await Ingredient.find(ingredient.id))

    await cocktail.load('ingredients')

    assert.lengthOf(cocktail.ingredients, 1)

    assert.equal(cocktail.ingredients[0].id, ingredient.id)
    assert.equal(cocktail.ingredients[0].$extras.pivot_amount, 50)
    assert.equal(cocktail.ingredients[0].$extras.pivot_unit, 'ml')

    await cocktail.related('ingredients').detach([ingredient.id])

    const deleted = await client
      .delete(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(admin)

    deleted.assertStatus(200)

    assert.isNull(await Ingredient.find(ingredient.id))
    assert.isNotNull(await Cocktail.find(cocktail.id))
  })

  test('nie usuwa składnika bez tokena lub bez roli admin', async ({ client, assert }) => {
    const user = await createUser()
    const ingredient = await IngredientFactory.create()
    await ingredient.refresh()
    const original = ingredient.serialize()

    const anonymous = await client.delete(`/ingredients/${ingredient.id}`)

    anonymous.assertStatus(401)

    const forbidden = await client
      .delete(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(user)

    forbidden.assertStatus(403)

    await ingredient.refresh()
    assert.deepEqual(ingredient.serialize(), original)
  })
})
