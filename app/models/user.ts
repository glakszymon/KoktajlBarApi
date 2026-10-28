import { UserSchema } from '#database/schema'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { column } from '@adonisjs/lucid/orm'

const AuthFinder = withAuthFinder(hash, {
  uids: ['email'],
  passwordColumnName: 'passwordHash',
})

export default class User extends compose(UserSchema, AuthFinder) {
  @column({ serializeAs: null })
  declare passwordHash: string

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '24 hours',
  })
}
