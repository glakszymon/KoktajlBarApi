import { IngredientSchema } from '#database/schema'
import { column, computed, manyToMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Cocktail from '#models/cocktail'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Ingredient extends IngredientSchema {
  @column({ isPrimary: true, columnName: 'id' })
  declare id: number

  @column({ columnName: 'name' })
  declare name: string

  @column({ columnName: 'description' })
  declare description: string | null

  @column({ columnName: 'alcohol' })
  declare alcohol: boolean

  @column({ columnName: 'photo_url' })
  declare photoUrl: string | null

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare created: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updated: DateTime

  @manyToMany(() => Cocktail, {
    pivotTable: 'cocktail_ingredients',
    pivotForeignKey: 'ingredient_id',
    pivotRelatedForeignKey: 'cocktail_id',
    pivotColumns: ['amount', 'unit'],
  })
  declare cocktails: ManyToMany<typeof Cocktail>

  @computed()
  get amount(): number | undefined {
    return this.$extras.pivot_amount
  }

  @computed()
  get unit(): string | undefined {
    return this.$extras.pivot_unit
  }
}
