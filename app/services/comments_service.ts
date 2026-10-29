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

  public async getById(id: number) {
    return Comment.findOrFail(id)
  }

  public async getAll(
    cocktailId: number,
    filters: {
      page?: number
      limit?: number
      sortBy?: 'id' | 'rating' | 'createdAt' | 'updatedAt'
      sortOrder?: 'asc' | 'desc'
    }
  ) {
    await Cocktail.findOrFail(cocktailId)

    const page = filters.page ?? 1
    const limit = filters.limit ?? 10
    const sortBy = filters.sortBy ?? 'id'
    const sortOrder = filters.sortOrder ?? 'desc'

    const sortColumns = {
      id: 'id',
      rating: 'rating',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    } as const

    const query = Comment.query()
      .where('cocktail_id', cocktailId)
      .orderBy(sortColumns[sortBy], sortOrder)

    if (sortBy !== 'id') {
      query.orderBy('id', sortOrder)
    }

    const result = await query.paginate(page, limit)

    result.baseUrl(`/cocktails/${cocktailId}/comments`)
    result.queryString({
      limit,
      sortBy,
      sortOrder,
    })

    return result
  }
}
