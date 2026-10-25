import Ingredient from '#models/ingredient'

export default class IngredientService {
  async getAll(filters: {
    page?: number
    limit?: number
    alcohol?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const page = filters.page || 1
    const limit = filters.limit || 10

    const query = Ingredient.query()

    if (filters.alcohol !== undefined) {
      query.where('alcohol', filters.alcohol)
    }

    const allowedSortColumns = ['id', 'name', 'category', 'created', 'updated']
    const sortBy = allowedSortColumns.includes(filters.sortBy ?? '') ? filters.sortBy! : 'id'
    const order = filters.sortOrder === 'desc' ? 'desc' : 'asc'

    query.orderBy(sortBy, order)

    return await query.paginate(page, limit)
  }

  async getById(id: number) {
    return Ingredient.findOrFail(id)
  }

  async addRecord(data: {
    name: string
    description?: string
    alcohol?: boolean
    photoUrl?: string | null
  }) {
    const ingredient = await Ingredient.create({
      name: data.name,
      description: data.description ?? null,
      alcohol: data.alcohol ?? true,
      photoUrl: data.photoUrl ?? null,
    })

    return ingredient
  }

  async deleteRecord(id: number) {
    const ingredient = await Ingredient.findOrFail(id)
    await ingredient.delete()

    return true
  }

  async updateRecord(
    id: number,
    data: { name?: string; description?: string; alcohol?: boolean; photoUrl?: string | null }
  ) {
    const activeIngredient = await Ingredient.findOrFail(id)

    activeIngredient.merge(data)
    await activeIngredient.save()

    return activeIngredient
  }
}
