// import type { HttpContext } from '@adonisjs/core/http'

import IngredientService from '../service/ingredients_service.js'
import { type HttpContext } from '@adonisjs/core/http'
import {
  addIngredientValidator,
  ingredientIdValidator,
  updateIngredientValidator,
} from '#validators/ingredient'

export default class IngredientsController {
  async readAllIngredients({ response }: HttpContext) {
    const service = new IngredientService()
    const ingredients = await service.getAll()
    return response.ok(ingredients)
  }

  async getIngredientById({ params, response }: HttpContext) {
    const data = await ingredientIdValidator.validate(params)
    const service = new IngredientService()
    const ingredient = await service.getById(data.id)
    return response.ok(ingredient)
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

  async deleteIngredient({ params, response }: HttpContext) {
    const data = await ingredientIdValidator.validate(params)

    const service = new IngredientService()
    await service.deleteRecord(data.id)

    return response.created(data)
  }

  async updateIngredient({ params, request, response }: HttpContext) {
    const identification = await ingredientIdValidator.validate(params)
    const data = await request.validateUsing(updateIngredientValidator)

    const service = new IngredientService()
    service.updateRecord(identification.id, data)

    return response.created(data)
  }
}
