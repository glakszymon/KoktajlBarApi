import Factory from '@adonisjs/lucid/factories'

import Ingredient from '#models/ingredient'

export const IngredientFactory = Factory.define(Ingredient, ({ faker }) => {
  return {
    name: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    alcohol: faker.datatype.boolean(),
    photoUrl: faker.image.url(),
  }
}).build()
