import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import Cocktail from '#models/cocktail'
import User from '#models/user'
import { createUser } from '#tests/helpers/user'

// Testujemy obecny publiczny adres API, bez zależności od nazw parametrów kontrolera.
const endpoint = (cocktailId: number | string) => `/cocktails/${cocktailId}/comment`

async function snapshot(cocktailId: number) {
  return {
    cocktail: await db.from('cocktails').where('id', cocktailId).first(),
    comments: await db.from('comments').orderBy('id'),
  }
}

test.group('Comments | dodawanie przez API', (group) => {
  let author: User
  let cocktail: Cocktail
  let token: string

  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  group.each.setup(async () => {
    const owner = await createUser()
    author = await createUser()
    cocktail = await Cocktail.create({ name: 'Mojito', userId: owner.id })
    const accessToken = await User.accessTokens.create(author)
    token = accessToken.value!.release()
  })

  test('zalogowany użytkownik ocenia cudzy przepis i otrzymuje zapisany komentarz', async ({
    client,
    assert,
  }) => {
    const response = await client.post(endpoint(cocktail.id)).bearerToken(token).unsafeJson({
      rating: 5,
      content: '  Bardzo dobry przepis.  ',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      cocktailId: cocktail.id,
      userId: author.id,
      rating: 5,
      content: 'Bardzo dobry przepis.',
    })
    const body = response.body() as { id: number }
    assert.isNumber(body.id)
    const records = await db.from('comments').where('cocktail_id', cocktail.id)
    assert.lengthOf(records, 1)
    assert.equal(records[0].id, body.id)
    assert.equal(records[0].user_id, author.id)
    assert.equal(records[0].rating, 5)
    assert.equal(records[0].content, 'Bardzo dobry przepis.')
    await cocktail.refresh()
    assert.equal(cocktail.rating, 5)
  })

  test('akceptuje graniczne oceny i opcjonalną treść: {label}')
    .with([
      { label: 'ocena 1 bez treści', payload: { rating: 1 }, expectedContent: null },
      { label: 'ocena 5 i null', payload: { rating: 5, content: null }, expectedContent: null },
      {
        label: '500 znaków treści',
        payload: { rating: 3, content: 'A'.repeat(500) },
        expectedContent: 'A'.repeat(500),
      },
    ])
    .run(async ({ client, assert }, { payload, expectedContent }) => {
      const response = await client
        .post(endpoint(cocktail.id))
        .bearerToken(token)
        .unsafeJson(payload)

      response.assertStatus(201)
      const records = await db.from('comments').where('cocktail_id', cocktail.id)
      assert.lengthOf(records, 1)
      assert.equal(records[0].rating, payload.rating)
      assert.strictEqual(records[0].content, expectedContent)
      await cocktail.refresh()
      assert.equal(cocktail.rating, payload.rating)
    })

  test('autor pochodzi z tokena, a przepis ze ścieżki mimo podmienionych pól w body', async ({
    client,
    assert,
  }) => {
    const other = await Cocktail.create({ name: 'Inny koktajl', userId: author.id })
    const beforeOther = await snapshot(other.id)

    const response = await client
      .post(endpoint(cocktail.id))
      .bearerToken(token)
      .unsafeJson({
        rating: 4,
        content: 'Recenzja',
        userId: cocktail.userId,
        user_id: cocktail.userId,
        cocktailId: other.id,
        cocktail_id: other.id,
        params: { cocktailId: other.id, id: other.id },
      })

    response.assertStatus(201)
    const records = await db.from('comments').where('cocktail_id', cocktail.id)
    assert.lengthOf(records, 1)
    assert.equal(records[0].user_id, author.id)
    assert.equal(records[0].rating, 4)
    assert.lengthOf(await db.from('comments').where('cocktail_id', other.id), 0)
    assert.deepEqual(await db.from('cocktails').where('id', other.id).first(), beforeOther.cocktail)
  })

  test('administrator również może wystawić ocenę', async ({ client, assert }) => {
    const admin = await createUser('admin')
    const accessToken = await User.accessTokens.create(admin)

    const response = await client
      .post(endpoint(cocktail.id))
      .bearerToken(accessToken.value!.release())
      .unsafeJson({ rating: 4 })

    response.assertStatus(201)
    const records = await db.from('comments').where('cocktail_id', cocktail.id)
    assert.lengthOf(records, 1)
    assert.equal(records[0].user_id, admin.id)
  })

  test('odrzuca niepoprawne dane bez zmiany bazy: {label}')
    .with([
      { label: 'brak oceny', payload: {}, field: 'rating' },
      { label: 'ocena null', payload: { rating: null }, field: 'rating' },
      { label: 'ocena 0', payload: { rating: 0 }, field: 'rating' },
      { label: 'ocena 6', payload: { rating: 6 }, field: 'rating' },
      { label: 'ocena ujemna', payload: { rating: -1 }, field: 'rating' },
      { label: 'ocena ułamkowa', payload: { rating: 2.5 }, field: 'rating' },
      { label: 'ocena tekstowa', payload: { rating: 'abc' }, field: 'rating' },
      { label: 'ocena logiczna', payload: { rating: true }, field: 'rating' },
      { label: 'ocena jako tablica', payload: { rating: [5] }, field: 'rating' },
      { label: 'ocena jako obiekt', payload: { rating: {} }, field: 'rating' },
      {
        label: 'treść dłuższa niż 500 znaków',
        payload: { rating: 4, content: 'A'.repeat(501) },
        field: 'content',
      },
      { label: 'same spacje', payload: { rating: 4, content: '   ' }, field: 'content' },
      { label: 'pusta treść', payload: { rating: 4, content: '' }, field: 'content' },
      { label: 'treść jako liczba', payload: { rating: 4, content: 123 }, field: 'content' },
      { label: 'treść jako obiekt', payload: { rating: 4, content: {} }, field: 'content' },
    ])
    .run(async ({ client, assert }, { payload, field }) => {
      const before = await snapshot(cocktail.id)
      const response = await client
        .post(endpoint(cocktail.id))
        .bearerToken(token)
        .unsafeJson(payload)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field }] })
      assert.deepEqual(await snapshot(cocktail.id), before)
    })

  test('odrzuca niepoprawne ID koktajlu: {id}')
    .with([{ id: 'abc' }, { id: '0' }, { id: '-1' }, { id: '1.5' }])
    .run(async ({ client, assert }, { id }) => {
      const before = await snapshot(cocktail.id)
      const response = await client.post(endpoint(id)).bearerToken(token).unsafeJson({ rating: 5 })

      response.assertStatus(422)
      const body = response.body() as { errors: { rule: string }[] }
      // Sam status 422 nie wystarczy: brak parametru w źle zdefiniowanej trasie
      // również daje 422, ale nie oznacza poprawnej walidacji przesłanego ID.
      assert.isTrue(body.errors.some((error) => error.rule !== 'required'))
      assert.deepEqual(await snapshot(cocktail.id), before)
    })

  test('zwraca 404 dla nieistniejącego przepisu bez zmiany bazy', async ({ client, assert }) => {
    const removed = await Cocktail.create({ name: 'Usunięty', userId: author.id })
    await removed.delete()
    const before = await snapshot(cocktail.id)

    const response = await client
      .post(endpoint(removed.id))
      .bearerToken(token)
      .unsafeJson({ rating: 5 })

    response.assertStatus(404)
    assert.deepEqual(await snapshot(cocktail.id), before)
  })

  test('brak poprawnego tokena blokuje zapis przed walidacją i nie zmienia średniej: {kind}')
    .with([
      { kind: 'brak tokena' },
      { kind: 'niepoprawny token' },
      { kind: 'wygasły token' },
      { kind: 'unieważniony token' },
      { kind: 'token tylko w query string' },
    ])
    .run(async ({ client, assert }, { kind }) => {
      // Istniejąca ocena pozwala wykryć również przypadkowe wyzerowanie średniej.
      await db.table('comments').insert({
        cocktail_id: cocktail.id,
        user_id: author.id,
        rating: 4,
        content: null,
      })
      cocktail.rating = 4
      await cocktail.save()
      const before = await snapshot(cocktail.id)

      let bearer: string | undefined
      if (kind === 'niepoprawny token') bearer = 'nieprawidlowy-token'
      if (kind === 'wygasły token') {
        const expired = await User.accessTokens.create(author, ['*'], { expiresIn: -60 })
        bearer = expired.value!.release()
      }
      if (kind === 'unieważniony token') {
        const logout = await client.post('/auth/logout').bearerToken(token)
        logout.assertStatus(204)
        bearer = token
      }

      for (const payload of [{ rating: 5 }, { rating: 0 }]) {
        const request = client.post(endpoint(cocktail.id)).unsafeJson(payload)
        if (bearer) request.bearerToken(bearer)
        if (kind === 'token tylko w query string') {
          request.qs({ token, access_token: token })
        }

        const response = await request
        response.assertStatus(401)
        assert.deepEqual(await snapshot(cocktail.id), before)
      }
    })
})
