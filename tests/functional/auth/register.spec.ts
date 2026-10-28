import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

const validPayload = {
  name: 'Mateusz',
  email: 'mateusz@example.com',
  password: 'bezpieczne-haslo-123',
  password_confirmation: 'bezpieczne-haslo-123',
}

async function countUsers() {
  const rows = await User.query().count('* as total')
  return Number(rows[0].$extras.total)
}

test.group('Auth | rejestracja', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('rejestruje użytkownika: {label}')
    .with([
      { label: 'poprawne dane', changes: {} },
      {
        label: 'normalizuje nazwę i email',
        changes: { name: '  Mateusz  ', email: '  MATEUSZ@EXAMPLE.COM  ' },
      },
      {
        label: 'hasło ma dokładnie 15 znaków',
        changes: { password: 'A'.repeat(15), password_confirmation: 'A'.repeat(15) },
      },
    ])
    .run(async ({ client, assert }, row) => {
      const before = await countUsers()
      const payload = { ...validPayload, ...row.changes }
      const response = await client.post('/auth/register').json(payload)

      response.assertStatus(201)

      const user = await User.findByOrFail('email', validPayload.email)
      response.assertBody({
        user: { id: user.id, name: validPayload.name, email: validPayload.email },
      })

      assert.equal(user.name, validPayload.name)
      assert.equal(user.role, 'user')
      assert.notEqual(user.passwordHash, payload.password)
      assert.isTrue(await user.verifyPassword(payload.password))
      assert.equal(await countUsers(), before + 1)
    })

  test('odrzuca brak pola: {label}')
    .with([
      { label: 'name', missing: ['name'], fields: ['name'] },
      { label: 'email', missing: ['email'], fields: ['email'] },
      { label: 'password', missing: ['password'], fields: ['password'] },
      {
        label: 'password_confirmation',
        missing: ['password_confirmation'],
        fields: ['password_confirmation'],
      },
      {
        label: 'wszystkie pola',
        missing: ['name', 'email', 'password', 'password_confirmation'],
        fields: ['name', 'email', 'password'],
      },
    ])
    .run(async ({ client, assert }, row) => {
      const before = await countUsers()
      const payload: Record<string, string> = { ...validPayload }

      for (const field of row.missing) {
        delete payload[field]
      }

      // Celowo pomijamy wymagane pola kontraktu, aby sprawdzić walidację HTTP.
      const response = await client.post('/auth/register').unsafeJson(payload)

      response.assertStatus(422)
      for (const field of row.fields) {
        response.assertBodyContains({ errors: [{ field }] })
      }
      assert.equal(await countUsers(), before)
    })

  test('odrzuca niepoprawne dane: {label}')
    .with([
      { label: 'pusta nazwa', changes: { name: '' }, field: 'name' },
      { label: 'nazwa z samych spacji', changes: { name: '   ' }, field: 'name' },
      { label: 'email nie jest adresem', changes: { email: 'nie-jest-mailem' }, field: 'email' },
      { label: 'email bez domeny', changes: { email: 'jan@' }, field: 'email' },
      { label: 'email bez części lokalnej', changes: { email: '@example.com' }, field: 'email' },
      { label: 'pusty email', changes: { email: '' }, field: 'email' },
      {
        label: 'puste hasło',
        changes: { password: '', password_confirmation: '' },
        field: 'password',
      },
      {
        label: 'za krótkie hasło',
        changes: { password: 'haslo-1234#', password_confirmation: 'haslo-1234#' },
        field: 'password',
      },
      {
        label: 'hasło ma 14 znaków',
        changes: { password: 'A'.repeat(14), password_confirmation: 'A'.repeat(14) },
        field: 'password',
      },
      {
        label: 'potwierdzenie różni się od hasła',
        changes: { password_confirmation: 'inne-bezpieczne-haslo-123' },
        field: 'password_confirmation',
      },
      {
        label: 'puste potwierdzenie hasła',
        changes: { password_confirmation: '' },
        field: 'password_confirmation',
      },
    ])
    .run(async ({ client, assert }, row) => {
      const before = await countUsers()
      const response = await client.post('/auth/register').json({
        ...validPayload,
        ...row.changes,
      })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: row.field }] })
      assert.equal(await countUsers(), before)
    })

  test('nie pozwala nadać sobie roli admin podczas rejestracji', async ({ client, assert }) => {
    const response = await client
      .post('/auth/register')
      .unsafeJson({ ...validPayload, role: 'admin' })
    response.assertStatus(201)
    const user = await User.findByOrFail('email', validPayload.email)
    assert.equal(user.role, 'user')
  })

  test('odrzuca powtórzony email: {label}')
    .with([
      { label: 'identyczny', email: validPayload.email },
      { label: 'inna wielkość liter', email: 'MATEUSZ@EXAMPLE.COM' },
      { label: 'spacje na brzegach', email: '  mateusz@example.com  ' },
    ])
    .run(async ({ client, assert }, row) => {
      const original = await User.create({
        name: validPayload.name,
        email: validPayload.email,
        passwordHash: validPayload.password,
      })
      const originalHash = original.passwordHash
      const before = await countUsers()
      const payload = {
        ...validPayload,
        name: 'Inny użytkownik',
        email: row.email,
        password: 'inne-bezpieczne-haslo-123',
        password_confirmation: 'inne-bezpieczne-haslo-123',
      }

      const response = await client.post('/auth/register').json(payload)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'email' }] })
      assert.equal(await countUsers(), before)

      await original.refresh()
      assert.equal(original.name, validPayload.name)
      assert.equal(original.email, validPayload.email)
      assert.equal(original.passwordHash, originalHash)
    })
})
