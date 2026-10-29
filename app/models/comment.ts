import { CommentSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Cocktail from '#models/cocktail'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class Comment extends CommentSchema {
  @column({ isPrimary: true, columnName: 'id' })
  declare id: number

  @column({ columnName: 'cocktail_id' })
  declare cocktailId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'rating' })
  declare rating: number

  @column({ columnName: 'content' })
  declare content: string | null

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare created: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updated: DateTime

  @belongsTo(() => Cocktail)
  declare cocktail: BelongsTo<typeof Cocktail>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
