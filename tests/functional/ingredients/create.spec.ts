import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Ingredient from '#models/ingredient'

test.group('Ingredients | tworzenie', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('zapisuje poprawną nazwę: {label}')
    .with([
      { label: 'zwykła nazwa', name: 'Mięta', expectedName: 'Mięta' },
      { label: 'minimum znaków', name: 'AB', expectedName: 'AB' },
      { label: 'maksimum znaków', name: 'A'.repeat(100), expectedName: 'A'.repeat(100) },
      { label: 'spacje na brzegach', name: '  Mięta  ', expectedName: 'Mięta' },
    ])
    .run(async ({ client, assert }, row) => {
      const payload = {
        name: row.name,
        description: 'Świeże liście mięty',
        alcohol: false,
        photoUrl: 'https://example.com/mint.jpg',
      }

      const response = await client.post('/ingredients').json(payload)

      response.assertStatus(201)
      response.assertBodyContains({ ...payload, name: row.expectedName })

      const body = response.body()
      if (!('id' in body)) throw new Error('Brak id utworzonego składnika')

      const ingredient = await Ingredient.findOrFail(body.id)
      assert.equal(ingredient.name, row.expectedName)
      assert.equal(ingredient.description, payload.description)
      assert.equal(ingredient.photoUrl, payload.photoUrl)

      const readResponse = await client.get(`/ingredients/${ingredient.id}`)
      readResponse.assertStatus(200)
      readResponse.assertBodyContains({
        id: ingredient.id,
        name: row.expectedName,
        description: payload.description,
        photoUrl: payload.photoUrl,
      })
    })

  test('odrzuca niepoprawne dane: {label}')
    .with([
      { label: 'brak nazwy', changes: { name: undefined }, field: 'name' },
      { label: 'jeden znak', changes: { name: 'X' }, field: 'name' },
      { label: 'same spacje', changes: { name: '   ' }, field: 'name' },
      { label: 'za długa nazwa', changes: { name: 'A'.repeat(101) }, field: 'name' },
      { label: 'za długi opis', changes: { description: 'A'.repeat(501) }, field: 'description' },
      { label: 'niepoprawny URL', changes: { photoUrl: 'nie-jest-adresem' }, field: 'photoUrl' },
      { label: 'niepoprawna flaga', changes: { alcohol: 'wrong' }, field: 'alcohol' },
    ])
    .run(async ({ client, assert }, row) => {
      const before = await Ingredient.query().count('* as total')
      const response = await client.post('/ingredients').json({
        name: 'Mięta',
        description: 'Świeże liście mięty',
        alcohol: false,
        photoUrl: 'https://example.com/mint.jpg',
        ...row.changes,
      })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: row.field }] })

      const after = await Ingredient.query().count('* as total')
      assert.equal(Number(after[0].$extras.total), Number(before[0].$extras.total))
    })
})
