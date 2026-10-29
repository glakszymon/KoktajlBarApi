import type { Operation, Schema } from './openapi.js'
import { paginationMetaExample } from './openapi_examples.js'

/** Path params belong in the URL, not in the JSON body generated from Vine validators. */
export function documentComments(document: {
  components: { schemas: Record<string, Schema> }
  paths?: Record<string, Record<string, Operation>>
}) {
  const schemas = document.components.schemas
  const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
  const json = (schema: Schema, example?: unknown) => ({
    'application/json': { schema, ...(example === undefined ? {} : { example }) },
  })
  const example = {
    id: 1,
    cocktailId: 1,
    userId: 2,
    rating: 5,
    content: 'Bardzo dobry przepis.',
    createdAt: '2026-10-29T12:00:00.000+00:00',
    updatedAt: '2026-10-29T12:00:00.000+00:00',
  }
  schemas.Comment = {
    type: 'object',
    required: Object.keys(example),
    properties: {
      id: { type: 'integer', minimum: 1 },
      cocktailId: { type: 'integer', minimum: 1, description: 'ID ocenianego koktajlu.' },
      userId: {
        type: 'integer',
        minimum: 1,
        description: 'ID autora komentarza ustalane z tokena Bearer.',
      },
      rating: { type: 'integer', minimum: 1, maximum: 5 },
      content: { type: 'string', nullable: true, minLength: 1, maxLength: 500 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    example,
  }
  schemas.addCommentValidator = {
    type: 'object',
    required: ['rating'],
    properties: {
      rating: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        description:
          'Liczba JSON, nie tekst. Każdy komentarz wnosi jedną ocenę do średniej koktajlu.',
      },
      content: {
        type: 'string',
        nullable: true,
        minLength: 1,
        maxLength: 500,
        description:
          'Opcjonalna treść. Pominięcie lub null oznacza samą ocenę. Same białe znaki są odrzucane.',
      },
    },
    example: { rating: 5, content: example.content },
  }

  for (const [path, methods] of Object.entries(document.paths ?? {})) {
    if (!/\/comments?(\/|$)/.test(path)) continue
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'delete'].includes(method)) continue
      const responses = (operation.responses ??= {})
      const list = method === 'get' && path.endsWith('/comments')
      for (const parameter of operation.parameters ?? []) {
        if (parameter.in === 'path') {
          parameter.required = true
          parameter.schema = { type: 'integer', minimum: 1, example: 1 }
        }
        if (list && parameter.in === 'query' && parameter.name === 'sortBy') {
          parameter.schema = {
            type: 'string',
            enum: ['id', 'rating', 'createdAt', 'updatedAt'],
            example: 'id',
          }
        }
        if (list && parameter.in === 'query' && parameter.name === 'sortOrder') {
          parameter.schema = { type: 'string', enum: ['asc', 'desc'], example: 'desc' }
        }
      }
      const status = method === 'post' ? '201' : '200'
      responses[status] = {
        description:
          method === 'delete'
            ? 'Usunięto komentarz i przeliczono średnią ocen.'
            : list
              ? 'Komentarze wskazanego koktajlu z paginacją.'
              : 'Komentarz z oceną i ID autora.',
        content: json(
          method === 'delete'
            ? {
                type: 'object',
                required: ['id'],
                properties: { id: { type: 'integer', minimum: 1 } },
              }
            : list
              ? {
                  type: 'object',
                  required: ['data', 'meta'],
                  properties: {
                    data: { type: 'array', items: ref('Comment') },
                    meta: ref('PaginationMeta'),
                  },
                }
              : ref('Comment'),
          method === 'delete'
            ? { id: 1 }
            : list
              ? {
                  data: [example],
                  meta: {
                    ...paginationMetaExample(1),
                    firstPageUrl: '/cocktails/1/comments?limit=10&sortBy=id&sortOrder=desc&page=1',
                    lastPageUrl: '/cocktails/1/comments?limit=10&sortBy=id&sortOrder=desc&page=1',
                  },
                }
              : example
        ),
      }
      if (method === 'post') {
        operation.requestBody = {
          required: true,
          content: json(ref('addCommentValidator'), schemas.addCommentValidator.example),
        }
      } else {
        delete operation.requestBody
      }
      responses['404'] = {
        description:
          method === 'delete'
            ? 'Nie znaleziono koktajlu lub komentarza należącego do tego koktajlu.'
            : list || method === 'post'
              ? 'Nie znaleziono koktajlu.'
              : 'Nie znaleziono komentarza (wyszukiwanie tylko po id komentarza).',
        content: json(ref('NotFoundError')),
      }
      const field =
        method === 'post'
          ? 'rating'
          : list
            ? 'params.cocktailId'
            : method === 'delete'
              ? 'params.id'
              : 'id'
      responses['422'] = {
        description:
          'Błąd walidacji. Parametry ścieżki mają w errors.field prefiks params. przy dodawaniu, listowaniu i usuwaniu; odczyt pojedynczego komentarza używa pola id.',
        content: json(ref('ValidationError'), {
          errors: [{ field, rule: 'number', message: `The ${field} field must be a number` }],
        }),
      }
    }
  }
}
