import type { HttpContext } from '@adonisjs/core/http'
import { addCommentValidator } from '#validators/comment'
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
}
