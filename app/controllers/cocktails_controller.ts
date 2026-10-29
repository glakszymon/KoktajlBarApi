// import type { HttpContext } from '@adonisjs/core/http'

import CocktailsService from '../services/cocktails_service.js'
import { type HttpContext } from '@adonisjs/core/http'

import {
  addCocktailValidator,
  cocktailIdValidator,
  updateCocktailValidator,
} from '#validators/cocktail'
import { paginationCocktailValidator } from '#validators/pagination'
import Cocktail from '#models/cocktail'

export default class CocktailsController {
  /**
   * @readAllCocktails
   * @summary Pobierz listę koktajli
   * @description Endpoint publiczny. Zwraca przefiltrowaną listę koktajli ze wszystkimi ich składnikami, komentarzami i userId autora oraz średnią rating (null przy braku ocen). Filtry userId, category, alcohol i ingredientIds można łączyć (AND). ingredientIds wymaga wszystkich wymienionych składników, ale dopuszcza dodatkowe; powtórzenia ID są usuwane. Pominięty filtr nie ogranicza wyników. Nieistniejący autor lub składnik daje pustą listę (200). Filtrowanie odbywa się przed paginacją, a linki stron zachowują filtry i sortowanie. Pole alcohol jest wyliczane ze składników.
   * @paramQuery page - Numer strony, dodatnia liczba całkowita (domyślnie 1) - @type(integer) @example(1)
   * @paramQuery limit - Liczba elementów na stronie, od 1 do 100 (domyślnie 10) - @type(integer) @example(10)
   * @paramQuery category - Filtruj po kategorii koktajlu - @type(string)
   * @paramQuery alcohol - true: przynajmniej jeden składnik alkoholowy; false: brak alkoholowych składników, również koktajle bez składników - @type(boolean) @example(true)
   * @paramQuery userId - ID autora koktajli, dodatnia liczba całkowita. Dla własnych koktajli użyj user.id z GET /auth/me - @type(integer) @example(5)
   * @paramQuery ingredientIds - Od 1 do 50 dodatnich całkowitych ID składników oddzielonych przecinkami, np. 2,5. Wymaga składnika 2 i 5; może zawierać dodatkowe. Bez spacji wewnątrz listy; białe znaki na brzegach są usuwane. ID dobierz z GET /ingredients - @type(string) @example(2,5)
   * @paramQuery sortBy - Pole sortowania (domyślnie id) - @type(string) @enum(id,name,category,created,updated)
   * @paramQuery sortOrder - Kierunek sortowania (domyślnie asc) - @type(string) @enum(asc,desc)
   * @responseBody 200 - <Cocktail[]>.with(ingredients,comments).paginated() - Lista koktajli z metadanymi paginacji
   * @responseBody 422 - Nieprawidłowe parametry filtrowania, sortowania lub paginacji
   */
  async readAllCocktails({ request, response }: HttpContext) {
    const qs = request.qs()

    const rawData = {
      page: qs.page !== undefined ? Number(qs.page) : undefined,
      limit: qs.limit !== undefined ? Number(qs.limit) : undefined,
      category: qs.category === undefined ? undefined : qs.category,
      alcohol: qs.alcohol === undefined ? undefined : qs.alcohol,
      userId: qs.userId !== undefined ? Number(qs.userId) : undefined,
      sortBy: qs.sortBy === undefined ? undefined : qs.sortBy,
      sortOrder: qs.sortOrder === undefined ? undefined : qs.sortOrder,
      ingredientIds: qs.ingredientIds,
    }

    const validatedData = await paginationCocktailValidator.validate(rawData)

    const service = new CocktailsService()

    const ingredientIds =
      validatedData.ingredientIds === undefined
        ? undefined
        : [...new Set(validatedData.ingredientIds.split(',').map(Number))]

    const cocktails = await service.getAll({
      page: validatedData.page,
      limit: validatedData.limit,
      category: validatedData.category,
      alcohol: validatedData.alcohol,
      userId: validatedData.userId,
      sortBy: validatedData.sortBy,
      sortOrder: validatedData.sortOrder,
      ingredientIds,
    })

    return response.ok(cocktails)
  }

  /**
   * @getCocktailsById
   * @summary Pobierz koktajl po ID
   * @description Endpoint publiczny. Zwraca koktajl ze składnikami, komentarzami (id malejąco), userId autora, wyliczonym alcohol i średnią rating. ID autora można porównać z user.id odpowiedzi GET /auth/me.
   * @paramPath id - ID koktajlu, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @responseBody 200 - <Cocktail>.with(ingredients,comments) - Szczegóły koktajlu
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
   * @description Wymaga tokena Bearer (user lub admin). Tworzy koktajl należący do zalogowanego użytkownika i zwraca go ze składnikami. userId pochodzi wyłącznie z tokena; nie przesyłaj autora w body. Pole name jest wymagane; category, recipe i ingredients są opcjonalne. Każdy składnik wymaga ingredient_id istniejącego w bazie; amount i unit są opcjonalne. alcohol jest wyliczane, a rating pochodzi z ocen komentarzy.
   * @requestBody <addCocktailValidator>
   * @responseBody 201 - <Cocktail>.with(ingredients) - Koktajl został pomyślnie utworzony
   * @responseBody 401 - Brak poprawnego tokena Bearer
   * @responseBody 422 - Nieprawidłowe dane koktajlu lub nieistniejące ID składnika
   */
  async addCocktail({ request, response, auth }: HttpContext) {
    const user = auth.use('api').getUserOrFail()

    const data = await request.validateUsing(addCocktailValidator)
    const service = new CocktailsService()

    const rec = await service.addRecord(user.id, {
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
   * @description Wymaga tokena Bearer właściciela koktajlu lub administratora. Usuwa koktajl, jego komentarze i powiązania ze składnikami; pozostawia katalog składników. Nie wymaga body.
   * @paramPath id - ID koktajlu do usunięcia, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @responseBody 200 - <cocktailIdValidator> - ID usuniętego koktajlu
   * @responseBody 401 - Brak poprawnego tokena Bearer
   * @responseBody 403 - Użytkownik nie jest właścicielem koktajlu ani administratorem
   * @responseBody 404 - Nie znaleziono koktajlu o podanym ID
   * @responseBody 422 - Nieprawidłowe ID koktajlu
   */
  async deleteCocktail({ params, response, auth }: HttpContext) {
    const user = auth.use('api').getUserOrFail()

    const data = await cocktailIdValidator.validate(params)

    const cocktail = await Cocktail.findOrFail(data.id)

    const isOwner = cocktail.userId === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return response.forbidden({
        message: 'Możesz usuwać tylko własne koktajle.',
      })
    }

    const service = new CocktailsService()

    await service.deleteRecord(data.id)

    return response.ok(data)
  }

  /**
   * @updateCocktail
   * @summary Aktualizuj koktajl
   * @description Wymaga tokena Bearer właściciela koktajlu lub administratora. Aktualizuje wyłącznie przesłane pola; nie zmienia autora ani katalogu składników. Przesłanie ingredients zastępuje listę przypisanych składników; pusta tablica usuwa wszystkie powiązania, a pominięcie pola pozostawia je bez zmian. Każdy składnik wymaga ingredient_id istniejącego w bazie; amount i unit są opcjonalne. alcohol jest ponownie wyliczane ze składników; rating zmienia się przez dodawanie i usuwanie ocen komentarzy.
   * @paramPath id - ID koktajlu do aktualizacji, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @requestBody <updateCocktailValidator>
   * @responseBody 200 - <Cocktail>.with(ingredients) - Zaktualizowany koktajl
   * @responseBody 401 - Brak poprawnego tokena Bearer
   * @responseBody 403 - Użytkownik nie jest właścicielem koktajlu ani administratorem
   * @responseBody 404 - Nie znaleziono koktajlu o podanym ID
   * @responseBody 422 - Nieprawidłowe ID koktajlu, dane aktualizacji lub nieistniejące ID składnika
   */
  async updateCocktail({ params, request, response, auth }: HttpContext) {
    const user = auth.use('api').getUserOrFail()

    const { id } = await cocktailIdValidator.validate(params)
    const cocktail = await Cocktail.findOrFail(id)

    const isOwner = cocktail.userId === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return response.forbidden({
        message: 'Możesz edytować tylko własne koktajle.',
      })
    }

    const data = await request.validateUsing(updateCocktailValidator)

    const service = new CocktailsService()
    const updatedCocktail = await service.updateRecord(id, data)

    return response.ok(updatedCocktail)
  }
}
