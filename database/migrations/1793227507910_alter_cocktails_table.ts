import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('cocktails', (table) => {
      table.double('rating').nullable()
    })
  }

  async down() {
    this.schema.alterTable('cocktails', (table) => {
      table.dropColumn('rating')
    })
  }
}
