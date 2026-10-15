import { CocktailSchema } from '#database/schema'
import { column, manyToMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Ingredient from '#models/ingredient'
// import CocktailIngredient from '#models/cocktail_ingredient'
// import { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Cocktail extends CocktailSchema {
  @column({ isPrimary: true, columnName: 'id' })
  declare id: number

  @column({ columnName: 'name' })
  declare name: string

  @column({ columnName: 'category' })
  declare category: string | null

  @column({ columnName: 'recipe' })
  declare recipe: string | null

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare created: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updated: DateTime

  @manyToMany(() => Ingredient, {
    pivotTable: 'cocktail_ingredients',
    pivotForeignKey: 'cocktail_id',
    pivotRelatedForeignKey: 'ingredient_id',
    pivotColumns: ['amount', 'unit'],
  })
  declare ingredients: ManyToMany<typeof Ingredient>
}
