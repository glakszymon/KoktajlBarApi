import router from '@adonisjs/core/services/router'

const IngredientsController = () => import('#controllers/ingredients_controller')
const CocktailsController = () => import('#controllers/cocktails_controller')

router.get('/', async () => {
  return { hello: 'world' }
})

// INGREDIENTS
router
  .group(() => {
    router.get('/', [IngredientsController, 'readAllIngredients'])
    router.get('/:id', [IngredientsController, 'getIngredientById'])
    router.post('/', [IngredientsController, 'addIngredient'])
    router.delete('/:id', [IngredientsController, 'deleteIngredient'])
    router.patch('/:id', [IngredientsController, 'updateIngredient'])
  })
  .prefix('/ingredients')

// COCKTAILS
router
  .group(() => {
    router.get('/', [CocktailsController, 'readAllCocktails'])
    router.get('/:id', [CocktailsController, 'getCocktailsById'])
    router.post('/', [CocktailsController, 'addCocktail'])
    router.delete('/:id', [CocktailsController, 'deleteCocktail'])
    router.patch('/:id', [CocktailsController, 'updateCocktail'])
  })
  .prefix('/cocktails')
