import Cocktail from '#models/cocktail'
import db from '@adonisjs/lucid/services/db'

export default class CocktailsService {
  async getAll(filters: {
    page?: number
    limit?: number
    category?: string
    alcohol?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const page = filters.page || 1
    const limit = filters.limit || 10

    const query = Cocktail.query()

    if (filters.category !== undefined) {
      query.where('category', filters.category)
    }

    if (filters.alcohol === true) {
      query.whereHas('ingredients', (ingredientQuery) => {
        ingredientQuery.where('alcohol', true)
      })
    } else if (filters.alcohol === false) {
      query.whereDoesntHave('ingredients', (ingredientQuery) => {
        ingredientQuery.where('alcohol', true)
      })
    }

    query.preload('ingredients', (ingredientQuery) => {
      ingredientQuery.pivotColumns(['amount', 'unit'])
    })

    query.preload('comments', (commentQuery) => {
      commentQuery.orderBy('id', 'desc')
    })

    const allowedSortColumns = ['id', 'name', 'category', 'created', 'updated']
    const sortBy = allowedSortColumns.includes(filters.sortBy ?? '') ? filters.sortBy! : 'id'
    const order = filters.sortOrder === 'desc' ? 'desc' : 'asc'

    query.orderBy(sortBy, order)

    const result = await query.paginate(page, limit)

    result.baseUrl('/cocktails')
    result.queryString({
      limit,
      sortBy,
      sortOrder: order,
      ...(filters.category !== undefined && { category: filters.category }),
      ...(filters.alcohol !== undefined && { alcohol: filters.alcohol }),
    })

    return result
  }

  async getById(id: number) {
    const query = await Cocktail.query()
      .where('id', id)
      .preload('ingredients')
      .preload('comments', (commentQuery) => {
        commentQuery.orderBy('id', 'desc')
      })
      .firstOrFail()

    return query
  }

  public async addRecord(
    userId: number,
    data: {
      name: string
      category?: string
      recipe?: string
      ingredients?: Array<{
        ingredient_id: number
        amount?: number
        unit?: string
      }>
    }
  ) {
    return await db.transaction(async (trx) => {
      const cocktail = await Cocktail.create(
        {
          name: data.name,
          category: data.category,
          recipe: data.recipe,
          userId,
        },
        { client: trx }
      )

      const hasIngredients = data.ingredients && data.ingredients.length > 0

      if (hasIngredients) {
        const pivotDataMap: Record<number, { amount?: number; unit?: string }> = {}

        for (const currentIngredient of data.ingredients!) {
          pivotDataMap[currentIngredient.ingredient_id] = {
            amount: currentIngredient.amount,
            unit: currentIngredient.unit,
          }
        }

        await cocktail.related('ingredients').attach(pivotDataMap)
      }

      await cocktail.load('ingredients')

      return cocktail
    })
  }

  async deleteRecord(id: number) {
    const cocktail = await Cocktail.findOrFail(id)
    await cocktail.delete()

    return true
  }

  async updateRecord(
    id: number,
    data: {
      name?: string
      category?: string
      recipe?: string
      ingredients?: Array<{
        ingredient_id: number
        amount?: number
        unit?: string
      }>
    }
  ) {
    return await db.transaction(async (trx) => {
      const cocktail = await Cocktail.findOrFail(id, { client: trx })

      cocktail.merge({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.recipe !== undefined && { recipe: data.recipe }),
      })

      await cocktail.save()

      const hasIngredients = data.ingredients !== undefined

      if (hasIngredients) {
        const pivotDataMap: Record<number, { amount?: number; unit?: string }> = {}

        for (const currentIngredient of data.ingredients!) {
          pivotDataMap[currentIngredient.ingredient_id] = {
            amount: currentIngredient.amount,
            unit: currentIngredient.unit,
          }
        }

        await cocktail.related('ingredients').sync(pivotDataMap)
      }

      await cocktail.load('ingredients')

      return cocktail
    })
  }
}
