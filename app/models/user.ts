import { UserSchema } from '#database/schema'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { column, hasMany } from '@adonisjs/lucid/orm'
import Cocktail from '#models/cocktail'
import * as relations from '@adonisjs/lucid/types/relations'
import Comment from '#models/comment'

const AuthFinder = withAuthFinder(hash, {
  uids: ['email'],
  passwordColumnName: 'passwordHash',
})

export default class User extends compose(UserSchema, AuthFinder) {
  @column({ serializeAs: null })
  declare passwordHash: string

  @hasMany(() => Cocktail)
  declare cocktails: relations.HasMany<typeof Cocktail>

  @hasMany(() => Comment)
  declare comments: relations.HasMany<typeof Comment>

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '24 hours',
  })
}
