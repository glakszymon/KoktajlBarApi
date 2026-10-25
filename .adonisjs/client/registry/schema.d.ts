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
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pagination').paginationValidator)>>
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
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pagination').paginationValidator)>>
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
}
