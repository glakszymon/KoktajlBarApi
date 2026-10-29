import { randomUUID } from 'node:crypto'

import User from '#models/user'

export const testPassword = 'bezpieczne-haslo-123'

export function createUser(role: 'user' | 'admin' = 'user') {
  return User.create({
    name: 'Użytkownik testowy',
    email: `${randomUUID()}@example.com`,
    passwordHash: testPassword,
    role,
  })
}
