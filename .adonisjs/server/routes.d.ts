import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'ingredients.read_all_ingredients': { paramsTuple?: []; params?: {} }
    'ingredients.get_ingredient_by_id': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ingredients.add_ingredient': { paramsTuple?: []; params?: {} }
    'ingredients.delete_ingredient': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ingredients.update_ingredient': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cocktails.read_all_cocktails': { paramsTuple?: []; params?: {} }
    'cocktails.get_cocktails_by_id': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cocktails.add_cocktail': { paramsTuple?: []; params?: {} }
    'cocktails.delete_cocktail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cocktails.update_cocktail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.add_comment': { paramsTuple: [ParamValue]; params: {'cocktailId': ParamValue} }
    'comments.get_all_comments_about_cocktail': { paramsTuple: [ParamValue]; params: {'cocktailId': ParamValue} }
    'comments.get_comment_by_id': { paramsTuple: [ParamValue,ParamValue]; params: {'cocktailId': ParamValue,'id': ParamValue} }
    'comments.delete_comment': { paramsTuple: [ParamValue,ParamValue]; params: {'cocktailId': ParamValue,'id': ParamValue} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'user_roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'ingredients.read_all_ingredients': { paramsTuple?: []; params?: {} }
    'ingredients.get_ingredient_by_id': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cocktails.read_all_cocktails': { paramsTuple?: []; params?: {} }
    'cocktails.get_cocktails_by_id': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.get_all_comments_about_cocktail': { paramsTuple: [ParamValue]; params: {'cocktailId': ParamValue} }
    'comments.get_comment_by_id': { paramsTuple: [ParamValue,ParamValue]; params: {'cocktailId': ParamValue,'id': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'ingredients.read_all_ingredients': { paramsTuple?: []; params?: {} }
    'ingredients.get_ingredient_by_id': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cocktails.read_all_cocktails': { paramsTuple?: []; params?: {} }
    'cocktails.get_cocktails_by_id': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.get_all_comments_about_cocktail': { paramsTuple: [ParamValue]; params: {'cocktailId': ParamValue} }
    'comments.get_comment_by_id': { paramsTuple: [ParamValue,ParamValue]; params: {'cocktailId': ParamValue,'id': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'ingredients.add_ingredient': { paramsTuple?: []; params?: {} }
    'cocktails.add_cocktail': { paramsTuple?: []; params?: {} }
    'comments.add_comment': { paramsTuple: [ParamValue]; params: {'cocktailId': ParamValue} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'ingredients.delete_ingredient': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cocktails.delete_cocktail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.delete_comment': { paramsTuple: [ParamValue,ParamValue]; params: {'cocktailId': ParamValue,'id': ParamValue} }
  }
  PATCH: {
    'ingredients.update_ingredient': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cocktails.update_cocktail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'user_roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}