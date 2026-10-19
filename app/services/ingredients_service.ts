import Ingredient from '#models/ingredient'

export default class IngredientService {
  async getAll() {
    return Ingredient.all()
  }

  async getById(id: number) {
    return Ingredient.findOrFail(id)
  }

  async addRecord(data: { name: string; description?: string; alcohol?: boolean }) {
    const ingredient = await Ingredient.create({
      name: data.name,
      description: data.description ?? null,
      alcohol: data.alcohol ?? true,
    })

    return ingredient
  }

  async deleteRecord(id: number) {
    const ingredient = await Ingredient.findOrFail(id)
    await ingredient.delete()

    return true
  }

  async updateRecord(id: number, data: { name?: string; description?: string; alcohol?: boolean }) {
    const activeIngredient = await Ingredient.findOrFail(id)

    activeIngredient.merge(data)
    await activeIngredient.save()

    return activeIngredient
  }
}
