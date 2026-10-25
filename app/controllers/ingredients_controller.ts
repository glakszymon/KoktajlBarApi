// import type { HttpContext } from '@adonisjs/core/http'

import IngredientService from '../services/ingredients_service.js'
import { type HttpContext } from '@adonisjs/core/http'
import {
  addIngredientValidator,
  ingredientIdValidator,
  updateIngredientValidator,
} from '#validators/ingredient'
import { paginationIngredientValidator } from '#validators/pagination'

export default class IngredientsController {
  /**
   * @readAllIngredients
   * @summary Pobierz listę składników
   * @description Zwraca przefiltrowaną listę składników z obsługą paginacji i sortowania.
   * @paramQuery page - Numer strony - @type(number)
   * @paramQuery limit - Liczba elementów na stronie - @type(number)
   * @paramQuery alcohol - Czy składnik zawiera alkohol (true/false) - @type(boolean)
   * @paramQuery sortBy - Pole sortowania (np. name) - @type(string)
   * @paramQuery sortOrder - Kierunek sortowania (asc / desc) - @type(string)
   * @responseBody 200 - <Ingredient[]>.paginated() - Lista składników z metadanymi paginacji
   */
  async readAllIngredients({ request, response }: HttpContext) {
    const qs = request.qs()

    const rawData = {
      page: qs.page !== undefined ? Number(qs.page) : undefined,
      limit: qs.limit !== undefined ? Number(qs.limit) : undefined,
      alcohol: qs.alcohol === undefined ? undefined : qs.alcohol,
      sortBy: qs.sortBy === undefined ? undefined : qs.sortBy,
      sortOrder: qs.sortOrder === undefined ? undefined : qs.sortOrder,
    }

    const validatedData = await paginationIngredientValidator.validate(rawData)

    const service = new IngredientService()

    const ingredients = await service.getAll({
      page: validatedData.page,
      limit: validatedData.limit,
      alcohol: validatedData.alcohol,
      sortBy: validatedData.sortBy,
      sortOrder: validatedData.sortOrder,
    })

    return response.ok(ingredients)
  }

  /**
   * @getIngredientById
   * @summary Pobierz składnik po ID
   * @description Zwraca szczegółowe informacje o wybranym składniku.
   * @paramPath id - ID składnika, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @responseBody 200 - <Ingredient> - Szczegóły składnika
   */
  async getIngredientById({ params, response }: HttpContext) {
    const data = await ingredientIdValidator.validate(params)
    const service = new IngredientService()
    const ingredient = await service.getById(data.id)
    return response.ok(ingredient)
  }

  /**
   * @addIngredient
   * @summary Dodaj nowy składnik
   * @description Tworzy nowy składnik w bazie danych.
   * @requestBody <addIngredientValidator>
   * @responseBody 201 - <Ingredient> - Składnik został pomyślnie utworzony
   */
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

  /**
   * @deleteIngredient
   * @summary Usuń składnik
   * @description Usuwa składnik wskazany przez ID w parametrach trasy.
   * @paramPath id - ID składnika do usunięcia, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @responseBody 200 - <ingredientIdValidator> - ID usuniętego składnika
   */
  async deleteIngredient({ params, response }: HttpContext) {
    const data = await ingredientIdValidator.validate(params)

    const service = new IngredientService()
    await service.deleteRecord(data.id)

    return response.ok(data)
  }

  /**
   * @updateIngredient
   * @summary Aktualizuj składnik
   * @description Modyfikuje istniejący składnik i zwraca przesłane pola po walidacji.
   * @paramPath id - ID składnika do aktualizacji, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @requestBody <updateIngredientValidator>
   * @responseBody 200 - <updateIngredientValidator> - Zatwierdzone pola aktualizacji
   */
  async updateIngredient({ params, request, response }: HttpContext) {
    const identification = await ingredientIdValidator.validate(params)
    const data = await request.validateUsing(updateIngredientValidator)

    const service = new IngredientService()
    await service.updateRecord(identification.id, data)

    return response.ok(data)
  }
}
