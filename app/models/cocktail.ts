import { CocktailSchema } from '#database/schema'
import { belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Ingredient from '#models/ingredient'
import User from '#models/user'

export default class Cocktail extends CocktailSchema {
  @column({ isPrimary: true, columnName: 'id' })
  declare id: number

  @column({ columnName: 'name' })
  declare name: string

  @column({ columnName: 'category' })
  declare category: string | null

  @column({ columnName: 'recipe' })
  declare recipe: string | null

  @column({ columnName: 'user_id' })
  declare userId: number

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare created: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updated: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Ingredient, {
    pivotTable: 'cocktail_ingredients',
    pivotForeignKey: 'cocktail_id',
    pivotRelatedForeignKey: 'ingredient_id',
    pivotColumns: ['amount', 'unit'],
    pivotTimestamps: true,
  })
  declare ingredients: ManyToMany<typeof Ingredient>
}
