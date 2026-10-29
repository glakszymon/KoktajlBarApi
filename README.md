# KoktajlBar API

REST API do zarządzania koktajlami i ich składnikami, przygotowane
w ramach zadania rekrutacyjnego.

Aplikacja umożliwia tworzenie, przeglądanie, aktualizowanie i usuwanie
koktajli oraz składników. Obsługuje przypisywanie składników do koktajli
wraz z ilością i jednostką, a także paginację, filtrowanie i sortowanie list.
Uwierzytelnianie korzysta z tokenów Bearer, a uprawnienia z ról `user` i `admin`.
Zalogowani użytkownicy tworzą własne przepisy, komentują je i wystawiają oceny.

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
5. Wywołaj `GET /auth/me`, aby poznać swoje `user.id`. Możesz teraz utworzyć
   koktajl przez `POST /cocktails` i dodać ocenę przez `POST /cocktails/{cocktailId}/comment`.
   Listy koktajli, składników i komentarzy są dostępne również bez logowania;
   w nowej bazie będą puste.

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

### Właściciele wpisów

- `POST /cocktails` przypisuje koktajl do użytkownika z tokena. Odpowiedź zawiera
  `userId` właściciela; porównaj je z `user.id` z `GET /auth/me`.
- Koktajl może edytować i usuwać jego właściciel lub administrator.
  Edycja nie przenosi własności i nie zmienia katalogu składników.
- Komentarz należy do użytkownika, który go dodał, niezależnie od autora koktajlu.
  `userId` komentarza identyfikuje autora, a `cocktailId` oceniany przepis.
- Komentarz może usunąć jego autor lub administrator. Właściciel koktajlu
  nie może usuwać cudzych komentarzy bez roli `admin`.
- Nie przesyłaj `userId`, `user_id`, `cocktailId`, `cocktail_id` ani `params`
  jako sposobu ustalania autora lub przepisu. Autor pochodzi z tokena,
  a oceniany koktajl z adresu. Body zawiera wyłącznie edytowalne pola wpisu.
- Publiczne odpowiedzi zawierają ID autorów, ale nie ich emaile, hasła ani tokeny.

## Endpointy

| Metoda | Ścieżka                               | Działanie                              | Dostęp                       |
| ------ | ------------------------------------- | -------------------------------------- | ---------------------------- |
| POST   | `/auth/register`                      | Rejestracja (`201`)                    | Publiczny                    |
| POST   | `/auth/login`                         | Logowanie (`200`)                      | Publiczny                    |
| GET    | `/auth/me`                            | Dane zalogowanego użytkownika          | `user`, `admin`              |
| POST   | `/auth/logout`                        | Unieważnienie bieżącego tokena (`204`) | `user`, `admin`              |
| GET    | `/ingredients`                        | Lista składników                       | Publiczny                    |
| GET    | `/ingredients/:id`                    | Szczegóły składnika                    | Publiczny                    |
| POST   | `/ingredients`                        | Utworzenie składnika                   | `admin`                      |
| PATCH  | `/ingredients/:id`                    | Aktualizacja składnika                 | `admin`                      |
| DELETE | `/ingredients/:id`                    | Usunięcie składnika                    | `admin`                      |
| GET    | `/cocktails`                          | Lista koktajli                         | Publiczny                    |
| GET    | `/cocktails/:id`                      | Szczegóły koktajlu                     | Publiczny                    |
| POST   | `/cocktails`                          | Utworzenie własnego koktajlu (`201`)   | `user`, `admin`              |
| PATCH  | `/cocktails/:id`                      | Aktualizacja koktajlu                  | Właściciel lub `admin`       |
| DELETE | `/cocktails/:id`                      | Usunięcie koktajlu                     | Właściciel lub `admin`       |
| POST   | `/cocktails/:cocktailId/comment`      | Dodanie komentarza i oceny (`201`)     | `user`, `admin`              |
| GET    | `/cocktails/:cocktailId/comments`     | Lista komentarzy koktajlu              | Publiczny                    |
| GET    | `/cocktails/:cocktailId/comments/:id` | Szczegóły komentarza                   | Publiczny                    |
| DELETE | `/cocktails/:cocktailId/comments/:id` | Usunięcie komentarza i oceny           | Autor komentarza lub `admin` |
| PATCH  | `/users/:id/role`                     | Zmiana roli innego użytkownika         | `admin`                      |

Dokumentacja `/docs` i `/swagger` jest publiczna. Każdy endpoint oznaczony rolą
wymaga poprawnego tokena Bearer.

## Filtrowanie listy koktajli

`GET /cocktails` jest publiczny i zwraca obiekt `{ "data": [...], "meta": {...} }`.
Wszystkie parametry są opcjonalne:

| Parametr | Znaczenie |
| --- | --- |
| `userId` | ID autora: dodatnia liczba całkowita. Dla własnych koktajli użyj `user.id` z `GET /auth/me`. |
| `category` | Dokładne dopasowanie kategorii, np. `Long Drink`. |
| `alcohol` | `true`: przynajmniej jeden składnik alkoholowy; `false`: brak składników alkoholowych, również koktajle bez składników. |
| `ingredientIds` | Od 1 do 50 dodatnich całkowitych ID składników oddzielonych przecinkami, np. `2,5`. Koktajl musi zawierać **wszystkie** wskazane składniki (AND), ale może mieć dodatkowe. |
| `page` | Dodatnia liczba całkowita, domyślnie `1`. |
| `limit` | Liczba całkowita od `1` do `100`, domyślnie `10`. |
| `sortBy` | `id`, `name`, `category`, `created` lub `updated`, domyślnie `id`. |
| `sortOrder` | `asc` lub `desc`, domyślnie `asc`. |

Filtry można łączyć znakiem `&`. Wynik musi spełniać **wszystkie podane warunki**.
Pominięte filtry nie ograniczają wyników. Filtrowanie następuje przed paginacją;
`meta.total` uwzględnia filtry, a linki do kolejnych stron zachowują filtry,
limit i sortowanie. Każdy zwrócony koktajl zawiera wszystkie swoje składniki,
także te niewymienione w `ingredientIds`.

Przykłady:

```http
GET /cocktails?userId=5
GET /cocktails?ingredientIds=2,5
GET /cocktails?userId=5&ingredientIds=2,5&alcohol=true&category=Long%20Drink&sortBy=name&sortOrder=asc&page=1&limit=10
```

Ostatni przykład wybiera alkoholowe koktajle autora `5` z kategorii `Long Drink`,
zawierające składnik `2` **i** składnik `5`, posortowane rosnąco po nazwie.
ID składników dobierz z `GET /ingredients`. W Swagger UI wpisz w polu
`ingredientIds` tekst `2,5`, bez nawiasów tablicy ani cudzysłowów.

Powtórzenia w `ingredientIds` są usuwane: `2,5,2` działa jak `2,5`.
Białe znaki na brzegach listy są usuwane, ale spacje wewnątrz, pusta wartość,
zera, liczby ujemne, ułamki, puste elementy i ponad 50 ID są odrzucane (`422`).
Niepoprawny `userId`, np. `abc`, `0` lub `1.5`, również daje `422`.
Poprawne, lecz nieistniejące ID autora lub któregokolwiek wymaganego składnika
zwraca `200` z pustą listą i `meta.total: 0`. Tak samo działa brak dopasowań.

## Komentarze i oceny

Dodawanie używa ścieżki **`/comment` (liczba pojedyncza)**, a odczyt i usuwanie
ścieżki **`/comments`**. API nie udostępnia aktualizacji komentarza.

Body dodawania komentarza:

```json
{
  "rating": 5,
  "content": "Bardzo dobry przepis."
}
```

- `rating` jest wymagane: liczba całkowita JSON od 1 do 5, np. `5`, a nie `"5"`.
- `content` jest opcjonalne i może mieć wartość `null`. Tekst jest przycinany
  i musi mieć od 1 do 500 znaków; same białe znaki są odrzucane.
- Można wystawić samą ocenę, wysyłając `{"rating":5}`.
- Ten sam użytkownik może dodać wiele ocen jednego koktajlu oraz oceniać własny przepis.
  Każdy komentarz wnosi osobną ocenę do średniej.
- Dodanie lub usunięcie komentarza przelicza `rating` koktajlu jako średnią
  wszystkich jego ocen. Brak ocen oznacza `rating: null`.
- Usunięcie koktajlu usuwa także jego komentarze i powiązania ze składnikami,
  pozostawiając same składniki w katalogu.

Przykład (zastąp `1` ID istniejącego koktajlu, a `TOKEN` wynikiem logowania):

```bash
curl -X POST http://localhost:3333/cocktails/1/comment \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rating":5,"content":"Bardzo dobry przepis."}'
```

Odpowiedź `201`:

```json
{
  "id": 1,
  "cocktailId": 1,
  "userId": 2,
  "rating": 5,
  "content": "Bardzo dobry przepis.",
  "createdAt": "2026-10-29T12:00:00.000+00:00",
  "updatedAt": "2026-10-29T12:00:00.000+00:00"
}
```

### Lista i usuwanie komentarzy

`GET /cocktails/1/comments?page=1&limit=10&sortBy=id&sortOrder=desc`
zwraca obiekt `{ "data": [...], "meta": {...} }`:

- `page`: dodatnia liczba całkowita, domyślnie `1`;
- `limit`: liczba całkowita od `1` do `100`, domyślnie `10`;
- `sortBy`: `id`, `rating`, `createdAt` lub `updatedAt`, domyślnie `id`;
- `sortOrder`: `asc` lub `desc`, domyślnie `desc`.

Remisy rozstrzyga `id` w tym samym kierunku. Linki w `meta` zachowują parametry
listy. Istniejący koktajl bez komentarzy zwraca pustą listę i `total: 0`;
nieistniejący koktajl zwraca `404`.

`DELETE /cocktails/1/comments/1` wymaga tokena autora komentarza lub administratora,
nie wymaga body i zwraca `200` z `{"id":1}`. Komentarz nieprzypisany do koktajlu
ze ścieżki zwraca `404`.

**Aktualne zachowanie szczegółów komentarza:**
`GET /cocktails/:cocktailId/comments/:id` wyszukuje tylko po `id` komentarza.
Nie waliduje `cocktailId` ani nie sprawdza jego zgodności z komentarzem.
Lista komentarzy oraz operacja usuwania sprawdzają przypisanie do koktajlu.

### Alkoholowość koktajlu

Pole `alcohol` jest wyliczane ze składników. Koktajl jest alkoholowy, jeśli
choć jeden składnik ma `alcohol: true`. Filtr `/cocktails?alcohol=false` wybiera
koktajle bez alkoholowych składników, również koktajle bez składników.

### Kody błędów

Wysyłaj `Accept: application/json`, aby otrzymywać odpowiedzi JSON.

| Status | Znaczenie                                                                                 |
| ------ | ----------------------------------------------------------------------------------------- |
| `400`  | Nieprawidłowy email lub hasło podczas logowania                                           |
| `401`  | Brak tokena lub token nieprawidłowy, wygasły albo unieważniony                            |
| `403`  | Brak wymaganej roli, próba zmiany cudzego wpisu bez uprawnień lub zmiany własnej roli     |
| `404`  | Nie znaleziono zasobu                                                                     |
| `409`  | Próba usunięcia składnika używanego w koktajlu                                            |
| `422`  | Błąd walidacji danych, np. zajęty email, niezgodne potwierdzenie hasła lub niepoprawne ID |

Błędy walidacji zawierają tablicę `errors` z polami `field`, `rule` i `message`.
W komentarzach błędne parametry ścieżki mają nazwy `params.cocktailId` i `params.id`
(dodawanie, lista, usuwanie); szczegóły komentarza walidują tylko pole `id`.
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
- Serwisy zawierają logikę operacji na koktajlach, składnikach i komentarzach.
- Modele Lucid opisują dane i relacje.
- Migracje pozwalają odtworzyć strukturę bazy.
- Relacja koktajli ze składnikami przechowuje dodatkowo ilość i jednostkę.
- Middleware `auth` weryfikuje token, a middleware `role` uprawnienia administratora.
- Kontroler koktajli sprawdza właściciela przy edycji i usuwaniu; serwis komentarzy
  sprawdza autora przy usuwaniu i przelicza średnią ocen w transakcji.
- Kontrakty OpenAPI pochodzą z adnotacji kontrolerów i walidatorów;
  `config/openapi.ts`, `config/openapi_auth.ts` i `config/openapi_comments.ts`
  uzupełniają ograniczenia generatora, schematy odpowiedzi i zasady dostępu.
