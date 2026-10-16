import Ingredient from '#models/ingredient'

export default class IngredientService {
  static async getAll() {
    return Ingredient.all()
  }

  static async getById(id: number) {
    return Ingredient.findOrFail(id)
  }

  static async addRecord(data: { name: string; description?: string; alcohol?: string }) {
    const ingredient = await Ingredient.create({
      name: data.name,
      description: data.description,
      alcohol: data.alcohol ?? false,
    })

    return ingredient
  }

  static async deleteRecord(id: number) {
    const ingredient = await Ingredient.findOrFail(id)
    await ingredient.delete()

    return true
  }


}
