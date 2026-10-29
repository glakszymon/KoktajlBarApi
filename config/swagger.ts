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
      'API z przepisami na koktajle — projekt rekrutacyjny do SOLVRO. ' +
      'Zarejestruj konto przez POST /auth/register, a następnie zaloguj się przez POST /auth/login. ' +
      'Skopiuj token.value i wklej sam token (bez prefiksu Bearer) w Authorize → BearerAuth. ' +
      'Token jest ważny 24 godziny. Odczyt koktajli, składników i komentarzy jest publiczny. ' +
      'Zalogowany użytkownik tworzy koktajle i komentarze jako ich autor. ' +
      'Koktajl edytuje lub usuwa jego właściciel albo admin; komentarz usuwa jego autor albo admin. ' +
      'Zapis składników i zmiana ról wymagają roli admin. ' +
      'Rejestracja tworzy konto z rolą user. Przykładowe dane w dokumentacji nie są automatycznie tworzone w bazie.',
  },
  snakeCase: true,

  tagIndex: 1,

  ignore: ['/swagger', '/docs', '/health', '/favicon.ico', '/'],

  preferredPutPatch: 'PATCH',

  common: {
    parameters: {},
    headers: {},
  },

  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      description: 'Token dostępu z token.value odpowiedzi POST /auth/login. Wklej sam token.',
    },
  },
  defaultSecurityScheme: 'BearerAuth',
  authMiddlewares: [],
}
