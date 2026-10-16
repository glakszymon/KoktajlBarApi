// import type { HttpContext } from '@adonisjs/core/http'

import IngredientService from '../service/ingredients_service.js'
import { type HttpContext } from '@adonisjs/core/http'
import { createIngredientValidator } from '#validators/ingredient'
import Ingredient from '#models/ingredient'
import { messages } from '@vinejs/vine/defaults'

export default class IngredientsController {
  public readAllIngredients() {
    return IngredientService.getAll()
  }

  async addIngredient({ request, response }: HttpContext) {
    const validatedData = await request.validateUsing(createIngredientValidator)
    const newIngredient = await IngredientService.addRecord(validatedData)

    return response.created({
      message: 'Składnik został pomyślnie dodany do bazy!',
      data: newIngredient,
    })
  }

  async deleteIngredient({ request, response }: HttpContext) {
    const data = await request.input('id')
    const deleteAction = await IngredientService.deleteRecord(data.id)

    if (deleteAction) {
      return response.created({
        messages: 'Składnik pomyślnie usuniety',
      })
    }

    return response.created({
      messages: 'Składnik nie został usuniety',
    })
  }
}
