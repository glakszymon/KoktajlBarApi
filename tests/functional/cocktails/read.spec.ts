import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import Cocktail from '#models/cocktail'
import type User from '#models/user'

import { createUser } from '#tests/helpers/user'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'

type CocktailPage = {
  data: { id: number; name: string; ingredients: { id: number; amount: number; unit: string }[] }[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    nextPageUrl: string | null
  }
}

function readPage(response: { body(): unknown }): CocktailPage {
  return response.body() as CocktailPage
}

test.group('Cocktails | odczyt', (group) => {
  let user: User

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  group.each.setup(async () => {
    user = await createUser()

    await db.from('cocktail_ingredients').delete()
    await db.from('cocktails').delete()
  })

  test('odczytuje koktajl wraz z ilością i jednostką składnika', async ({ client }) => {
    const cocktail = await Cocktail.create({
      userId: user.id,
      name: 'Mojito',
      category: 'Long Drink',
      recipe: 'Wymieszaj.',
    })
    const ingredient = await IngredientFactory.create()

    await cocktail.related('ingredients').attach({ [ingredient.id]: { amount: 50, unit: 'ml' } })

    const response = await client.get(`/cocktails/${cocktail.id}`).withGuard('api').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      id: cocktail.id,
      name: 'Mojito',
      category: 'Long Drink',
      recipe: 'Wymieszaj.',
      ingredients: [{ id: ingredient.id, name: ingredient.name, amount: 50, unit: 'ml' }],
    })
  })

  test('zwraca null dla opcjonalnych pól i pustą listę składników', async ({ client }) => {
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: user.id })

    const response = await client.get(`/cocktails/${cocktail.id}`).withGuard('api').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ id: cocktail.id, category: null, recipe: null, ingredients: [] })
  })

  test('zwraca 404 dla nieistniejącego koktajlu', async ({ client }) => {
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: user.id })
    await cocktail.delete()

    const response = await client.get(`/cocktails/${cocktail.id}`).withGuard('api').loginAs(user)

    response.assertStatus(404)
  })

  test('odrzuca niepoprawne ID: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client }, { id }) => {
      const response = await client.get(`/cocktails/${id}`).withGuard('api').loginAs(user)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'id' }] })
    })

  test('zwraca pustą listę dla pustej bazy', async ({ client, assert }) => {
    const response = await client.get('/cocktails').withGuard('api').loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(readPage(response).data, [])
    response.assertBodyContains({ meta: { total: 0, currentPage: 1, perPage: 10 } })
  })

  test('domyślnie zwraca 10 rekordów i kolejną stronę bez powtórzeń', async ({
    client,
    assert,
  }) => {
    const cocktails = await Cocktail.createMany(
      Array.from({ length: 11 }, (_, i) => ({ name: `Koktajl ${i}`, userId: user.id }))
    )

    const first = await client.get('/cocktails').withGuard('api').loginAs(user)

    first.assertStatus(200)
    first.assertBodyContains({ meta: { total: 11, perPage: 10, currentPage: 1, lastPage: 2 } })

    assert.deepEqual(
      readPage(first).data.map((item) => item.id),
      cocktails.slice(0, 10).map((item) => item.id)
    )

    const next = new URL(readPage(first).meta.nextPageUrl!, 'http://localhost')
    const second = await client.get(`${next.pathname}${next.search}`).withGuard('api').loginAs(user)

    second.assertStatus(200)
    assert.deepEqual(
      readPage(second).data.map((item) => item.id),
      [cocktails[10].id]
    )
    assert.isNull(readPage(second).meta.nextPageUrl)
  })

  test('sortuje po nazwie: {sortOrder}')
    .with([
      { sortOrder: 'asc', expected: ['Alpha', 'Bravo', 'Charlie'] },
      { sortOrder: 'desc', expected: ['Charlie', 'Bravo', 'Alpha'] },
    ])
    .run(async ({ client, assert }, { sortOrder, expected }) => {
      await Cocktail.createMany(
        ['Bravo', 'Charlie', 'Alpha'].map((name) => ({ name, userId: user.id }))
      )

      const response = await client
        .get('/cocktails')
        .withGuard('api')
        .loginAs(user)
        .qs({ sortBy: 'name', sortOrder })

      response.assertStatus(200)

      assert.deepEqual(
        readPage(response).data.map((item) => item.name),
        expected
      )
    })

  test('filtruje po autorze bez tokena i pomija filtr, gdy nie podano userId', async ({
    client,
    assert,
  }) => {
    const otherAuthor = await createUser()
    const [own, other, anotherOwn] = await Cocktail.createMany([
      { name: 'Własny', userId: user.id },
      { name: 'Innego autora', userId: otherAuthor.id },
      { name: 'Kolejny własny', userId: user.id },
    ])

    const filtered = await client.get('/cocktails').qs({ userId: user.id })

    filtered.assertStatus(200)
    filtered.assertBodyContains({ meta: { total: 2 } })
    assert.deepEqual(
      readPage(filtered).data.map((item) => item.id),
      [own.id, anotherOwn.id]
    )

    const all = await client.get('/cocktails')

    all.assertStatus(200)
    all.assertBodyContains({ meta: { total: 3 } })
    assert.deepEqual(
      readPage(all).data.map((item) => item.id),
      [own.id, other.id, anotherOwn.id]
    )
  })

  test('zwraca pustą listę dla autora bez koktajli: {label}')
    .with([
      { label: 'istniejący użytkownik', deleted: false },
      { label: 'nieistniejący użytkownik', deleted: true },
    ])
    .run(async ({ client, assert }, { deleted }) => {
      const author = await createUser()
      const userId = author.id
      if (deleted) {
        await author.delete()
      }
      await Cocktail.create({ name: 'Innego autora', userId: user.id })

      const response = await client.get('/cocktails').qs({ userId })

      response.assertStatus(200)
      response.assertBodyContains({ meta: { total: 0 } })
      assert.deepEqual(readPage(response).data, [])
      assert.isNull(readPage(response).meta.nextPageUrl)
    })

  test('filtruje po alkoholowości całego koktajlu: {alcohol}')
    .with([{ alcohol: true }, { alcohol: false }])
    .run(async ({ client, assert }, { alcohol }) => {
      const alcoholic = await IngredientFactory.merge({ alcohol: true }).create()
      const nonAlcoholic = await IngredientFactory.merge({ alcohol: false }).create()

      const [strong, virgin, mixed, empty] = await Cocktail.createMany([
        { name: 'Strong', userId: user.id },
        { name: 'Virgin', userId: user.id },
        { name: 'Mixed', userId: user.id },
        { name: 'Empty', userId: user.id },
      ])

      await strong.related('ingredients').attach([alcoholic.id])
      await virgin.related('ingredients').attach([nonAlcoholic.id])
      await mixed.related('ingredients').attach([alcoholic.id, nonAlcoholic.id])

      const response = await client.get('/cocktails').withGuard('api').loginAs(user).qs({ alcohol })

      response.assertStatus(200)

      // Wystarczy jeden alkoholowy składnik; brak składników oznacza alcohol=false.
      assert.deepEqual(
        readPage(response).data.map((item) => item.id),
        alcohol ? [strong.id, mixed.id] : [virgin.id, empty.id]
      )
      response.assertBodyContains({
        meta: { total: 2 },
        data: alcohol
          ? [
              { id: strong.id, alcohol: true },
              { id: mixed.id, alcohol: true },
            ]
          : [
              { id: virgin.id, alcohol: false },
              { id: empty.id, alcohol: false },
            ],
      })
    })

  test('wymaga wszystkich wskazanych składników i zwraca także dodatkowe składniki', async ({
    client,
    assert,
  }) => {
    const first = await IngredientFactory.create()
    const second = await IngredientFactory.create()
    const extra = await IngredientFactory.create()
    const [both, withExtra, onlyFirst, onlySecond, empty] = await Cocktail.createMany(
      ['Oba', 'Z dodatkiem', 'Tylko pierwszy', 'Tylko drugi', 'Bez składników'].map((name) => ({
        name,
        userId: user.id,
      }))
    )
    await both.related('ingredients').attach([first.id, second.id])
    await withExtra.related('ingredients').attach([first.id, second.id, extra.id])
    await onlyFirst.related('ingredients').attach([first.id])
    await onlySecond.related('ingredients').attach([second.id])

    const response = await client
      .get('/cocktails')
      .qs({ ingredientIds: `${first.id},${second.id}` })

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 2 } })
    const page = readPage(response)
    assert.deepEqual(
      page.data.map((item) => item.id),
      [both.id, withExtra.id]
    )
    assert.sameMembers(
      page.data[1].ingredients.map((item) => item.id),
      [first.id, second.id, extra.id]
    )

    const unfiltered = await client.get('/cocktails')
    unfiltered.assertStatus(200)
    assert.deepEqual(
      readPage(unfiltered).data.map((item) => item.id),
      [both.id, withExtra.id, onlyFirst.id, onlySecond.id, empty.id]
    )
  })

  test('obsługuje pojedynczy składnik, powtórzenia ID i białe znaki wokół listy', async ({
    client,
    assert,
  }) => {
    const ingredient = await IngredientFactory.create()
    const cocktail = await Cocktail.create({ name: 'Pasujący', userId: user.id })
    await cocktail.related('ingredients').attach([ingredient.id])
    await Cocktail.create({ name: 'Bez składników', userId: user.id })

    for (const ingredientIds of [String(ingredient.id), `  ${ingredient.id},${ingredient.id}  `]) {
      const response = await client.get('/cocktails').qs({ ingredientIds })

      response.assertStatus(200)
      response.assertBodyContains({ meta: { total: 1 } })
      assert.deepEqual(
        readPage(response).data.map((item) => item.id),
        [cocktail.id]
      )
    }
  })

  test('zwraca pustą listę, gdy jeden z wymaganych składników nie istnieje', async ({
    client,
    assert,
  }) => {
    const ingredient = await IngredientFactory.create()
    const missing = await IngredientFactory.create()
    await missing.delete()
    const cocktail = await Cocktail.create({ name: 'Częściowe dopasowanie', userId: user.id })
    await cocktail.related('ingredients').attach([ingredient.id])

    const response = await client
      .get('/cocktails')
      .qs({ ingredientIds: `${ingredient.id},${missing.id}` })

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 0 } })
    assert.deepEqual(readPage(response).data, [])
    assert.isNull(readPage(response).meta.nextPageUrl)
  })

  test('akceptuje graniczną liczbę 50 składników', async ({ client, assert }) => {
    const response = await client.get('/cocktails').qs({
      ingredientIds: Array.from({ length: 50 }, (_, index) => index + 1).join(','),
    })

    response.assertStatus(200)
    assert.deepEqual(readPage(response).data, [])
  })

  test('łączy autora, składniki, kategorię, alkohol, sortowanie i limit oraz zachowuje je w linkach', async ({
    client,
    assert,
  }) => {
    const ingredient = await IngredientFactory.merge({ alcohol: true }).create()
    const firstRequired = await IngredientFactory.merge({ alcohol: false }).create()
    const secondRequired = await IngredientFactory.merge({ alcohol: false }).create()
    const ingredientIds = `${firstRequired.id},${secondRequired.id}`
    const otherAuthor = await createUser()
    const otherCocktail = await Cocktail.create({
      name: 'Zulu',
      category: 'Long Drink',
      userId: otherAuthor.id,
    })
    await otherCocktail
      .related('ingredients')
      .attach([ingredient.id, firstRequired.id, secondRequired.id])

    const cocktails = await Cocktail.createMany([
      { name: 'Alpha', category: 'Long Drink', userId: user.id },
      { name: 'Bravo', category: 'Long Drink', userId: user.id },
      { name: 'Charlie', category: 'Long Drink', userId: user.id },
      { name: 'Other', category: 'Short Drink', userId: user.id },
      { name: 'Empty', category: 'Long Drink', userId: user.id },
      { name: 'Missing ingredient', category: 'Long Drink', userId: user.id },
    ])

    for (const cocktail of cocktails.slice(0, 4)) {
      await cocktail.related('ingredients').attach({
        [ingredient.id]: { amount: 50, unit: 'ml' },
        [firstRequired.id]: {},
        [secondRequired.id]: {},
      })
    }
    await cocktails[4].related('ingredients').attach([firstRequired.id, secondRequired.id])
    await cocktails[5].related('ingredients').attach([ingredient.id, firstRequired.id])

    const response = await client.get('/cocktails').withGuard('api').loginAs(user).qs({
      userId: user.id,
      category: 'Long Drink',
      alcohol: true,
      ingredientIds,
      limit: 2,
      sortBy: 'name',
      sortOrder: 'desc',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      meta: { total: 3, perPage: 2 },
      data: [
        { id: cocktails[2].id, ingredients: [{ id: ingredient.id, amount: 50, unit: 'ml' }] },
        { id: cocktails[1].id },
      ],
    })

    const page = readPage(response)
    assert.lengthOf(page.data, 2)

    const next = new URL(page.meta.nextPageUrl!, 'http://localhost')
    assert.equal(next.pathname, '/cocktails')

    for (const [key, value] of Object.entries({
      userId: String(user.id),
      category: 'Long Drink',
      alcohol: 'true',
      ingredientIds,
      limit: '2',
      sortBy: 'name',
      sortOrder: 'desc',
      page: '2',
    })) {
      assert.equal(next.searchParams.get(key), value)
    }

    const second = await client.get(`${next.pathname}${next.search}`).withGuard('api').loginAs(user)

    second.assertStatus(200)
    second.assertBodyContains({ meta: { total: 3 } })
    assert.deepEqual(
      readPage(second).data.map((item) => item.id),
      [cocktails[0].id]
    )

    const empty = await client
      .get('/cocktails')
      .withGuard('api')
      .loginAs(user)
      .qs({ category: 'Nieistniejąca' })

    empty.assertStatus(200)
    assert.deepEqual(readPage(empty).data, [])
  })

  test('odrzuca niepoprawne parametry listy: {field}')
    .with([
      { field: 'page', value: 'abc' },
      { field: 'page', value: '0' },
      { field: 'page', value: '1.5' },
      { field: 'limit', value: '0' },
      { field: 'limit', value: '101' },
      { field: 'sortBy', value: 'password' },
      { field: 'sortOrder', value: 'wrong' },
      { field: 'alcohol', value: 'wrong' },
      { field: 'userId', value: 'abc' },
      { field: 'userId', value: '0' },
      { field: 'userId', value: '-1' },
      { field: 'userId', value: '1.5' },
      { field: 'userId', value: '' },
      { field: 'ingredientIds', value: '' },
      { field: 'ingredientIds', value: 'abc' },
      { field: 'ingredientIds', value: '0' },
      { field: 'ingredientIds', value: '-1' },
      { field: 'ingredientIds', value: '1.5' },
      { field: 'ingredientIds', value: '2,abc' },
      { field: 'ingredientIds', value: '2,0' },
      { field: 'ingredientIds', value: '2,,5' },
      { field: 'ingredientIds', value: ',2' },
      { field: 'ingredientIds', value: '2,' },
      { field: 'ingredientIds', value: '2, 5' },
      {
        field: 'ingredientIds',
        value: Array.from({ length: 51 }, (_, index) => index + 1).join(','),
      },
    ])
    .run(async ({ client }, { field, value }) => {
      const response = await client
        .get('/cocktails')
        .withGuard('api')
        .loginAs(user)
        .qs({ [field]: value })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })
    })

  test('udostępnia listę i szczegóły bez tokena', async ({ client }) => {
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: user.id })

    const list = await client.get('/cocktails')
    list.assertStatus(200)
    list.assertBodyContains({ data: [{ id: cocktail.id }] })

    const details = await client.get(`/cocktails/${cocktail.id}`)
    details.assertStatus(200)
    details.assertBodyContains({ id: cocktail.id, name: 'Mojito' })
  })
})
