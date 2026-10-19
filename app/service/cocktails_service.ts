import Cocktail from '#models/cocktail'

export default class CocktailsService {
  static async getAll() {
    return Cocktail.all()
  }

  static async getById(id: number) {
    return Cocktail.findOrFail(id)
  }

  async addRecord(data: { name: string; category?: string; recipe?: string }) {
    const cocktail = await Cocktail.create({
      name: data.name,
      category: data.category,
      recipe: data.recipe,
    })
    return cocktail
  }

  async deleteRecord(id: number) {
    const cocktail = await Cocktail.findOrFail(id)
    await cocktail.delete()

    return true
  }
}
