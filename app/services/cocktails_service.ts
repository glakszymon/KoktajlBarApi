import Cocktail from '#models/cocktail'
import db from '@adonisjs/lucid/services/db'

export default class CocktailsService {
  async getAll(filters: { page?: number; limit?: number }) {
    const page = filters.page || 1
    const limit = filters.limit || 10

    const query = Cocktail.query().preload('ingredients')

    const action = await query.paginate(page, limit)

    return action
  }

  async getById(id: number) {
    const cocktail = await Cocktail.query().where('id', id).preload('ingredients').firstOrFail()

    return cocktail
  }

  public async addRecord(data: {
    name: string
    category?: string
    recipe?: string
    ingredients?: Array<{
      ingredient_id: number
      amount?: number
      unit?: string
    }>
  }) {
    return await db.transaction(async (trx) => {
      const cocktail = await Cocktail.create(
        {
          name: data.name,
          category: data.category,
          recipe: data.recipe,
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

  async updateRecord(id: number, data: { name?: string; category?: string; recipe?: string }) {
    const activeCocktail = await Cocktail.findOrFail(id)

    activeCocktail.merge(data)

    await activeCocktail.save()
    return activeCocktail
  }
}
