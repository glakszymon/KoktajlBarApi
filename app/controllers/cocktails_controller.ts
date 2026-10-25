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
   * @paramQuery page - Numer strony, dodatnia liczba całkowita (domyślnie 1) - @type(integer) @example(1)
   * @paramQuery limit - Liczba elementów na stronie, od 1 do 100 (domyślnie 10) - @type(integer) @example(10)
   * @paramQuery category - Filtruj po kategorii koktajlu - @type(string) @example(Owocowy)
   * @paramQuery alcohol - Filtruj koktajle mające składnik o wskazanej zawartości alkoholu - @type(boolean) @example(true)
   * @paramQuery sortBy - Pole sortowania (domyślnie id) - @type(string) @enum(id,name,category,created,updated)
   * @paramQuery sortOrder - Kierunek sortowania (domyślnie asc) - @type(string) @enum(asc,desc)
   * @responseBody 200 - <Cocktail[]>.with(ingredients).paginated() - Lista koktajli z metadanymi paginacji
   * @responseBody 422 - Nieprawidłowe parametry filtrowania, sortowania lub paginacji
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
   * @paramPath id - ID koktajlu, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @responseBody 200 - <Cocktail>.with(ingredients) - Szczegóły koktajlu
   * @responseBody 404 - Nie znaleziono koktajlu o podanym ID
   * @responseBody 422 - Nieprawidłowe ID koktajlu
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
   * @description Tworzy koktajl i zwraca go wraz ze składnikami. Pole name jest wymagane; category, recipe i ingredients są opcjonalne. Każdy składnik wymaga ingredient_id istniejącego w bazie; amount i unit są opcjonalne.
   * @requestBody <addCocktailValidator>
   * @responseBody 201 - <Cocktail>.with(ingredients) - Koktajl został pomyślnie utworzony
   * @responseBody 422 - Nieprawidłowe dane koktajlu lub nieistniejące ID składnika
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
   * @paramPath id - ID koktajlu do usunięcia, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @responseBody 200 - <cocktailIdValidator> - ID usuniętego koktajlu
   * @responseBody 404 - Nie znaleziono koktajlu o podanym ID
   * @responseBody 422 - Nieprawidłowe ID koktajlu
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
   * @description Aktualizuje wyłącznie przesłane pola koktajlu. Przesłanie ingredients zastępuje listę przypisanych składników; pusta tablica usuwa wszystkie powiązania, a pominięcie pola pozostawia je bez zmian. Każdy składnik wymaga ingredient_id istniejącego w bazie; amount i unit są opcjonalne.
   * @paramPath id - ID koktajlu do aktualizacji, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @requestBody <updateCocktailValidator>
   * @responseBody 200 - <Cocktail>.with(ingredients) - Zaktualizowany koktajl
   * @responseBody 404 - Nie znaleziono koktajlu o podanym ID
   * @responseBody 422 - Nieprawidłowe ID koktajlu, dane aktualizacji lub nieistniejące ID składnika
   */
  async updateCocktail({ params, request, response }: HttpContext) {
    const { id } = await cocktailIdValidator.validate(params)
    const data = await request.validateUsing(updateCocktailValidator)

    const service = new CocktailsService()
    const updatedCocktail = await service.updateRecord(id, data)

    return response.ok(updatedCocktail)
  }
}
