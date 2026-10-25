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
  /**
   * @readAllCocktails
   * @summary Pobierz listę koktajli
   * @description Zwraca przefiltrowaną listę koktajli z obsługą paginacji i sortowania.
   * @paramQuery page - Numer strony - @type(number)
   * @paramQuery limit - Liczba elementów na stronie - @type(number)
   * @paramQuery category - Filtruj po kategorii - @type(string)
   * @paramQuery alcohol - Czy zawiera alkohol (true/false) - @type(boolean)
   * @paramQuery sortBy - Pole sortowania (np. created) - @type(string)
   * @paramQuery sortOrder - Kierunek sortowania (asc / desc) - @type(string)
   * @responseBody 200 - <Cocktail[]>.with(ingredients).paginated() - Lista koktajli z metadanymi paginacji
   */
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

  /**
   * @getCocktailsById
   * @summary Pobierz koktajl po ID
   * @description Zwraca szczegółowe informacje o wybranym koktajlu wraz ze składnikami.
   * @paramPath id - ID koktajlu - @type(number)
   * @responseBody 200 - <Cocktail>.with(ingredients) - Szczegóły koktajlu
   */
  async getCocktailsById({ params, response }: HttpContext) {
    const data = await cocktailIdValidator.validate(params)
    const service = new CocktailsService()
    const cocktails = await service.getById(data.id)

    return response.ok(cocktails)
  }

  /**
   * @addCocktail
   * @summary Dodaj nowy koktajl
   * @description Tworzy nowy koktajl w bazie danych wraz z przypisanymi składnikami.
   * @requestBody <addCocktailValidator>
   * @responseBody 201 - <Cocktail>.with(ingredients) - Koktajl został pomyślnie utworzony
   */
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

  /**
   * @deleteCocktail
   * @summary Usuń koktajl
   * @description Usuwa koktajl o podanym ID z bazy danych.
   * @paramPath id - ID koktajlu do usunięcia - @type(number)
   * @responseBody 200 - <cocktailIdValidator> - ID usuniętego koktajlu
   */
  async deleteCocktail({ params, response }: HttpContext) {
    const data = await cocktailIdValidator.validate(params)

    const service = new CocktailsService()

    await service.deleteRecord(data.id)

    return response.ok(data)
  }

  /**
   * @updateCocktail
   * @summary Aktualizuj koktajl
   * @description Modyfikuje istniejący koktajl oraz jego składniki.
   * @paramPath id - ID koktajlu do aktualizacji - @type(number)
   * @requestBody <updateCocktailValidator>
   * @responseBody 200 - <Cocktail>.with(ingredients) - Zaktualizowany koktajl
   */
  async updateCocktail({ params, request, response }: HttpContext) {
    const { id } = await cocktailIdValidator.validate(params)
    const data = await request.validateUsing(updateCocktailValidator)

    const service = new CocktailsService()
    const updatedCocktail = await service.updateRecord(id, data)

    return response.ok(updatedCocktail)
  }
}
