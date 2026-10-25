/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  ingredients: {
    readAllIngredients: typeof routes['ingredients.read_all_ingredients']
    getIngredientById: typeof routes['ingredients.get_ingredient_by_id']
    addIngredient: typeof routes['ingredients.add_ingredient']
    deleteIngredient: typeof routes['ingredients.delete_ingredient']
    updateIngredient: typeof routes['ingredients.update_ingredient']
  }
  cocktails: {
    readAllCocktails: typeof routes['cocktails.read_all_cocktails']
    getCocktailsById: typeof routes['cocktails.get_cocktails_by_id']
    addCocktail: typeof routes['cocktails.add_cocktail']
    deleteCocktail: typeof routes['cocktails.delete_cocktail']
    updateCocktail: typeof routes['cocktails.update_cocktail']
  }
}
