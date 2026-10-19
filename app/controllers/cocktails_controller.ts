// import type { HttpContext } from '@adonisjs/core/http'

import CocktailsService from '../services/cocktails_service.js'
import { type HttpContext } from '@adonisjs/core/http'

import {
  addCocktailValidator,
  cocktailIdValidator,
  updateCocktailValidator,
} from '#validators/cocktail'

export default class CocktailsController {
  async readAllCocktails({ response }: HttpContext) {
    const service = new CocktailsService()
    const cocktails = await service.getAll()

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

    return response.created(data)
  }

  async updateCocktail({ params, request, response }: HttpContext) {
    const identification = await cocktailIdValidator.validate(params)
    const data = await request.validateUsing(updateCocktailValidator)

    const service = new CocktailsService()
    await service.updateRecord(identification.id, data)

    return response.created(data)
  }
}
