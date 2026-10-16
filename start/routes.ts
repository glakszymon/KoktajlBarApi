/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

// import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import IngredientsController from '#controllers/ingredients_controller'
import console from 'node:console'
// import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/ingredients', () => {
  const temp = new IngredientsController()
  const r = temp.readAllIngredients()
  return r
})

router.post('/ingredients', [IngredientsController, 'addIngredient'])

router.delete('/ingredients', [IngredientsController, 'deleteIngredient'])

// Podsumowanie struktury API dla tego zadania:
//
//     Zarządzanie składnikami (/ingredients):
//
//         GET /ingredients - lista składników
//
//         POST /ingredients - dodanie nowego składnika
//
//         GET /ingredients/{id} - szczegóły składnika
//
//         PUT /ingredients/{id} - edycja składnika
//
//         DELETE /ingredients/{id} - usunięcie składnika
//
//     Zarządzanie koktajlami (/cocktails):
//
//         GET /cocktails - lista koktajli
//
//         POST /cocktails - utworzenie koktajlu (przypisanie istniejących składników wraz z ich ilościami)
//
//         GET /cocktails/{id} - szczegóły koktajlu (wraz ze składnikami)
//
//         PUT /cocktails/{id} - edycja koktajlu i jego składników
//
//         DELETE /cocktails/{id} - usunięcie koktajlu

//
// router
//   .group(() => {
//     router
//       .group(() => {
//         router.post('signup', [controllers.NewAccount, 'store'])
//         router.post('login', [controllers.AccessTokens, 'store'])
//       })
//       .prefix('auth')
//       .as('auth')
//
//     router
//       .group(() => {
//         router.get('profile', [controllers.Profile, 'show'])
//         router.post('logout', [controllers.AccessTokens, 'destroy'])
//       })
//       .prefix('account')
//       .as('profile')
//       .use(middleware.auth())
//   })
//   .prefix('/api/v1')
