import {
  operationExamples,
  paginationExample,
  paginationMetaExample,
  schemaExamples,
} from './openapi_examples.js'
import { documentAuth } from './openapi_auth.js'

export type Schema = {
  $ref?: string
  description?: string
  format?: string
  type?: string
  properties?: Record<string, Schema>
  items?: Schema
  required?: boolean | string[]
  nullable?: boolean
  choices?: unknown[]
  enum?: unknown[]
  minimum?: number
  maximum?: number
  exclusiveMinimum?: boolean
  minLength?: number
  maxLength?: number
  example?: unknown
}

type MediaType = { schema?: Schema; example?: unknown }
type Response = { description: string; content?: Record<string, MediaType> }
export type Operation = {
  description?: string
  parameters?: { in: string; name: string; required?: boolean; schema?: Schema }[]
  responses?: Record<string, Response>
  requestBody?: { required?: boolean; content?: Record<string, MediaType> }
  security?: Record<string, string[]>[]
}

type OpenApiDocument = {
  components: { schemas: Record<string, Schema>; responses?: Record<string, Response> }
  paths?: Record<string, Record<string, Operation>>
}

function normalizeExample(
  schema: Schema,
  example: unknown,
  schemas: Record<string, Schema>
): unknown {
  if (schema.$ref) {
    const target = schemas[schema.$ref.replace('#/components/schemas/', '')]
    return target ? normalizeExample(target, example, schemas) : example
  }
  if (example === null && schema.nullable) return null
  if (schema.format === 'uri') {
    if (typeof example === 'string' && URL.canParse(example)) return example
    return 'https://example.com/ingredient.jpg'
  }
  if (schema.type === 'object' && example && typeof example === 'object') {
    return Object.fromEntries(
      Object.entries(example).map(([name, value]) => [
        name,
        schema.properties?.[name]
          ? normalizeExample(schema.properties[name], value, schemas)
          : value,
      ])
    )
  }
  if (schema.type === 'array' && schema.items && Array.isArray(example)) {
    return example.map((value) => normalizeExample(schema.items!, value, schemas))
  }
  if (schema.enum && !schema.enum.includes(example)) {
    return schema.enum[0]
  }
  if (schema.type === 'number' || schema.type === 'integer') {
    let value = example === '' ? 1 : Number(example)
    if (!Number.isFinite(value)) value = schema.minimum ?? 1
    if (schema.type === 'integer') value = Math.trunc(value)
    if (schema.minimum !== undefined) {
      value = Math.max(value, schema.minimum + (schema.exclusiveMinimum ? 1 : 0))
    }
    if (schema.maximum !== undefined) value = Math.min(value, schema.maximum)
    return value
  }
  if (schema.type === 'boolean') return example === true || example === 'true'
  return example
}

function applySchemaExample(schema: Schema, example: unknown) {
  if (schema.$ref) return
  schema.example = structuredClone(example)
  if (schema.properties && example && typeof example === 'object' && !Array.isArray(example)) {
    for (const [name, value] of Object.entries(example)) {
      const property = schema.properties[name]
      if (property) applySchemaExample(property, value)
    }
  }
  if (schema.items && Array.isArray(example) && example.length > 0) {
    applySchemaExample(schema.items, example[0])
  }
}

function normalizeSchema(schema: Schema, schemas: Record<string, Schema>) {
  if (schema.$ref) {
    delete schema.example
    return
  }
  const required = new Set(Array.isArray(schema.required) ? schema.required : [])
  if (schema.properties) {
    for (const [name, property] of Object.entries(schema.properties)) {
      if (property.required === true) required.add(name)
      if (typeof property.required === 'boolean') delete property.required
      normalizeSchema(property, schemas)
    }
  }
  if (required.size > 0) schema.required = [...required]
  else delete schema.required

  if (schema.choices) {
    schema.enum = schema.choices
    if (schema.choices.every((value) => typeof value === 'string')) schema.type = 'string'
    delete schema.choices
  }
  if (schema.items) normalizeSchema(schema.items, schemas)
  if (schema.example !== undefined)
    schema.example = normalizeExample(schema, schema.example, schemas)
}

/** Correct conversion bugs in adonis-autoswagger without changing runtime validation. */
export function normalizeOpenApi<T extends OpenApiDocument>(document: T): T {
  const schemas = document.components.schemas

  for (const name of ['addCocktailValidator', 'updateCocktailValidator']) {
    const ingredients = schemas[name]?.properties?.ingredients
    const unit = ingredients?.items?.properties?.unit
    if (unit) {
      unit.type = 'string'
      unit.minLength = 1
      unit.maxLength = 20
      unit.example = 'ml'
      delete unit.minimum
      delete unit.maximum
      // The parser writes array validation errors to properties.items by mistake.
      delete ingredients!.properties
    }
    const amount = ingredients?.items?.properties?.amount
    if (amount) Object.assign(amount, { minimum: 0, exclusiveMinimum: true })
    const ingredientId = ingredients?.items?.properties?.ingredient_id
    if (ingredientId) Object.assign(ingredientId, { minimum: 0, exclusiveMinimum: true })
  }

  const nullableFields: Record<string, string[]> = {
    Cocktail: ['category', 'recipe'],
    Ingredient: ['description', 'photo_url'],
    CocktailIngredient: ['amount', 'unit', 'ingredient_id'],
    addIngredientValidator: ['photoUrl'],
    updateIngredientValidator: ['photoUrl'],
    PaginationMeta: ['nextPageUrl', 'previousPageUrl'],
  }
  for (const [name, fields] of Object.entries(nullableFields)) {
    for (const field of fields) {
      const property = schemas[name]?.properties?.[field]
      if (property) property.nullable = true
    }
  }

  for (const name of ['cocktailIdValidator', 'ingredientIdValidator']) {
    const id = schemas[name]?.properties?.id
    if (id) Object.assign(id, { type: 'integer', minimum: 1 })
  }
  for (const name of ['ingredientId', 'cocktailId']) {
    const id = schemas.addCocktailIngredientValidator?.properties?.[name]
    if (id) Object.assign(id, { minimum: 0, exclusiveMinimum: true })
  }
  for (const name of ['Cocktail', 'Ingredient', 'CocktailIngredient']) {
    const id = schemas[name]?.properties?.id
    if (id) id.type = 'integer'
  }
  for (const name of ['addIngredientValidator', 'updateIngredientValidator']) {
    const photo = schemas[name]?.properties?.photoUrl
    if (photo) photo.format = 'uri'
  }
  const photo = schemas.Ingredient?.properties?.photo_url
  if (photo) photo.format = 'uri'
  if (schemas.Ingredient?.properties) {
    Object.assign(schemas.Ingredient.properties, {
      amount: {
        type: 'number',
        nullable: true,
        example: 50,
        description: 'Ilość składnika, gdy załadowano dane relacji koktajlu.',
      },
      unit: {
        type: 'string',
        nullable: true,
        example: 'ml',
        description: 'Jednostka ilości, gdy załadowano dane relacji koktajlu.',
      },
    })
  }
  const pagination = schemas.paginationValidator?.properties
  for (const name of ['page', 'limit']) {
    if (pagination?.[name]) {
      Object.assign(pagination[name], {
        type: 'integer',
        minimum: 1,
        example: name === 'page' ? 1 : 10,
      })
    }
  }

  // Lucid SimplePaginator uses camelCase metadata and does not return a "page" key.
  const metaExample = paginationMetaExample(1)
  if (schemas.PaginationMeta) {
    schemas.PaginationMeta = {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(metaExample).map(([name, example]) => [
          name,
          {
            type: typeof example === 'number' ? 'integer' : 'string',
            example,
            ...(name === 'nextPageUrl' || name === 'previousPageUrl' ? { nullable: true } : {}),
          },
        ])
      ),
      example: metaExample,
    }
  }

  schemas.ValidationError = {
    type: 'object',
    required: ['errors'],
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          required: ['field', 'rule', 'message'],
          properties: {
            field: { type: 'string' },
            rule: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }
  schemas.NotFoundError = {
    type: 'object',
    description:
      'Odpowiedź JSON dla Accept: application/json. W produkcji zawiera message; w trybie debug struktura Youch może zawierać dodatkowe lub inne pola diagnostyczne.',
    properties: { message: { type: 'string' } },
  }

  const examples = {
    ...schemaExamples,
    ValidationError: {
      errors: [{ field: 'name', rule: 'string', message: 'The name field must be a string' }],
    },
    NotFoundError: { message: 'Row not found' },
  }
  for (const [name, example] of Object.entries(examples)) {
    const schema = schemas[name]
    if (!schema) continue
    // Partial updates still need meaningful examples for every optional field.
    const baseName = name.replace(/^update/, 'add')
    if (name.startsWith('update') && schemaExamples[baseName]) {
      applySchemaExample(schema, schemaExamples[baseName])
    }
    applySchemaExample(schema, example)
  }

  for (const schema of Object.values(schemas)) normalizeSchema(schema, schemas)

  const normalizeContent = (content?: Record<string, MediaType>) => {
    for (const media of Object.values(content ?? {})) {
      if (!media.schema) continue
      normalizeSchema(media.schema, schemas)
      if (media.example !== undefined) {
        media.example = normalizeExample(media.schema, media.example, schemas)
        const object = media.example as { meta?: unknown }
        if (media.schema.properties?.meta?.$ref === '#/components/schemas/PaginationMeta') {
          object.meta = { ...metaExample }
        }
      }
    }
  }
  for (const [path, operations] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(operations)) {
      if (!['get', 'post', 'patch', 'delete'].includes(method)) continue
      const examplesForOperation = operationExamples[`${method.toUpperCase()} ${path}`]
      for (const parameter of operation.parameters ?? []) {
        const schema = parameter.schema
        if (!schema) continue
        if (parameter.in === 'path' && parameter.name === 'id') {
          parameter.required = true
          Object.assign(schema, { type: 'integer', minimum: 1, example: 1 })
        }
        if (parameter.in === 'query') {
          const example = paginationExample[parameter.name as keyof typeof paginationExample]
          if (example !== undefined) schema.example = example
          if (parameter.name === 'page' || parameter.name === 'limit') {
            Object.assign(schema, {
              type: 'integer',
              minimum: 1,
              example: parameter.name === 'page' ? 1 : 10,
              ...(parameter.name === 'limit' ? { maximum: 100 } : {}),
            })
          }
          const choices = pagination?.[parameter.name]?.enum
          if (choices) Object.assign(schema, { type: 'string', enum: choices })
        }
        normalizeSchema(schema, schemas)
      }
      if (operation.requestBody) {
        if (method === 'post') operation.requestBody.required = true
        const media = operation.requestBody.content?.['application/json']
        if (media && examplesForOperation?.request) {
          media.example = structuredClone(examplesForOperation.request)
        }
        normalizeContent(operation.requestBody.content)
        if (path.startsWith('/cocktails')) {
          const note =
            'ID składników w przykładach są umowne. Przed wysłaniem żądania dopasuj je do rekordów z GET /ingredients.'
          if (!operation.description?.includes(note)) {
            operation.description = `${operation.description ?? ''} ${note}`.trim()
          }
        }
      }
      const responses = operation.responses ?? {}
      if (path === '/ingredients/{id}' && method === 'delete') {
        responses['409'] = {
          description: 'Składnik jest używany w koktajlu i nie może zostać usunięty.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'message'],
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              example: {
                code: 'E_RESOURCE_IN_USE',
                message: 'Nie można usunąć zasobu, ponieważ jest używany przez inne rekordy.',
              },
            },
          },
        }
      }
      if (path.startsWith('/cocktails') || path.startsWith('/ingredients')) {
        responses['422'] = {
          description: 'Błąd walidacji danych (Accept: application/json).',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
              example: {
                errors: [
                  {
                    field: path.includes('{id}') ? 'id' : method === 'get' ? 'limit' : 'name',
                    rule: path.includes('{id}') || method === 'get' ? 'number' : 'string',
                    message:
                      path.includes('{id}') || method === 'get'
                        ? 'The field must be a number'
                        : 'The field must be a string',
                  },
                ],
              },
            },
          },
        }
        if (path.includes('{id}')) {
          responses['404'] = {
            description:
              'Nie znaleziono rekordu (Accept: application/json). Format diagnostyczny w trybie debug może się różnić od produkcyjnego.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotFoundError' },
                example: { message: 'Row not found' },
              },
            },
          }
        }
        operation.responses = responses
      }
      for (const response of Object.values(responses)) normalizeContent(response.content)
      if (examplesForOperation) {
        for (const [status, response] of Object.entries(responses)) {
          const media = response.content?.['application/json']
          if (status.startsWith('2') && media) {
            media.example = structuredClone(examplesForOperation.response)
          }
        }
      }
    }
  }
  const responses = document.components.responses
  if (responses?.NotFound) responses.NotFound.description = 'The resource was not found'
  if (responses?.NotAcceptable)
    responses.NotAcceptable.description = 'No acceptable representation is available'
  documentAuth(document)
  return document
}
