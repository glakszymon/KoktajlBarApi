/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'ingredients.read_all_ingredients': {
    methods: ["GET","HEAD"]
    pattern: '/ingredients'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pagination').paginationIngredientValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['readAllIngredients']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['readAllIngredients']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ingredients.get_ingredient_by_id': {
    methods: ["GET","HEAD"]
    pattern: '/ingredients/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/ingredient').ingredientIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['getIngredientById']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['getIngredientById']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ingredients.add_ingredient': {
    methods: ["POST"]
    pattern: '/ingredients'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ingredient').addIngredientValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/ingredient').addIngredientValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['addIngredient']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['addIngredient']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ingredients.delete_ingredient': {
    methods: ["DELETE"]
    pattern: '/ingredients/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ingredient').ingredientIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ingredient').ingredientIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['deleteIngredient']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['deleteIngredient']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ingredients.update_ingredient': {
    methods: ["PATCH"]
    pattern: '/ingredients/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ingredient').updateIngredientValidator)>|InferInput<(typeof import('#validators/ingredient').ingredientIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ingredient').updateIngredientValidator)>|InferInput<(typeof import('#validators/ingredient').ingredientIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['updateIngredient']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ingredients_controller').default['updateIngredient']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'cocktails.read_all_cocktails': {
    methods: ["GET","HEAD"]
    pattern: '/cocktails'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pagination').paginationCocktailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['readAllCocktails']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['readAllCocktails']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'cocktails.get_cocktails_by_id': {
    methods: ["GET","HEAD"]
    pattern: '/cocktails/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/cocktail').cocktailIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['getCocktailsById']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['getCocktailsById']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'cocktails.add_cocktail': {
    methods: ["POST"]
    pattern: '/cocktails'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cocktail').addCocktailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/cocktail').addCocktailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['addCocktail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['addCocktail']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'cocktails.delete_cocktail': {
    methods: ["DELETE"]
    pattern: '/cocktails/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cocktail').cocktailIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/cocktail').cocktailIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['deleteCocktail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['deleteCocktail']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'cocktails.update_cocktail': {
    methods: ["PATCH"]
    pattern: '/cocktails/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cocktail').updateCocktailValidator)>|InferInput<(typeof import('#validators/cocktail').cocktailIdValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/cocktail').updateCocktailValidator)>|InferInput<(typeof import('#validators/cocktail').cocktailIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['updateCocktail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cocktails_controller').default['updateCocktail']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'comments.add_comment': {
    methods: ["POST"]
    pattern: '/cocktails/:cocktailId/comment'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/comment').addCommentValidator)>>
      paramsTuple: [ParamValue]
      params: { cocktailId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/comment').addCommentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['addComment']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['addComment']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'comments.get_all_comments_about_cocktail': {
    methods: ["GET","HEAD"]
    pattern: '/cocktails/:cocktailId/comments'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { cocktailId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/comment').listCommentsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['getAllCommentsAboutCocktail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['getAllCommentsAboutCocktail']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'comments.get_comment_by_id': {
    methods: ["GET","HEAD"]
    pattern: '/cocktails/:cocktailId/comments/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { cocktailId: ParamValue; id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/comment').commentIdValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['getCommentById']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/comments_controller').default['getCommentById']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.register': {
    methods: ["POST"]
    pattern: '/auth/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').registerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').registerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['register']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['register']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
    }
  }
  'user_roles.update': {
    methods: ["PATCH"]
    pattern: '/users/:id/role'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user_role').updateUserRoleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user_role').updateUserRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/user_roles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/user_roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
