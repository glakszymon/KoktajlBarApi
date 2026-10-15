// import type { HttpContext } from '@adonisjs/core/http'

import Cocktail from '#models/cocktail'

export default class IngredientsController {
  async readAllIngredients() {
    const cocktails = await Cocktail.all()
    return cocktails
  }
}
