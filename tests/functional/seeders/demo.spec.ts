import DemoSeeder from '#database/seeders/demo_seeder'
import Cocktail from '#models/cocktail'
import Comment from '#models/comment'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Demo seeder', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('tworzy kompletne demo i nie powiela danych przy kolejnym uruchomieniu', async ({
    assert,
    client,
  }) => {
    const seeder = new DemoSeeder(db.connection())
    await seeder.run()

    const admin = await User.verifyCredentials('admin@example.com', 'Demo-password-12345!')
    const user = await User.verifyCredentials('user@example.com', 'Demo-password-12345!')
    assert.equal(admin.role, 'admin')
    assert.equal(user.role, 'user')
    assert.notEqual(admin.passwordHash, 'Demo-password-12345!')
    assert.notEqual(user.passwordHash, 'Demo-password-12345!')
    assert.lengthOf(await User.all(), 2)

    const cocktails = await Cocktail.query().preload('ingredients').preload('comments')
    assert.lengthOf(cocktails, 18)
    assert.sameMembers(
      [...new Set(cocktails.map((cocktail) => cocktail.userId))],
      [admin.id, user.id]
    )
    assert.lengthOf(await Comment.all(), 10)
    assert.sameMembers(
      [
        ...new Set(
          cocktails.flatMap((cocktail) => cocktail.comments.map((comment) => comment.userId))
        ),
      ],
      [admin.id, user.id]
    )

    for (const cocktail of cocktails) {
      assert.isAbove(cocktail.ingredients.length, 0)
      for (const ingredient of cocktail.ingredients) {
        assert.isAbove(ingredient.$extras.pivot_amount, 0)
        assert.isString(ingredient.$extras.pivot_unit)
        assert.isNotEmpty(ingredient.$extras.pivot_unit)
      }

      const expected = cocktail.comments.length
        ? cocktail.comments.reduce((sum, comment) => sum + comment.rating, 0) /
          cocktail.comments.length
        : null
      assert.equal(cocktail.rating, expected)
    }

    const ingredientsPage = await client.get('/ingredients?page=2')
    ingredientsPage.assertStatus(200)
    assert.equal(ingredientsPage.body().meta.total, 20)
    assert.equal(ingredientsPage.body().meta.lastPage, 2)
    assert.lengthOf(ingredientsPage.body().data, 10)

    const cocktailsPage = await client.get('/cocktails?page=2')
    cocktailsPage.assertStatus(200)
    assert.equal(cocktailsPage.body().meta.total, 18)
    assert.equal(cocktailsPage.body().meta.lastPage, 2)
    assert.lengthOf(cocktailsPage.body().data, 8)

    const nonAlcoholic = await client.get('/cocktails?alcohol=false')
    nonAlcoholic.assertStatus(200)
    assert.sameMembers(
      nonAlcoholic.body().data.map((cocktail: { name: string }) => cocktail.name),
      ['Virgin Mojito', 'Virgin Piña Colada']
    )
    const unrated = nonAlcoholic
      .body()
      .data.find((cocktail: { name: string }) => cocktail.name === 'Virgin Piña Colada')
    assert.isNull(unrated.rating)

    const mojito = await Cocktail.findByOrFail('name', 'Mojito')
    assert.equal(mojito.rating, 4.5)
    await Comment.create({
      cocktailId: mojito.id,
      userId: user.id,
      rating: 2,
      content: 'Nowa ocena',
    })

    const tables = ['users', 'ingredients', 'cocktails', 'cocktail_ingredients', 'comments']
    const before = await Promise.all(tables.map((table) => db.from(table).orderBy('id')))
    await seeder.run()
    const after = await Promise.all(tables.map((table) => db.from(table).orderBy('id')))
    assert.deepEqual(
      after.map((rows) => rows.map((row) => row.id)),
      before.map((rows) => rows.map((row) => row.id))
    )

    await mojito.refresh()
    assert.closeTo(mojito.rating!, 11 / 3, 0.0001)
    const accounts = await User.query().orderBy('id')
    assert.deepEqual(
      accounts.map((account) => ({ email: account.email, passwordHash: account.passwordHash })),
      [admin, user].map((account) => ({ email: account.email, passwordHash: account.passwordHash }))
    )
  })
})
