import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import Cocktail from '#models/cocktail'
import CommentsService from '#services/comments_service'
import { createUser } from '#tests/helpers/user'

// Testy integracyjne niezależne od routingu i kontrolera. Korzystają z prawdziwej bazy.
test.group('Comments | integracja serwisu z bazą', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('zapisuje komentarz i przelicza średnią z istniejących ocen', async ({ assert }) => {
    const owner = await createUser()
    const author = await createUser()
    const cocktail = await Cocktail.create({ name: 'Mojito', userId: owner.id, rating: 2 })
    // Fixture SQL nie korzysta z modelu Comment, którego mapowanie również weryfikujemy.
    await db.table('comments').insert({
      cocktail_id: cocktail.id,
      user_id: owner.id,
      rating: 2,
      content: null,
    })

    const service = new CommentsService()
    const comment = await service.addRecord(author.id, {
      cocktailId: cocktail.id,
      rating: 5,
      content: 'Dobry przepis.',
    })

    const saved = await db.from('comments').where('id', comment.id).first()
    assert.equal(saved.cocktail_id, cocktail.id)
    assert.equal(saved.user_id, author.id)
    assert.equal(saved.rating, 5)
    assert.equal(saved.content, 'Dobry przepis.')
    await cocktail.refresh()
    assert.equal(cocktail.rating, 3.5)
  })

  test('nieistniejący koktajl powoduje błąd bez zapisu komentarza', async ({ assert }) => {
    const author = await createUser()
    const cocktail = await Cocktail.create({ name: 'Usunięty', userId: author.id })
    await cocktail.delete()
    const before = await db.from('comments').orderBy('id')
    const service = new CommentsService()

    await assert.rejects(() =>
      service.addRecord(author.id, { cocktailId: cocktail.id, rating: 5, content: null })
    )

    assert.deepEqual(await db.from('comments').orderBy('id'), before)
  })
})
