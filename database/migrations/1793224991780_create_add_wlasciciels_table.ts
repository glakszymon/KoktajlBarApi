import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasUserId = await this.schema.hasColumn('cocktails', 'user_id')

    if (!hasUserId) {
      this.schema.alterTable('cocktails', (table) => {
        table.integer('user_id').unsigned().notNullable()
      })
    }

    this.schema.alterTable('cocktails', (table) => {
      table
        .foreign('user_id', 'cocktails_user_id_foreign')
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.alterTable('cocktails', (table) => {
      table.dropForeign(['user_id'], 'cocktails_user_id_foreign')
      table.dropColumn('user_id')
    })
  }
}
