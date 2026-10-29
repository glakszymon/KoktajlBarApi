import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('cocktail_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('cocktails')
        .onDelete('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')

      table.integer('rating').notNullable()
      table.text('content').nullable()

      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()

      table.check('rating BETWEEN 1 AND 5')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
