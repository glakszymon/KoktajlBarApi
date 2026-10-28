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
  'auth.register': {
    methods: ["POST"],
    pattern: '/auth/register',
    tokens: [{"old":"/auth/register","type":0,"val":"auth","end":""},{"old":"/auth/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.register']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/auth/login',
    tokens: [{"old":"/auth/login","type":0,"val":"auth","end":""},{"old":"/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/auth/me',
    tokens: [{"old":"/auth/me","type":0,"val":"auth","end":""},{"old":"/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.me']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/auth/logout',
    tokens: [{"old":"/auth/logout","type":0,"val":"auth","end":""},{"old":"/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'user_roles.update': {
    methods: ["PATCH"],
    pattern: '/users/:id/role',
    tokens: [{"old":"/users/:id/role","type":0,"val":"users","end":""},{"old":"/users/:id/role","type":1,"val":"id","end":""},{"old":"/users/:id/role","type":0,"val":"role","end":""}],
    types: placeholder as Registry['user_roles.update']['types'],
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
