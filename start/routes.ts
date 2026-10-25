// start/routes.ts
import router from '@adonisjs/core/services/router'
import swaggerConfig from '#config/swagger'
import AutoSwagger from 'adonis-autoswagger'

const CocktailsController = () => import('#controllers/cocktails_controller')
const IngredientsController = () => import('#controllers/ingredients_controller')

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

router.get('/swagger', async () => {
  return (AutoSwagger as any).default.docs(router.toJSON(), swaggerConfig)
})

router.get('/docs', async () => {
  return (AutoSwagger as any).default.ui('/swagger', swaggerConfig)
})
