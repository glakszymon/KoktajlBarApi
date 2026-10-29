import type { HttpContext } from '@adonisjs/core/http'
import {
  addCommentValidator,
  commentIdValidator,
  deleteCommentValidator,
  listCommentsValidator,
} from '#validators/comment'
import CommentsService from '#services/comments_service'

export default class CommentsController {
  /**
   * @addComment
   * @summary Dodaj komentarz i ocenę koktajlu
   * @description Wymaga tokena Bearer (user lub admin). Autor pochodzi z tokena, a koktajl ze ścieżki; nie przesyłaj userId, cocktailId ani params w body. rating jest wymaganą liczbą całkowitą JSON od 1 do 5. content jest opcjonalne lub null; tekst po przycięciu musi mieć 1–500 znaków i nie może składać się z samych białych znaków. Można wielokrotnie ocenić ten sam koktajl, również własny. Zapis przelicza średnią rating koktajlu.
   * @paramPath cocktailId - ID ocenianego koktajlu, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @requestBody <addCommentValidator>
   * @responseBody 201 - <Comment> - Utworzony komentarz z oceną i ID autora
   * @responseBody 401 - Brak poprawnego tokena Bearer
   * @responseBody 404 - Nie znaleziono koktajlu
   * @responseBody 422 - Nieprawidłowe ID koktajlu, ocena lub treść
   */
  async addComment({ request, response, auth }: HttpContext) {
    const user = auth.use('api').getUserOrFail()

    const data = await request.validateUsing(addCommentValidator)

    const service = new CommentsService()

    const temp = await service.addRecord(user.id, {
      cocktailId: data.params.cocktailId,
      rating: data.rating,
      content: data.content ?? null,
    })
    return response.created(temp)
  }

  /**
   * @getCommentById
   * @summary Pobierz komentarz po ID
   * @description Endpoint publiczny. Obecna implementacja wyszukuje wyłącznie po id komentarza: nie waliduje cocktailId ani nie sprawdza przypisania komentarza do koktajlu ze ścieżki. Aby pobrać komentarze konkretnego koktajlu, użyj GET /cocktails/{cocktailId}/comments.
   * @paramPath cocktailId - ID koktajlu w adresie; obecnie nie jest sprawdzane przy odczycie pojedynczego komentarza - @type(integer) @required @example(1)
   * @paramPath id - ID komentarza, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @responseBody 200 - <Comment> - Komentarz z oceną i ID autora
   * @responseBody 404 - Nie znaleziono komentarza
   * @responseBody 422 - Nieprawidłowe ID komentarza
   */
  async getCommentById({ params, response }: HttpContext) {
    const data = await commentIdValidator.validate(params)
    const service = new CommentsService()
    const cocktails = await service.getById(data.id)

    return response.ok(cocktails)
  }

  /**
   * @getAllCommentsAboutCocktail
   * @summary Pobierz komentarze koktajlu
   * @description Endpoint publiczny. Zwraca wyłącznie komentarze wskazanego koktajlu, domyślnie po id malejąco. Istniejący koktajl bez komentarzy zwraca pustą data i total=0. Przy sortowaniu innym niż id remisy rozstrzyga id w tym samym kierunku. Linki paginacji zachowują limit i sortowanie.
   * @paramPath cocktailId - ID koktajlu, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @paramQuery page - Numer strony (domyślnie 1) - @type(integer) @example(1)
   * @paramQuery limit - Liczba komentarzy na stronie, 1–100 (domyślnie 10) - @type(integer) @example(10)
   * @paramQuery sortBy - Pole sortowania (domyślnie id) - @type(string) @enum(id,rating,createdAt,updatedAt) @example(id)
   * @paramQuery sortOrder - Kierunek sortowania (domyślnie desc) - @type(string) @enum(asc,desc) @example(desc)
   * @responseBody 200 - <Comment[]>.paginated() - Komentarze i metadane paginacji
   * @responseBody 404 - Nie znaleziono koktajlu
   * @responseBody 422 - Nieprawidłowe ID koktajlu lub parametry listy
   */
  async getAllCommentsAboutCocktail({ request, response }: HttpContext) {
    const data = await request.validateUsing(listCommentsValidator)

    const service = new CommentsService()

    const comments = await service.getAll(data.params.cocktailId, {
      page: data.page,
      limit: data.limit,
      sortBy: data.sortBy,
      sortOrder: data.sortOrder,
    })

    return response.ok(comments)
  }

  /**
   * @deleteComment
   * @summary Usuń komentarz i jego ocenę
   * @description Wymaga tokena Bearer autora komentarza lub administratora. Właściciel koktajlu nie może usuwać cudzych komentarzy bez roli admin. Komentarz musi należeć do koktajlu wskazanego w adresie. Nie wymaga body. Usunięcie przelicza średnią rating koktajlu; po usunięciu ostatniej oceny rating wynosi null.
   * @paramPath cocktailId - ID koktajlu, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @paramPath id - ID usuwanego komentarza, dodatnia liczba całkowita - @type(integer) @required @example(1)
   * @responseBody 200 - {"id":1} - ID usuniętego komentarza
   * @responseBody 401 - Brak poprawnego tokena Bearer
   * @responseBody 403 - Użytkownik nie jest autorem komentarza ani administratorem
   * @responseBody 404 - Nie znaleziono koktajlu lub komentarz nie należy do wskazanego koktajlu
   * @responseBody 422 - Nieprawidłowe ID koktajlu lub komentarza
   */
  async deleteComment({ request, response, auth }: HttpContext) {
    const user = auth.use('api').getUserOrFail()

    const data = await request.validateUsing(deleteCommentValidator)

    const service = new CommentsService()

    const deletedComment = await service.deleteRecord(data.params.cocktailId, data.params.id, user)

    return response.ok(deletedComment)
  }
}
