import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

import Cocktail from '#models/cocktail'
import type User from '#models/user'
import { createUser } from '#tests/helpers/user'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'

const recipes = [
  { label: 'same bezalkoholowe', flags: [false, false], expected: false },
  { label: 'same alkoholowe', flags: [true, true], expected: true },
  { label: 'jeden alkoholowy na końcu', flags: [false, false, true], expected: true },
  { label: 'jeden alkoholowy na początku', flags: [true, false, false], expected: true },
  { label: 'brak składników', flags: [], expected: false },
]

test.group('Cocktails | alkoholowość', (group) => {
  let owner: User

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    owner = await createUser()
  })

  async function createIngredients(flags: boolean[]) {
    const ingredients = []
    for (const alcohol of flags) {
      ingredients.push(await IngredientFactory.merge({ alcohol }).create())
    }
    return ingredients
  }

  test('zwraca alcohol w szczegółach i na liście: {label}')
    .with(recipes)
    .run(async ({ client }, { flags, expected }) => {
      const cocktail = await Cocktail.create({ name: 'Test alkoholowości', userId: owner.id })
      const ingredients = await createIngredients(flags)
      if (ingredients.length > 0) {
        await cocktail.related('ingredients').attach(ingredients.map((ingredient) => ingredient.id))
      }

      const details = await client.get(`/cocktails/${cocktail.id}`)
      details.assertStatus(200)
      details.assertBodyContains({ id: cocktail.id, alcohol: expected })

      // Kategoria ogranicza listę do fixture tego testu, niezależnie od innych danych w bazie.
      cocktail.category = `alcohol-${cocktail.id}`
      await cocktail.save()
      const list = await client.get('/cocktails').qs({ category: cocktail.category })
      list.assertStatus(200)
      list.assertBodyContains({
        meta: { total: 1 },
        data: [{ id: cocktail.id, alcohol: expected }],
      })
    })

  test('zwraca alcohol po utworzeniu koktajlu: {label}')
    .with(recipes)
    .run(async ({ client }, { flags, expected }) => {
      const ingredients = await createIngredients(flags)
      const response = await client
        .post('/cocktails')
        .withGuard('api')
        .loginAs(owner)
        .json({
          name: 'Test alkoholowości',
          ingredients: ingredients.map((ingredient) => ({ ingredient_id: ingredient.id })),
        })

      response.assertStatus(201)
      response.assertBodyContains({ alcohol: expected })
    })

  test('przelicza alcohol po zmianie receptury: {label}')
    .with([
      { label: 'dodanie alkoholu', before: [false], after: [false, true], expected: true },
      {
        label: 'usunięcie ostatniego alkoholu',
        before: [true, false],
        after: [false],
        expected: false,
      },
      { label: 'pozostawienie alkoholu', before: [true, true], after: [true], expected: true },
      { label: 'usunięcie wszystkich składników', before: [true], after: [], expected: false },
    ])
    .run(async ({ client }, { before, after, expected }) => {
      const cocktail = await Cocktail.create({ name: 'Test alkoholowości', userId: owner.id })
      const initialIngredients = await createIngredients(before)
      await cocktail
        .related('ingredients')
        .attach(initialIngredients.map((ingredient) => ingredient.id))
      const ingredients = await createIngredients(after)

      const updated = await client
        .patch(`/cocktails/${cocktail.id}`)
        .withGuard('api')
        .loginAs(owner)
        .json({ ingredients: ingredients.map((ingredient) => ({ ingredient_id: ingredient.id })) })

      updated.assertStatus(200)
      updated.assertBodyContains({ id: cocktail.id, alcohol: expected })

      const details = await client.get(`/cocktails/${cocktail.id}`)
      details.assertStatus(200)
      details.assertBodyContains({ id: cocktail.id, alcohol: expected })
    })

  test('uwzględnia zmianę alkoholowości składnika bez edycji koktajlu: {alcohol}')
    .with([{ alcohol: true }, { alcohol: false }])
    .run(async ({ client, assert }, { alcohol }) => {
      const cocktail = await Cocktail.create({ name: 'Test alkoholowości', userId: owner.id })
      cocktail.category = `alcohol-${cocktail.id}`
      await cocktail.save()
      const ingredient = await IngredientFactory.merge({ alcohol: !alcohol }).create()
      await cocktail.related('ingredients').attach([ingredient.id])

      const before = await client.get(`/cocktails/${cocktail.id}`)
      before.assertStatus(200)
      before.assertBodyContains({ alcohol: !alcohol })

      ingredient.alcohol = alcohol
      await ingredient.save()

      const details = await client.get(`/cocktails/${cocktail.id}`)
      details.assertStatus(200)
      details.assertBodyContains({ id: cocktail.id, alcohol })

      const matching = await client.get('/cocktails').qs({ category: cocktail.category, alcohol })
      matching.assertStatus(200)
      matching.assertBodyContains({
        meta: { total: 1 },
        data: [{ id: cocktail.id, alcohol }],
      })

      const excluded = await client
        .get('/cocktails')
        .qs({ category: cocktail.category, alcohol: !alcohol })
      excluded.assertStatus(200)
      assert.deepEqual((excluded.body() as unknown as { data: unknown[] }).data, [])
      excluded.assertBodyContains({ meta: { total: 0 } })
    })
})
