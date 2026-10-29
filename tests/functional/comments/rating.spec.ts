import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import Cocktail from '#models/cocktail'
import User from '#models/user'
import { createUser } from '#tests/helpers/user'

const ratingPrecision = 4

test.group('Comments | średnia ocen przez API', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('zapisuje średnią wszystkich ocen tylko danego przepisu i udostępnia ją publicznie', async ({
    client,
    assert,
  }) => {
    const owner = await createUser()
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: owner.id })
    const other = await Cocktail.create({ name: 'Inny', userId: owner.id, rating: 2 })
    await db.table('comments').insert({
      cocktail_id: other.id,
      user_id: owner.id,
      rating: 2,
      content: null,
    })
    const otherBefore = await db.from('cocktails').where('id', other.id).first()

    await cocktail.refresh()
    assert.isNull(cocktail.rating)

    // Różni autorzy: test nie narzuca możliwości wielokrotnej oceny przez jedną osobę.
    const ratings = [5, 4, 1]
    for (const [index, rating] of ratings.entries()) {
      const author = await createUser()
      const token = await User.accessTokens.create(author)
      const response = await client
        .post(`/cocktails/${cocktail.id}/comment`)
        .bearerToken(token.value!.release())
        .unsafeJson({ rating })

      response.assertStatus(201)
      const count = index + 1
      const expected = ratings.slice(0, count).reduce((sum, value) => sum + value, 0) / count
      await cocktail.refresh()
      assert.isNotNull(cocktail.rating)
      assert.equal(cocktail.rating!.toFixed(ratingPrecision), expected.toFixed(ratingPrecision))
      assert.lengthOf(await db.from('comments').where('cocktail_id', cocktail.id), count)
      assert.deepEqual(await db.from('cocktails').where('id', other.id).first(), otherBefore)

      const details = await client.get(`/cocktails/${cocktail.id}`)
      details.assertStatus(200)
      const body = details.body() as { rating: number }
      assert.isNumber(body.rating)
      assert.equal(body.rating.toFixed(ratingPrecision), expected.toFixed(ratingPrecision))
    }

    const before = await db.from('comments').where('cocktail_id', cocktail.id).orderBy('id')
    const invalidAuthor = await createUser()
    const token = await User.accessTokens.create(invalidAuthor)
    const invalid = await client
      .post(`/cocktails/${cocktail.id}/comment`)
      .bearerToken(token.value!.release())
      .unsafeJson({ rating: 6 })

    invalid.assertStatus(422)
    assert.deepEqual(
      await db.from('comments').where('cocktail_id', cocktail.id).orderBy('id'),
      before
    )
    await cocktail.refresh()
    assert.equal(cocktail.rating!.toFixed(ratingPrecision), (10 / 3).toFixed(ratingPrecision))
  })
})
