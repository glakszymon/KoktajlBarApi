// import type { HttpContext } from '@adonisjs/core/http'

import Ingredient from '#models/ingredient'

export default class IngredientsController {
  async readAllIngredients() {
    let ingredients = await Ingredient.all()
    return ingredients
  }

  async getIngredientById(id: number) {
    const ingredient = await Ingredient.findOrFail(id)
    return ingredient
  }
}
