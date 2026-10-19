// import type { HttpContext } from '@adonisjs/core/http'

import Ingredient from '#models/ingredient'
import IngredientService from '../service/ingredients_service.js'
import { HttpContext } from '@adonisjs/core/http'
import { addIngredientValidator, ingredientIdValidator } from '#validators/ingredient'

export default class IngredientsController {
  async readAllIngredients() {
    const ingredients = await Ingredient.all()
    return ingredients
  }

  async getIngredientById(id: number) {
    const ingredient = await Ingredient.findOrFail(id)
    return ingredient
  }

  async addIngredient({ request, response }: HttpContext) {
    const data = await request.validateUsing(addIngredientValidator)

    const service = new IngredientService()

    const ingredient = await service.addRecord({
      name: data.name,
      description: data.description,
      alcohol: data.alcohol,
    })

    return response.created(ingredient)
  }

  async deleteIngredient({ request, response }: HttpContext) {
    const data = await request.validateUsing(ingredientIdValidator)

    const service = new IngredientService()
    await service.deleteRecord(data.id)

    return response.created(data)
  }
}
