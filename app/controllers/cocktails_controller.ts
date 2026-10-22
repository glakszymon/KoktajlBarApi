// import type { HttpContext } from '@adonisjs/core/http'

import CocktailsService from '../services/cocktails_service.js'
import { type HttpContext } from '@adonisjs/core/http'

import {
  addCocktailValidator,
  cocktailIdValidator,
  updateCocktailValidator,
} from '#validators/cocktail'
import { paginationValidator } from '#validators/pagination'

export default class CocktailsController {
  async readAllCocktails({ request, response }: HttpContext) {
    const qs = request.qs()

    const rawData = {
      page: qs.page !== undefined ? Number(qs.page) : undefined,
      limit: qs.limit !== undefined ? Number(qs.limit) : undefined,
      category: qs.category === undefined ? undefined : qs.category,
      alcohol: qs.alcohol === undefined ? undefined : qs.alcohol,
      sortBy: qs.sortBy === undefined ? undefined : qs.sortBy,
      sortOrder: qs.sortOrder === undefined ? undefined : qs.sortOrder,
    }

    const validatedData = await paginationValidator.validate(rawData)

    const service = new CocktailsService()

    const cocktails = await service.getAll({
      page: validatedData.page,
      limit: validatedData.limit,
      category: validatedData.category,
      alcohol: validatedData.alcohol,
      sortBy: validatedData.sortBy,
      sortOrder: validatedData.sortOrder,
    })

    return response.ok(cocktails)
  }

  async getCocktailsById({ params, response }: HttpContext) {
    const data = await cocktailIdValidator.validate(params)
    const service = new CocktailsService()
    const cocktails = await service.getById(data.id)

    return response.ok(cocktails)
  }

  async addCocktail({ request, response }: HttpContext) {
    const data = await request.validateUsing(addCocktailValidator)
    const service = new CocktailsService()

    const rec = await service.addRecord({
      name: data.name,
      category: data.category ?? undefined,
      recipe: data.recipe ?? undefined,
      ingredients: data.ingredients ?? undefined,
    })

    return response.created(rec)
  }

  async deleteCocktail({ params, response }: HttpContext) {
    const data = await cocktailIdValidator.validate(params)

    const service = new CocktailsService()

    await service.deleteRecord(data.id)

    return response.ok(data)
  }

  async updateCocktail({ params, request, response }: HttpContext) {
    const { id } = await cocktailIdValidator.validate(params)
    const data = await request.validateUsing(updateCocktailValidator)

    const service = new CocktailsService()
    const updatedCocktail = await service.updateRecord(id, data)

    return response.ok(updatedCocktail)
  }
}
