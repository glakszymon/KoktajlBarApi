// import { middleware } from '#start/kernel'

import router from '@adonisjs/core/services/router'
import IngredientsController from '#controllers/ingredients_controller'
import CocktailsController from '#controllers/cocktails_controller'

router.get('/', () => {
  return { hello: 'world' }
})

// INGREDIENTS

router.get('/ingredients', () => {
  const temp = new IngredientsController()
  const r = temp.readAllIngredients()
  return r
})

router.post('/ingredients', async (ctx) => {
  const controller = new IngredientsController()
  return controller.addIngredient(ctx)
})

router.delete('/ingredients', async (ctx) => {
  const controller = new IngredientsController()
  return controller.deleteIngredient(ctx)
})

// COCKTAILS

router.get('/cocktails', () => {
  const temp = new CocktailsController()
  return temp.readAllCocktails()
})

router.post('/cocktails', async (ctx) => {
  const controller = new CocktailsController()
  return controller.addCocktail(ctx)
})

router.delete('/cocktails', async (ctx) => {
  const controller = new CocktailsController()
  return controller.deleteCocktail(ctx)
})

router.get('/cocktails')
