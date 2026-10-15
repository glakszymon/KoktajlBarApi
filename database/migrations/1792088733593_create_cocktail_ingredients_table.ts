import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cocktail_ingredients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('ingredient_id').unsigned().references('ingredients.id')
      table.integer('cocktail_id').unsigned().references('cocktails.id').notNullable()

      table.integer('amount')
      table.string('unit', 100)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
