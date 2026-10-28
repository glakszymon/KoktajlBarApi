// start/routes.ts
import router from '@adonisjs/core/services/router'
import swaggerConfig from '#config/swagger'
import { normalizeOpenApi } from '#config/openapi'
import AutoSwagger from 'adonis-autoswagger'
const AuthController = () => import('#controllers/auth_controller')
import { middleware } from '#start/kernel'
const UserRolesController = () => import('#controllers/user_roles_controller')

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
    router
      .post('/', [IngredientsController, 'addIngredient'])
      .use(middleware.role({ roles: ['admin'] }))
    router
      .delete('/:id', [IngredientsController, 'deleteIngredient'])
      .use(middleware.role({ roles: ['admin'] }))
    router
      .patch('/:id', [IngredientsController, 'updateIngredient'])
      .use(middleware.role({ roles: ['admin'] }))
  })
  .prefix('/ingredients')
  .use(middleware.auth({ guards: ['api'] }))

// COCKTAILS
router
  .group(() => {
    router.get('/', [CocktailsController, 'readAllCocktails'])
    router.get('/:id', [CocktailsController, 'getCocktailsById'])
    router
      .post('/', [CocktailsController, 'addCocktail'])
      .use(middleware.role({ roles: ['admin'] }))
    router
      .delete('/:id', [CocktailsController, 'deleteCocktail'])
      .use(middleware.role({ roles: ['admin'] }))
    router
      .patch('/:id', [CocktailsController, 'updateCocktail'])
      .use(middleware.role({ roles: ['admin'] }))
  })
  .prefix('/cocktails')
  .use(middleware.auth({ guards: ['api'] }))

router.get('/swagger', async () => {
  const generator = (AutoSwagger as any).default
  const document = await generator.json(router.toJSON(), swaggerConfig)
  return generator.jsonToYaml(normalizeOpenApi(document))
})

router.get('/docs', async () => {
  return (AutoSwagger as any).default.ui('/swagger', swaggerConfig)
})

router
  .group(() => {
    router.post('/register', [AuthController, 'register'])
    router.post('/login', [AuthController, 'login'])

    router.get('/me', [AuthController, 'me']).use(middleware.auth({ guards: ['api'] }))

    router.post('/logout', [AuthController, 'logout']).use(middleware.auth({ guards: ['api'] }))
  })
  .prefix('/auth')

router
  .patch('/users/:id/role', [UserRolesController, 'update'])
  .use([middleware.auth({ guards: ['api'] }), middleware.role({ roles: ['admin'] })])
