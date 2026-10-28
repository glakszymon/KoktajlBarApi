import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { IngredientFactory } from '#tests/helpers/ingredient_factory.spec'
import type User from '#models/user'
import { createUser } from '#tests/helpers/user'

type IngredientPage = {
  data: { id: number; name: string }[]
  meta: { nextPageUrl: string | null }
}

// Typy tras opisują modele Lucid, a tutaj odczytujemy ich serializowany JSON.
function readPage(response: { body(): unknown }): IngredientPage {
  return response.body() as IngredientPage
}

test.group('Ingredients | odczyt', (group) => {
  let user: User
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    user = await createUser()
  })

  test('odczytuje składnik po id', async ({ client }) => {
    // Fabryka generuje dane i zapisuje rekord w bazie
    const ingredient = await IngredientFactory.create()

    // Odczytujemy go przez API
    const response = await client
      .get(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(user)

    // Porównujemy odpowiedź z wartościami wygenerowanymi przez fabrykę
    response.assertStatus(200)
    response.assertBodyContains({
      id: ingredient.id,
      name: ingredient.name,
      description: ingredient.description,
      photoUrl: ingredient.photoUrl,
    })
  })

  test('zwraca 404 dla nieistniejącego składnika', async ({ client }) => {
    const ingredient = await IngredientFactory.create()
    const id = ingredient.id
    await ingredient.delete()

    const response = await client.get(`/ingredients/${id}`).withGuard('api').loginAs(user)

    response.assertStatus(404)
  })

  test('Niepoprawny format id: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client }, { id }) => {
      const response = await client.get(`/ingredients/${id}`).withGuard('api').loginAs(user)

      response.assertStatus(422)
      response.assertBodyContains({
        errors: [{ field: 'id' }],
      })
    })

  test('zwraca null dla pustych pól opcjonalnych', async ({ client }) => {
    const ingredient = await IngredientFactory.merge({
      description: null,
      photoUrl: null,
    }).create()

    const response = await client
      .get(`/ingredients/${ingredient.id}`)
      .withGuard('api')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      id: ingredient.id,
      description: null,
      photoUrl: null,
    })
  })
})

test.group('Ingredients | odczyt listy', (group) => {
  let user: User
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  group.each.setup(async () => {
    user = await createUser()
    await db.from('cocktail_ingredients').delete()
    await db.from('ingredients').delete()
  })

  test('zwraca listę składników i metadane paginacji', async ({ client, assert }) => {
    const ingredients = await IngredientFactory.createMany(3)

    const response = await client.get('/ingredients').withGuard('api').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        description: ingredient.description,
        photoUrl: ingredient.photoUrl,
      })),
      meta: { total: 3, currentPage: 1, perPage: 10 },
    })
    assert.lengthOf(readPage(response).data, 3)
  })

  test('domyślnie zwraca pierwszą stronę z dziesięcioma składnikami', async ({
    client,
    assert,
  }) => {
    const ingredients = await IngredientFactory.createMany(11)

    const response = await client.get('/ingredients').withGuard('api').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      meta: { total: 11, currentPage: 1, perPage: 10, lastPage: 2 },
    })
    const body = readPage(response)
    assert.lengthOf(body.data, 10)
    assert.deepEqual(
      body.data.map((item: { id: number }) => item.id),
      ingredients.slice(0, 10).map((ingredient) => ingredient.id)
    )
    assert.isString(body.meta.nextPageUrl)
    if (!body.meta.nextPageUrl) throw new Error('Brak linku do kolejnej strony')
    const next = new URL(body.meta.nextPageUrl, 'http://localhost')
    assert.equal(next.searchParams.get('page'), '2')
  })

  test('ogranicza liczbę składników parametrem limit', async ({ client, assert }) => {
    await IngredientFactory.createMany(3)

    const response = await client
      .get('/ingredients')
      .withGuard('api')
      .loginAs(user)
      .qs({ limit: 2 })

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 3, perPage: 2, currentPage: 1 } })
    assert.lengthOf(readPage(response).data, 2)
  })

  test('zwraca ostatni składnik na drugiej stronie bez powtórzeń', async ({ client, assert }) => {
    const ingredients = await IngredientFactory.createMany(3)

    const first = await client
      .get('/ingredients')
      .withGuard('api')
      .loginAs(user)
      .qs({ limit: 2, page: 1 })
    const second = await client
      .get('/ingredients')
      .withGuard('api')
      .loginAs(user)
      .qs({ limit: 2, page: 2 })

    first.assertStatus(200)
    second.assertStatus(200)
    second.assertBodyContains({
      data: [{ id: ingredients[2].id }],
      meta: { total: 3, currentPage: 2, nextPageUrl: null },
    })
    assert.lengthOf(readPage(first).data, 2)
    assert.lengthOf(readPage(second).data, 1)
    const firstIds = readPage(first).data.map((item) => item.id)
    assert.deepEqual(
      firstIds,
      ingredients.slice(0, 2).map((ingredient) => ingredient.id)
    )
    assert.notInclude(firstIds, readPage(second).data[0].id)
  })

  test('sortuje składniki po nazwie: {sortOrder}')
    .with([
      { sortOrder: 'asc', expectedNames: ['Limonka', 'Mięta', 'Rum'] },
      { sortOrder: 'desc', expectedNames: ['Rum', 'Mięta', 'Limonka'] },
    ])
    .run(async ({ client, assert }, { sortOrder, expectedNames }) => {
      for (const name of ['Rum', 'Limonka', 'Mięta']) {
        await IngredientFactory.merge({ name }).create()
      }

      const response = await client
        .get('/ingredients')
        .withGuard('api')
        .loginAs(user)
        .qs({ sortBy: 'name', sortOrder })

      response.assertStatus(200)
      assert.deepEqual(
        readPage(response).data.map((item) => item.name),
        expectedNames
      )
    })

  test('filtruje składniki po alcohol: {alcohol}')
    .with([{ alcohol: true }, { alcohol: false }])
    .run(async ({ client, assert }, { alcohol }) => {
      const alcoholic = await IngredientFactory.merge({ alcohol: true }).createMany(2)
      const nonAlcoholic = await IngredientFactory.merge({ alcohol: false }).createMany(2)
      const expected = alcohol ? alcoholic : nonAlcoholic

      const response = await client
        .get('/ingredients')
        .withGuard('api')
        .loginAs(user)
        .qs({ alcohol })

      response.assertStatus(200)
      response.assertBodyContains({ meta: { total: 2 } })
      // Dokładne porównanie ID sprawdza też wykluczenie drugiej grupy.
      assert.deepEqual(
        readPage(response).data.map((item) => item.id),
        expected.map((ingredient) => ingredient.id)
      )
    })

  test('zwraca pustą listę, gdy żaden składnik nie pasuje do filtra', async ({
    client,
    assert,
  }) => {
    await IngredientFactory.merge({ alcohol: true }).createMany(3)

    const response = await client
      .get('/ingredients')
      .withGuard('api')
      .loginAs(user)
      .qs({ alcohol: false })

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 0, nextPageUrl: null } })
    assert.deepEqual(readPage(response).data, [])
  })

  test('zwraca pustą listę dla pustej bazy', async ({ client, assert }) => {
    const response = await client.get('/ingredients').withGuard('api').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 0, currentPage: 1, nextPageUrl: null } })
    assert.deepEqual(readPage(response).data, [])
  })

  test('zachowuje filtr, limit i sortowanie w linku do kolejnej strony', async ({
    client,
    assert,
  }) => {
    const ingredients = []
    for (const name of ['Rum', 'Limonka', 'Mięta']) {
      ingredients.push(await IngredientFactory.merge({ name, alcohol: false }).create())
    }
    await IngredientFactory.merge({ name: 'Wódka', alcohol: true }).create()

    const response = await client.get('/ingredients').withGuard('api').loginAs(user).qs({
      alcohol: false,
      limit: 2,
      sortBy: 'name',
      sortOrder: 'desc',
    })

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 3 } })
    assert.deepEqual(
      readPage(response).data.map((item) => item.id),
      [ingredients[0].id, ingredients[2].id]
    )
    const nextPageUrl = readPage(response).meta.nextPageUrl
    assert.isString(nextPageUrl)
    if (!nextPageUrl) throw new Error('Brak linku do kolejnej strony')
    const next = new URL(nextPageUrl, 'http://localhost')
    assert.equal(next.pathname, '/ingredients')
    assert.equal(next.searchParams.get('page'), '2')
    assert.equal(next.searchParams.get('limit'), '2')
    assert.equal(next.searchParams.get('alcohol'), 'false')
    assert.equal(next.searchParams.get('sortBy'), 'name')
    assert.equal(next.searchParams.get('sortOrder'), 'desc')

    const second = await client.get(`${next.pathname}${next.search}`).withGuard('api').loginAs(user)

    second.assertStatus(200)
    second.assertBodyContains({ meta: { total: 3, currentPage: 2, nextPageUrl: null } })
    assert.deepEqual(
      readPage(second).data.map((item) => item.id),
      [ingredients[1].id]
    )
  })
})
