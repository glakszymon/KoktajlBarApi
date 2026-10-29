import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import Cocktail from '#models/cocktail'
import Comment from '#models/comment'
import type User from '#models/user'
import { createUser } from '#tests/helpers/user'

type CommentPage = {
  data: { id: number; cocktailId: number; userId: number; rating: number; content: string | null }[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    nextPageUrl: string | null
  }
}

function readPage(response: { body(): unknown }): CommentPage {
  return response.body() as CommentPage
}

const endpoint = (id: number | string) => `/cocktails/${id}/comments`

test.group('Comments | lista komentarzy koktajlu', (group) => {
  let user: User
  let cocktail: Cocktail

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    user = await createUser()
    cocktail = await Cocktail.create({ name: 'Mojito', userId: user.id })
  })

  test('publicznie zwraca tylko komentarze wybranego przepisu i nie zmienia danych', async ({
    client,
    assert,
  }) => {
    const author = await createUser()
    const comment = await Comment.create({
      cocktailId: cocktail.id,
      userId: author.id,
      rating: 4,
      content: 'Dobry przepis.',
    })
    const other = await Cocktail.create({ name: 'Inny', userId: user.id })
    await Comment.create({ cocktailId: other.id, userId: user.id, rating: 5, content: null })
    const before = {
      comments: await db.from('comments').orderBy('id'),
      cocktail: await db.from('cocktails').where('id', cocktail.id).first(),
    }

    // Odczyt bez tokena, również komentarza napisanego przez innego użytkownika.
    const response = await client.get(endpoint(cocktail.id))

    response.assertStatus(200)
    response.assertBodyContains({
      data: [
        {
          id: comment.id,
          cocktailId: cocktail.id,
          userId: author.id,
          rating: 4,
          content: 'Dobry przepis.',
        },
      ],
      meta: { total: 1, perPage: 10, currentPage: 1 },
    })
    assert.lengthOf(readPage(response).data, 1)
    assert.deepEqual(await db.from('comments').orderBy('id'), before.comments)
    assert.deepEqual(await db.from('cocktails').where('id', cocktail.id).first(), before.cocktail)
  })

  test('istniejący koktajl bez komentarzy zwraca pustą listę', async ({ client, assert }) => {
    const response = await client.get(endpoint(cocktail.id))

    response.assertStatus(200)
    assert.deepEqual(readPage(response).data, [])
    response.assertBodyContains({ meta: { total: 0, perPage: 10, currentPage: 1 } })
    assert.isNull(readPage(response).meta.nextPageUrl)
  })

  test('nieistniejący koktajl zwraca 404', async ({ client }) => {
    await cocktail.delete()

    const response = await client.get(endpoint(cocktail.id))
    response.assertStatus(404)
  })

  test('odrzuca niepoprawne ID koktajlu: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client }, { id }) => {
      const response = await client.get(endpoint(id))

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'params.cocktailId' }] })
    })

  test('domyślnie zwraca 10 najnowszych ID, a kolejna strona nie powtarza rekordów', async ({
    client,
    assert,
  }) => {
    const comments = await Comment.createMany(
      Array.from({ length: 11 }, () => ({
        cocktailId: cocktail.id,
        userId: user.id,
        rating: 4,
        content: null,
      }))
    )
    const expectedIds = comments.map((comment) => comment.id).sort((a, b) => b - a)

    const first = await client.get(endpoint(cocktail.id))
    first.assertStatus(200)
    first.assertBodyContains({ meta: { total: 11, perPage: 10, currentPage: 1, lastPage: 2 } })
    assert.deepEqual(
      readPage(first).data.map((comment) => comment.id),
      expectedIds.slice(0, 10)
    )

    const next = new URL(readPage(first).meta.nextPageUrl!, 'http://localhost')
    assert.equal(next.pathname, endpoint(cocktail.id))
    const second = await client.get(`${next.pathname}${next.search}`)

    second.assertStatus(200)
    assert.deepEqual(
      readPage(second).data.map((comment) => comment.id),
      expectedIds.slice(10)
    )
    assert.isNull(readPage(second).meta.nextPageUrl)
  })

  test('sortuje wszystkie dostępne pola w obu kierunkach: {sortBy} {sortOrder}')
    .with(
      (['id', 'rating', 'createdAt', 'updatedAt'] as const).flatMap((sortBy) =>
        (['asc', 'desc'] as const).map((sortOrder) => ({ sortBy, sortOrder }))
      )
    )
    .run(async ({ client, assert }, { sortBy, sortOrder }) => {
      const comments = await Comment.createMany(
        [3, 5, 1].map((rating) => ({
          cocktailId: cocktail.id,
          userId: user.id,
          rating,
          content: null,
        }))
      )
      // Daty mają inną kolejność niż ID i oceny, aby wykryć pomylone kolumny.
      const dates = ['2026-01-03 12:00:00', '2026-01-01 12:00:00', '2026-01-02 12:00:00']
      for (const [index, comment] of comments.entries()) {
        await db
          .from('comments')
          .where('id', comment.id)
          .update({
            created_at: dates[index],
            updated_at: dates[2 - index],
          })
      }

      const ascending = {
        id: [comments[0].id, comments[1].id, comments[2].id],
        rating: [comments[2].id, comments[0].id, comments[1].id],
        createdAt: [comments[1].id, comments[2].id, comments[0].id],
        updatedAt: [comments[1].id, comments[0].id, comments[2].id],
      }
      const expected = [...ascending[sortBy]]
      if (sortOrder === 'desc') expected.reverse()

      const response = await client.get(endpoint(cocktail.id)).qs({ sortBy, sortOrder })

      response.assertStatus(200)
      assert.deepEqual(
        readPage(response).data.map((comment) => comment.id),
        expected
      )
    })

  test('jednakowe oceny porządkuje po ID i zachowuje parametry w linkach: {sortOrder}')
    .with([{ sortOrder: 'asc' as const }, { sortOrder: 'desc' as const }])
    .run(async ({ client, assert }, { sortOrder }) => {
      const comments = await Comment.createMany(
        Array.from({ length: 3 }, () => ({
          cocktailId: cocktail.id,
          userId: user.id,
          rating: 5,
          content: null,
        }))
      )
      const expected = comments.map((comment) => comment.id).sort((a, b) => a - b)
      if (sortOrder === 'desc') expected.reverse()

      const first = await client
        .get(endpoint(cocktail.id))
        .qs({ limit: 2, sortBy: 'rating', sortOrder })
      first.assertStatus(200)
      first.assertBodyContains({ meta: { total: 3, perPage: 2, lastPage: 2 } })
      assert.deepEqual(
        readPage(first).data.map((comment) => comment.id),
        expected.slice(0, 2)
      )

      const next = new URL(readPage(first).meta.nextPageUrl!, 'http://localhost')
      assert.equal(next.pathname, endpoint(cocktail.id))
      for (const [key, value] of Object.entries({
        limit: '2',
        sortBy: 'rating',
        sortOrder,
        page: '2',
      })) {
        assert.equal(next.searchParams.get(key), value)
      }

      const second = await client.get(`${next.pathname}${next.search}`)
      second.assertStatus(200)
      assert.deepEqual(
        readPage(second).data.map((comment) => comment.id),
        expected.slice(2)
      )
      assert.isNull(readPage(second).meta.nextPageUrl)
    })

  test('strona poza zakresem zwraca pustą listę i zachowuje total', async ({ client, assert }) => {
    await Comment.create({ cocktailId: cocktail.id, userId: user.id, rating: 3, content: null })

    const response = await client.get(endpoint(cocktail.id)).qs({ page: 2, limit: 10 })

    response.assertStatus(200)
    assert.deepEqual(readPage(response).data, [])
    response.assertBodyContains({ meta: { total: 1, currentPage: 2, perPage: 10 } })
  })

  test('odrzuca błędne parametry listy: {field}={value}')
    .with([
      { field: 'page', value: 'abc' },
      { field: 'page', value: '0' },
      { field: 'page', value: '-1' },
      { field: 'page', value: '1.5' },
      { field: 'limit', value: 'abc' },
      { field: 'limit', value: '0' },
      { field: 'limit', value: '-1' },
      { field: 'limit', value: '1.5' },
      { field: 'limit', value: '101' },
      { field: 'sortBy', value: 'password_hash' },
      { field: 'sortOrder', value: 'wrong' },
    ])
    .run(async ({ client }, { field, value }) => {
      const response = await client.get(endpoint(cocktail.id)).qs({ [field]: value })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })
    })
})
