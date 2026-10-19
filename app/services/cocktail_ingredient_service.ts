import CocktailIngredient from '#models/cocktail_ingredient'

export default class CocktailIngredientService {
  async getAll() {
    return CocktailIngredient.all()
  }

  async addRecord(data: { ingredientId: number, cocktailId: number, amount?: number, unit?: string }) {
    const record = await CocktailIngredient.create({
      ingredientId: data.ingredientId,
      cocktailId: data.cocktailId,
      unit: data.unit,
      amount: data.amount,
    })

    return record
  }
}
