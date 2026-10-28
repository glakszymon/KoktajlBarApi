# KoktajlBar API

REST API do zarządzania koktajlami i ich składnikami, przygotowane
w ramach zadania rekrutacyjnego.

Aplikacja umożliwia tworzenie, przeglądanie, aktualizowanie i usuwanie
koktajli oraz składników. Obsługuje przypisywanie składników do koktajli
wraz z ilością i jednostką, a także paginację, filtrowanie i sortowanie list.
Uwierzytelnianie korzysta z tokenów Bearer, a uprawnienia z ról `user` i `admin`.

## Technologie

- TypeScript
- AdonisJS 7
- Lucid ORM
- MariaDB
- VineJS — walidacja danych
- Swagger UI / OpenAPI — dokumentacja API
- ESLint i Prettier

## Wymagania

- Node.js 24 lub nowszy
- npm 11 lub nowszy
- MariaDB 11.8.6 — wersja używana podczas tworzenia projektu
- Git

## Uruchomienie lokalne

### 1. Pobierz projekt i zainstaluj zależności

```bash
git clone https://github.com/glakszymon/KoktajlBarApi.git
cd KoktajlBarApi
npm ci
```

### 2. Przygotuj konfigurację środowiska

```bash
cp .env.example .env
```

### 3. Przygotuj bazę danych

Utwórz pustą bazę oraz użytkownika mającego uprawnienia do wykonywania
migracji i operacji na danych. Ustaw w `.env` parametry połączenia:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=koktajl
DB_PASSWORD=local_example_password
DB_DATABASE=koktajl_bar
```

### 4. Wygeneruj klucz aplikacji

```bash
node ace generate:key
```

### 5. Wykonaj migracje

```bash
node ace migration:run
```

### 6. Uruchom aplikację

```bash
npm run dev
```

API jest dostępne pod http://localhost:3333. Migracje tworzą strukturę bazy;
projekt nie zawiera jeszcze seedera danych demonstracyjnych ani gotowych kont.

## Dokumentacja API

Po uruchomieniu aplikacji:

- Swagger UI: http://localhost:3333/docs
- Specyfikacja OpenAPI w YAML: http://localhost:3333/swagger

### Pierwsze wywołanie w Swagger UI

1. Otwórz `/docs` i wykonaj `POST /auth/register`, używając przykładu z dokumentacji
   lub własnych danych. Rejestracja wymaga `password_confirmation` identycznego z hasłem.
2. Wykonaj `POST /auth/login` z tym samym emailem i hasłem.
3. Skopiuj wartość `token.value` z odpowiedzi.
4. Kliknij **Authorize**, w polu **BearerAuth** wklej **sam token, bez `Bearer`**,
   i zatwierdź. Swagger doda nagłówek `Authorization: Bearer <token>`.
5. Wywołaj `GET /auth/me`, a następnie `GET /ingredients` lub `GET /cocktails`.
   W nowej bazie listy będą puste.

Przykłady w Swaggerze opisują format danych; nie tworzą kont ani rekordów w bazie.
ID w przykładach koktajli zastąp ID istniejących składników z `GET /ingredients`.

## Uwierzytelnianie i uprawnienia

Rejestracja tworzy konto z rolą `user` i nie loguje automatycznie.
Hasło musi mieć od 15 do 128 znaków. Email jest zapisywany małymi literami
po usunięciu spacji na brzegach i musi być unikalny.

Token zwracany przez logowanie jest ważny **24 godziny**. Każde logowanie tworzy
osobny token. `POST /auth/logout` unieważnia wyłącznie token użyty w tym żądaniu
i zwraca `204` bez body. Po wylogowaniu usuń go również z **Authorize**.

To tokeny dostępu przechowywane po stronie serwera, nie JWT. Do korzystania
z chronionych endpointów używaj nagłówka Bearer; cookie sesyjne nie zastępuje tokena.

### Przykład z curl

Rejestracja:

```bash
curl -X POST http://localhost:3333/auth/register \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"name":"Jan Kowalski","email":"jan@example.com","password":"Przykladowe-haslo-123!","password_confirmation":"Przykladowe-haslo-123!"}'
```

Logowanie:

```bash
curl -X POST http://localhost:3333/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"email":"jan@example.com","password":"Przykladowe-haslo-123!"}'
```

Odpowiedź `200` ma strukturę:

```json
{
  "token": {
    "type": "bearer",
    "value": "TOKEN_Z_ODPOWIEDZI_LOGOWANIA",
    "expiresAt": "2026-10-29T12:00:00.000Z"
  },
  "user": {
    "id": 1,
    "name": "Jan Kowalski",
    "email": "jan@example.com"
  }
}
```

Ustaw zmienną na rzeczywistą wartość `token.value`, a następnie wykonaj żądanie:

```bash
TOKEN='TOKEN_Z_ODPOWIEDZI_LOGOWANIA'
curl http://localhost:3333/auth/me \
  -H 'Accept: application/json' \
  -H "Authorization: Bearer $TOKEN"
```

Rejestracja i `/auth/me` zwracają obiekt `user` z `id`, `name` i `email`.
Odpowiedzi rejestracji, logowania i `/auth/me` nie zawierają roli ani hasła.

### Pierwszy administrator w środowisku lokalnym

Zarejestruj konto, a następnie w swojej lokalnej bazie MariaDB nadaj mu rolę:

```sql
UPDATE users SET role = 'admin' WHERE email = 'jan@example.com';
```

Kolejnych administratorów można wyznaczać przez `PATCH /users/:id/role`,
wysyłając token administratora i body `{"role":"admin"}` lub `{"role":"user"}`.
ID pochodzi ze ścieżki — nie dodawaj `params` do JSON-a.
Administrator nie może zmienić własnej roli przez ten endpoint.

## Endpointy

| Metoda | Ścieżka            | Działanie                              | Dostęp          |
| ------ | ------------------ | -------------------------------------- | --------------- |
| POST   | `/auth/register`   | Rejestracja (`201`)                    | Publiczny       |
| POST   | `/auth/login`      | Logowanie (`200`)                      | Publiczny       |
| GET    | `/auth/me`         | Dane zalogowanego użytkownika          | `user`, `admin` |
| POST   | `/auth/logout`     | Unieważnienie bieżącego tokena (`204`) | `user`, `admin` |
| GET    | `/ingredients`     | Lista składników                       | `user`, `admin` |
| GET    | `/ingredients/:id` | Szczegóły składnika                    | `user`, `admin` |
| POST   | `/ingredients`     | Utworzenie składnika                   | `admin`         |
| PATCH  | `/ingredients/:id` | Aktualizacja składnika                 | `admin`         |
| DELETE | `/ingredients/:id` | Usunięcie składnika                    | `admin`         |
| GET    | `/cocktails`       | Lista koktajli                         | `user`, `admin` |
| GET    | `/cocktails/:id`   | Szczegóły koktajlu                     | `user`, `admin` |
| POST   | `/cocktails`       | Utworzenie koktajlu                    | `admin`         |
| PATCH  | `/cocktails/:id`   | Aktualizacja koktajlu                  | `admin`         |
| DELETE | `/cocktails/:id`   | Usunięcie koktajlu                     | `admin`         |
| PATCH  | `/users/:id/role`  | Zmiana roli innego użytkownika         | `admin`         |

Dokumentacja `/docs` i `/swagger` jest publiczna. Każdy endpoint oznaczony rolą
wymaga poprawnego tokena Bearer.

### Kody błędów

Wysyłaj `Accept: application/json`, aby otrzymywać odpowiedzi JSON.

| Status | Znaczenie                                                                                 |
| ------ | ----------------------------------------------------------------------------------------- |
| `400`  | Nieprawidłowy email lub hasło podczas logowania                                           |
| `401`  | Brak tokena lub token nieprawidłowy, wygasły albo unieważniony                            |
| `403`  | Brak wymaganej roli lub próba zmiany własnej roli                                         |
| `404`  | Nie znaleziono zasobu                                                                     |
| `409`  | Próba usunięcia składnika używanego w koktajlu                                            |
| `422`  | Błąd walidacji danych, np. zajęty email, niezgodne potwierdzenie hasła lub niepoprawne ID |

Błędy walidacji zawierają tablicę `errors` z polami `field`, `rule` i `message`.
Odmowa dostępu przez middleware roli zawiera `message`.
Format pozostałych błędów diagnostycznych może różnić się między trybem
development i production.

## Sprawdzenie jakości kodu

```bash
npm run lint
npm run typecheck
npm run build
```

Testy uruchamiaj przez `npm test` po przygotowaniu **osobnej, pustej bazy testowej**
i ustawieniu jej połączenia w `.env.test`. Pozostałe zmienne są pobierane z `.env`.
Bootstrap testów wykonuje migracje; testy tworzą i usuwają własne dane,
dlatego nie wskazuj bazy z danymi do ręcznego sprawdzania API.

## Struktura i decyzje projektowe

- Kontrolery odpowiadają za obsługę HTTP i wywołanie walidacji.
- Serwisy zawierają logikę operacji na koktajlach i składnikach.
- Modele Lucid opisują dane i relacje.
- Migracje pozwalają odtworzyć strukturę bazy.
- Relacja koktajli ze składnikami przechowuje dodatkowo ilość i jednostkę.
- Middleware `auth` weryfikuje token, a middleware `role` uprawnienia administratora.
- Kontrakty OpenAPI pochodzą z adnotacji kontrolerów i walidatorów;
  `config/openapi.ts` i `config/openapi_auth.ts` uzupełniają ograniczenia generatora.
