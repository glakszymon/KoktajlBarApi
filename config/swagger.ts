// config/swagger.ts
import path from 'node:path'
import url from 'node:url'

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',

  // debug: true,

  info: {
    title: 'Koktajl Bar Api',
    version: '1.0.0',
    description:
      'Oficjalna dokumentacja api z przepisami na koktajle. Projektu rekrutacyjnego do SOLVRO.',
  },
  snakeCase: true,

  tagIndex: 1,

  ignore: ['/swagger', '/docs', '/health', '/favicon.ico', '/'],

  preferredPutPatch: 'PATCH',

  common: {
    parameters: {},
    headers: {},
  },

  securitySchemes: {},
  defaultSecurityScheme: undefined,
  authMiddlewares: [],
}
