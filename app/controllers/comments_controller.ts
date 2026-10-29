import type { HttpContext } from '@adonisjs/core/http'
import { addCommentValidator, commentIdValidator, listCommentsValidator } from '#validators/comment'
import CommentsService from '#services/comments_service'


export default class CommentsController {
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

  async getCommentById({ params, response }: HttpContext) {
    const data = await commentIdValidator.validate(params)
    const service = new CommentsService()
    const cocktails = await service.getById(data.id)

    return response.ok(cocktails)
  }

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
}
