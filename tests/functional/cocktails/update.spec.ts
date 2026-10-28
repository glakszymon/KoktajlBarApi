import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

import Cocktail from '#models/cocktail'
import type User from '#models/user'

import { createUser } from '#tests/helpers/user'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'

test.group('Cocktails | aktualizacja', (group) => {
  let admin: User

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  group.each.setup(async () => {
    admin = await createUser('admin')
  })

  test('zmienia pola koktajlu i zastępuje listę składników', async ({ client, assert }) => {
    const cocktail = await Cocktail.create({
      name: 'Stara nazwa',
      category: 'Old',
      recipe: 'Stary przepis',
    })
    const [removed, retained, added] = await IngredientFactory.createMany(3)

    await cocktail.related('ingredients').attach({
      [removed.id]: { amount: 10, unit: 'ml' },
      [retained.id]: { amount: 20, unit: 'ml' },
    })

    const response = await client
      .patch(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(admin)
      .json({
        name: '  Nowa nazwa  ',
        category: '  Long Drink  ',
        recipe: 'Nowy przepis',
        ingredients: [
          { ingredient_id: retained.id, amount: 50, unit: '  ml  ' },
          { ingredient_id: added.id, amount: 8, unit: 'liści' },
        ],
      })

    response.assertStatus(200)

    response.assertBodyContains({
      id: cocktail.id,
      name: 'Nowa nazwa',
      category: 'Long Drink',
      recipe: 'Nowy przepis',
      ingredients: [
        { id: retained.id, amount: 50, unit: 'ml' },
        { id: added.id, amount: 8, unit: 'liści' },
      ],
    })

    await cocktail.refresh()

    assert.equal(cocktail.name, 'Nowa nazwa')
    assert.equal(cocktail.category, 'Long Drink')
    assert.equal(cocktail.recipe, 'Nowy przepis')

    await cocktail.load('ingredients')

    assert.sameMembers(
      cocktail.ingredients.map((item) => item.id),
      [retained.id, added.id]
    )

    const retainedRecord = cocktail.ingredients.find((item) => item.id === retained.id)!

    assert.equal(retainedRecord.$extras.pivot_amount, 50)
    assert.equal(retainedRecord.$extras.pivot_unit, 'ml')

    await removed.refresh()
  })

  test('zmienia tylko przesłane pole i zachowuje relacje: {label}')
    .with([
      { label: 'minimalna nazwa', changes: { name: 'AB' } },
      { label: 'maksymalna nazwa', changes: { name: 'A'.repeat(50) } },
      { label: 'minimalna kategoria', changes: { category: 'ABC' } },
      { label: 'maksymalna kategoria', changes: { category: 'A'.repeat(50) } },
      { label: 'maksymalny przepis', changes: { recipe: 'A'.repeat(1000) } },
    ])
    .run(async ({ client, assert }, { changes }) => {
      const cocktail = await Cocktail.create({
        name: 'Mojito',
        category: 'Long Drink',
        recipe: 'Wymieszaj.',
      })

      const ingredient = await IngredientFactory.create()
      await cocktail.related('ingredients').attach({ [ingredient.id]: { amount: 50, unit: 'ml' } })

      const expected = {
        name: cocktail.name,
        category: cocktail.category,
        recipe: cocktail.recipe,
        ...changes,
      }

      const response = await client
        .patch(`/cocktails/${cocktail.id}`)
        .withGuard('api')
        .loginAs(admin)
        .json(changes)

      response.assertStatus(200)
      response.assertBodyContains({
        ...expected,
        ingredients: [{ id: ingredient.id, amount: 50, unit: 'ml' }],
      })

      await cocktail.refresh()

      for (const field of ['name', 'category', 'recipe'] as const)
        assert.equal(cocktail[field], expected[field])

      await cocktail.load('ingredients')
      assert.lengthOf(cocktail.ingredients, 1)
      assert.equal(cocktail.ingredients[0].$extras.pivot_amount, 50)
    })

  test('pusta lista usuwa powiązania, pozostawiając składniki i inne koktajle', async ({
    client,
    assert,
  }) => {
    const [cocktail, other] = await Cocktail.createMany([
      { name: 'Mojito' },
      { name: 'Inny koktajl' },
    ])

    const ingredient = await IngredientFactory.create()

    await cocktail.related('ingredients').attach([ingredient.id])
    await other.related('ingredients').attach([ingredient.id])

    const response = await client
      .patch(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(admin)
      .json({ ingredients: [] })

    response.assertStatus(200)
    response.assertBodyContains({ id: cocktail.id, ingredients: [] })

    assert.lengthOf(await cocktail.related('ingredients').query(), 0)
    assert.lengthOf(await other.related('ingredients').query(), 1)

    await ingredient.refresh()
  })

  test('odrzuca niepoprawne pola bez zmiany rekordu: {field}')
    .with([
      { field: 'name', changes: { name: 'X' } },
      { field: 'name', changes: { name: 'A'.repeat(51) } },
      { field: 'category', changes: { category: 'AB' } },
      { field: 'category', changes: { category: 'A'.repeat(51) } },
      { field: 'recipe', changes: { recipe: 'A'.repeat(1001) } },
      { field: 'ingredients', changes: { ingredients: 'abc' } },
    ])
    .run(async ({ client, assert }, { changes, field }) => {
      const cocktail = await Cocktail.create({ name: 'Mojito' })

      await cocktail.refresh()
      const original = cocktail.serialize()

      const response = await client
        .patch(`/cocktails/${cocktail.id}`)
        .withGuard('api')
        .loginAs(admin)
        .unsafeJson({ name: 'Nowa nazwa', ...changes })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })

      await cocktail.refresh()
      assert.deepEqual(cocktail.serialize(), original)
    })

  test('odrzuca błędne dane relacji bez zmiany pól i istniejących powiązań: {label}')
    .with([
      {
        label: 'nieistniejący składnik',
        missing: true,
        changes: {},
        field: 'ingredients.1.ingredient_id',
      },
      {
        label: 'zerowa ilość',
        missing: false,
        changes: { amount: 0 },
        field: 'ingredients.1.amount',
      },
      {
        label: 'za długa jednostka',
        missing: false,
        changes: { unit: 'A'.repeat(21) },
        field: 'ingredients.1.unit',
      },
    ])
    .run(async ({ client, assert }, { missing, changes, field }) => {
      const cocktail = await Cocktail.create({ name: 'Mojito' })
      const [original, candidate] = await IngredientFactory.createMany(2)

      await cocktail.related('ingredients').attach({ [original.id]: { amount: 50, unit: 'ml' } })

      if (missing) await candidate.delete()

      const response = await client
        .patch(`/cocktails/${cocktail.id}`)
        .withGuard('api')
        .loginAs(admin)
        .unsafeJson({
          name: 'Nowa nazwa',
          ingredients: [
            { ingredient_id: original.id, amount: 100, unit: 'ml' },
            { ingredient_id: candidate.id, ...changes },
          ],
        })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })

      await cocktail.refresh()
      assert.equal(cocktail.name, 'Mojito')

      await cocktail.load('ingredients')

      assert.lengthOf(cocktail.ingredients, 1)
      assert.equal(cocktail.ingredients[0].id, original.id)
      assert.equal(cocktail.ingredients[0].$extras.pivot_amount, 50)
    })

  test('odrzuca niepoprawne ID: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client }, { id }) => {
      const response = await client
        .patch(`/cocktails/${id}`)
        .withGuard('api')
        .loginAs(admin)
        .json({ name: 'Mojito' })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'id' }] })
    })

  test('zwraca 404 dla nieistniejącego koktajlu', async ({ client }) => {
    const cocktail = await Cocktail.create({ name: 'Mojito' })

    await cocktail.delete()

    const response = await client
      .patch(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(admin)
      .json({ name: 'Nowa nazwa' })

    response.assertStatus(404)
  })

  test('wymaga administratora i zachowuje dane przy odmowie', async ({ client, assert }) => {
    const user = await createUser()

    const cocktail = await Cocktail.create({ name: 'Mojito' })
    const ingredient = await IngredientFactory.create()
    await cocktail.related('ingredients').attach([ingredient.id])

    const anonymous = await client
      .patch(`/cocktails/${cocktail.id}`)
      .json({ name: 'Nowa nazwa', ingredients: [] })

    anonymous.assertStatus(401)

    const forbidden = await client
      .patch(`/cocktails/${cocktail.id}`)
      .withGuard('api')
      .loginAs(user)
      .json({ name: 'Nowa nazwa', ingredients: [] })

    forbidden.assertStatus(403)

    await cocktail.refresh()

    assert.equal(cocktail.name, 'Mojito')
    assert.lengthOf(await cocktail.related('ingredients').query(), 1)
  })
})
