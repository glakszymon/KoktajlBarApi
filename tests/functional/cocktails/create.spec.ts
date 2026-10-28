import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import Cocktail from '#models/cocktail'
import type User from '#models/user'

import { createUser } from '#tests/helpers/user'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'

test.group('Cocktails | tworzenie', (group) => {
  let admin: User

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  group.each.setup(async () => {
    admin = await createUser('admin')
  })

  test('tworzy koktajl ze składnikami, ilościami i jednostkami', async ({ client, assert }) => {
    const ingredients = await IngredientFactory.createMany(2)

    const response = await client
      .post('/cocktails')
      .withGuard('api')
      .loginAs(admin)
      .json({
        name: '  Mojito  ',
        category: '  Long Drink  ',
        recipe: 'Wymieszaj składniki i dodaj lód.',
        ingredients: [
          { ingredient_id: ingredients[0].id, amount: 50, unit: '  ml  ' },
          { ingredient_id: ingredients[1].id, amount: 8, unit: 'liści' },
        ],
      })

    response.assertStatus(201)

    response.assertBodyContains({
      name: 'Mojito',
      category: 'Long Drink',
      recipe: 'Wymieszaj składniki i dodaj lód.',
      ingredients: [
        { id: ingredients[0].id, amount: 50, unit: 'ml' },
        { id: ingredients[1].id, amount: 8, unit: 'liści' },
      ],
    })

    const body = response.body()
    if (!('id' in body)) throw new Error('Brak ID utworzonego koktajlu')

    const cocktail = await Cocktail.findOrFail(body.id)

    assert.equal(cocktail.name, 'Mojito')
    assert.equal(cocktail.category, 'Long Drink')

    await cocktail.load('ingredients')

    assert.lengthOf(cocktail.ingredients, 2)

    const first = cocktail.ingredients.find((ingredient) => ingredient.id === ingredients[0].id)!

    assert.equal(first.$extras.pivot_amount, 50)
    assert.equal(first.$extras.pivot_unit, 'ml')
  })

  test('tworzy koktajl z minimalnymi danymi: {label}')
    .with([
      { label: 'minimalna nazwa', payload: { name: 'AB' } },
      { label: 'maksymalna nazwa', payload: { name: 'A'.repeat(30) } },
      { label: 'pusta lista składników', payload: { name: 'Mojito', ingredients: [] } },
    ])
    .run(async ({ client, assert }, { payload }) => {
      const response = await client.post('/cocktails').withGuard('api').loginAs(admin).json(payload)

      response.assertStatus(201)
      response.assertBodyContains({ name: payload.name, ingredients: [] })

      const body = response.body()

      if (!('id' in body)) throw new Error('Brak ID utworzonego koktajlu')

      const cocktail = await Cocktail.findOrFail(body.id)

      assert.isNull(cocktail.category)
      assert.isNull(cocktail.recipe)
      assert.lengthOf(await cocktail.related('ingredients').query(), 0)
    })

  test('pozwala pominąć ilość i jednostkę składnika', async ({ client, assert }) => {
    const ingredient = await IngredientFactory.create()

    const response = await client
      .post('/cocktails')
      .withGuard('api')
      .loginAs(admin)
      .json({
        name: 'Mojito',
        ingredients: [{ ingredient_id: ingredient.id }],
      })

    response.assertStatus(201)

    const body = response.body()

    if (!('id' in body)) throw new Error('Brak ID utworzonego koktajlu')

    const cocktail = await Cocktail.findOrFail(body.id)
    await cocktail.load('ingredients')

    assert.lengthOf(cocktail.ingredients, 1)
    assert.isNull(cocktail.ingredients[0].$extras.pivot_amount)
    assert.isNull(cocktail.ingredients[0].$extras.pivot_unit)
  })

  test('odrzuca niepoprawne dane bez zapisu: {label}')
    .with([
      { label: 'brak nazwy', changes: { name: undefined }, field: 'name' },
      { label: 'krótka nazwa', changes: { name: 'X' }, field: 'name' },
      { label: 'same spacje', changes: { name: '   ' }, field: 'name' },
      { label: 'za długa nazwa', changes: { name: 'A'.repeat(31) }, field: 'name' },
      { label: 'krótka kategoria', changes: { category: 'AB' }, field: 'category' },
      { label: 'za długa kategoria', changes: { category: 'A'.repeat(31) }, field: 'category' },
      { label: 'za długi przepis', changes: { recipe: 'A'.repeat(1001) }, field: 'recipe' },
      { label: 'składniki nie są tablicą', changes: { ingredients: 'abc' }, field: 'ingredients' },
      {
        label: 'brak ID składnika',
        changes: { ingredients: [{}] },
        field: 'ingredients.0.ingredient_id',
      },
      {
        label: 'ujemne ID',
        changes: { ingredients: [{ ingredient_id: -1 }] },
        field: 'ingredients.0.ingredient_id',
      },
    ])
    .run(async ({ client, assert }, { changes, field }) => {
      const before = await db.from('cocktails').count('* as total').first()
      const pivots = await db.from('cocktail_ingredients').count('* as total').first()

      const response = await client
        .post('/cocktails')
        .withGuard('api')
        .loginAs(admin)
        .unsafeJson({ name: 'Mojito', ...changes })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })

      assert.deepEqual(await db.from('cocktails').count('* as total').first(), before)
      assert.deepEqual(await db.from('cocktail_ingredients').count('* as total').first(), pivots)
    })

  test('waliduje dane relacji składnika: {label}')
    .with([
      { label: 'zerowa ilość', changes: { amount: 0 }, field: 'ingredients.0.amount' },
      { label: 'ujemna ilość', changes: { amount: -1 }, field: 'ingredients.0.amount' },
      { label: 'błędna ilość', changes: { amount: 'abc' }, field: 'ingredients.0.amount' },
      {
        label: 'za długa jednostka',
        changes: { unit: 'A'.repeat(21) },
        field: 'ingredients.0.unit',
      },
    ])
    .run(async ({ client, assert }, { changes, field }) => {
      const ingredient = await IngredientFactory.create()

      const response = await client
        .post('/cocktails')
        .withGuard('api')
        .loginAs(admin)
        .unsafeJson({
          name: 'Mojito',
          ingredients: [{ ingredient_id: ingredient.id, ...changes }],
        })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })

      assert.lengthOf(await Cocktail.all(), 0)
      assert.lengthOf(await db.from('cocktail_ingredients').select('*'), 0)
    })

  test('odrzuca nieistniejący składnik bez tworzenia koktajlu', async ({ client, assert }) => {
    const ingredient = await IngredientFactory.create()
    await ingredient.delete()

    const response = await client
      .post('/cocktails')
      .withGuard('api')
      .loginAs(admin)
      .json({
        name: 'Mojito',
        ingredients: [{ ingredient_id: ingredient.id }],
      })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'ingredients.0.ingredient_id' }] })

    assert.lengthOf(await Cocktail.all(), 0)
  })

  test('wymaga tokena administratora i nie zapisuje danych przy odmowie', async ({
    client,
    assert,
  }) => {
    const user = await createUser()

    const anonymous = await client.post('/cocktails').json({ name: 'Mojito' })
    anonymous.assertStatus(401)

    const forbidden = await client
      .post('/cocktails')
      .withGuard('api')
      .loginAs(user)
      .json({ name: 'Mojito' })

    forbidden.assertStatus(403)

    assert.lengthOf(await Cocktail.all(), 0)
  })
})
