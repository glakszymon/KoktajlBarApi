import Comment from '#models/comment'
import Cocktail from '#models/cocktail'
import db from '@adonisjs/lucid/services/db'

export default class CommentsService {
  public async addRecord(
    userId: number,
    data: {
      cocktailId: number
      rating: number
      content: string | null
    }
  ) {
    return db.transaction(async (trx) => {
      // Sprawdź istnienie koktajlu i zablokuj go na czas operacji.
      const cocktail = await Cocktail.query({ client: trx })
        .where('id', data.cocktailId)
        .forUpdate()
        .firstOrFail()

      const comment = await Comment.create(
        {
          cocktailId: cocktail.id,
          userId,
          rating: data.rating,
          content: data.content,
        },
        { client: trx }
      )

      // Baza oblicza średnią dla tego konkretnego koktajlu.
      const result = await trx
        .from('comments')
        .where('cocktail_id', cocktail.id)
        .avg('rating as average')
        .first()

      cocktail.rating = result.average === null ? null : Number(result.average)

      await cocktail.save()

      return comment
    })
  }
}
