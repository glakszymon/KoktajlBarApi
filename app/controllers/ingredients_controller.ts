// import type { HttpContext } from '@adonisjs/core/http'

import IngredientService from '../services/ingredients_service.js'
import { type HttpContext } from '@adonisjs/core/http'
import {
  addIngredientValidator,
  ingredientIdValidator,
  updateIngredientValidator,
} from '#validators/ingredient'
import { paginationValidator } from '#validators/pagination'

export default class IngredientsController {
  async readAllIngredients({ request, response }: HttpContext) {
    const qs = request.qs()

    const rawData = {
      page: qs.page !== undefined ? Number(qs.page) : undefined,
      limit: qs.limit !== undefined ? Number(qs.limit) : undefined,
      alcohol: qs.alcohol === undefined ? undefined : qs.alcohol,
      sortBy: qs.sortBy === undefined ? undefined : qs.sortBy,
      sortOrder: qs.sortOrder === undefined ? undefined : qs.sortOrder,
    }

    const validatedData = await paginationValidator.validate(rawData)

    const service = new IngredientService()

    const ingredients = await service.getAll({
      page: validatedData.page,
      limit: validatedData.limit,
      alcohol: validatedData.alcohol,
      sortBy: qs.sortBy === undefined ? undefined : qs.sortBy,
      sortOrder: qs.sortOrder === undefined ? undefined : qs.sortOrder,
    })

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
      photoUrl: data.photoUrl,
    })

    return response.created(ingredient)
  }

  async deleteIngredient({ params, response }: HttpContext) {
    const data = await ingredientIdValidator.validate(params)

    const service = new IngredientService()
    await service.deleteRecord(data.id)

    return response.ok(data)
  }

  async updateIngredient({ params, request, response }: HttpContext) {
    const identification = await ingredientIdValidator.validate(params)
    const data = await request.validateUsing(updateIngredientValidator)

    const service = new IngredientService()
    await service.updateRecord(identification.id, data)

    return response.ok(data)
  }
}
