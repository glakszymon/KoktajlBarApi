/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'ingredients.read_all_ingredients': {
    methods: ["GET","HEAD"],
    pattern: '/ingredients',
    tokens: [{"old":"/ingredients","type":0,"val":"ingredients","end":""}],
    types: placeholder as Registry['ingredients.read_all_ingredients']['types'],
  },
  'ingredients.get_ingredient_by_id': {
    methods: ["GET","HEAD"],
    pattern: '/ingredients/:id',
    tokens: [{"old":"/ingredients/:id","type":0,"val":"ingredients","end":""},{"old":"/ingredients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['ingredients.get_ingredient_by_id']['types'],
  },
  'ingredients.add_ingredient': {
    methods: ["POST"],
    pattern: '/ingredients',
    tokens: [{"old":"/ingredients","type":0,"val":"ingredients","end":""}],
    types: placeholder as Registry['ingredients.add_ingredient']['types'],
  },
  'ingredients.delete_ingredient': {
    methods: ["DELETE"],
    pattern: '/ingredients/:id',
    tokens: [{"old":"/ingredients/:id","type":0,"val":"ingredients","end":""},{"old":"/ingredients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['ingredients.delete_ingredient']['types'],
  },
  'ingredients.update_ingredient': {
    methods: ["PATCH"],
    pattern: '/ingredients/:id',
    tokens: [{"old":"/ingredients/:id","type":0,"val":"ingredients","end":""},{"old":"/ingredients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['ingredients.update_ingredient']['types'],
  },
  'cocktails.read_all_cocktails': {
    methods: ["GET","HEAD"],
    pattern: '/cocktails',
    tokens: [{"old":"/cocktails","type":0,"val":"cocktails","end":""}],
    types: placeholder as Registry['cocktails.read_all_cocktails']['types'],
  },
  'cocktails.get_cocktails_by_id': {
    methods: ["GET","HEAD"],
    pattern: '/cocktails/:id',
    tokens: [{"old":"/cocktails/:id","type":0,"val":"cocktails","end":""},{"old":"/cocktails/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['cocktails.get_cocktails_by_id']['types'],
  },
  'cocktails.add_cocktail': {
    methods: ["POST"],
    pattern: '/cocktails',
    tokens: [{"old":"/cocktails","type":0,"val":"cocktails","end":""}],
    types: placeholder as Registry['cocktails.add_cocktail']['types'],
  },
  'cocktails.delete_cocktail': {
    methods: ["DELETE"],
    pattern: '/cocktails/:id',
    tokens: [{"old":"/cocktails/:id","type":0,"val":"cocktails","end":""},{"old":"/cocktails/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['cocktails.delete_cocktail']['types'],
  },
  'cocktails.update_cocktail': {
    methods: ["PATCH"],
    pattern: '/cocktails/:id',
    tokens: [{"old":"/cocktails/:id","type":0,"val":"cocktails","end":""},{"old":"/cocktails/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['cocktails.update_cocktail']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
