import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('comments', (table) => {
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable('comments', (table) => {
      table.dropColumn('created_at')
      table.dropColumn('updated_at')
    })
  }
}
