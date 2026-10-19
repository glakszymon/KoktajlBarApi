import { CocktailIngredientSchema } from '#database/schema'
import { column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class CocktailIngredient extends CocktailIngredientSchema {
  @column({ isPrimary: true, columnName: 'id' })
  declare id: number

  @column({ columnName: 'amount' })
  declare amount: number | null

  @column({ columnName: 'unit' })
  declare unit: string | null

  @column({ columnName: 'ingredient_id' })
  declare ingredientId: number | null

  @column({ columnName: 'cocktail_id' })
  declare cocktailId: number

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare created: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updated: DateTime
}
