# KoktajlBar API

REST API do zarządzania koktajlami i ich składnikami, przygotowane
w ramach zadania rekrutacyjnego.

Aplikacja umożliwia tworzenie, przeglądanie, aktualizowanie i usuwanie
koktajli oraz składników. Obsługuje przypisywanie składników do koktajli
wraz z ilością i jednostką, a także paginację, filtrowanie i sortowanie list.

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
## Dokumentacja API

Po uruchomieniu aplikacji:

- Swagger UI: http://localhost:3333/docs
- Specyfikacja OpenAPI w YAML: http://localhost:3333/swagger

## Endpointy

| Metoda | Ścieżka | Działanie |
|---|---|---|
| GET | `/ingredients` | Lista składników |
| GET | `/ingredients/:id` | Szczegóły składnika |
| POST | `/ingredients` | Utworzenie składnika |
| PATCH | `/ingredients/:id` | Aktualizacja składnika |
| DELETE | `/ingredients/:id` | Usunięcie składnika |
| GET | `/cocktails` | Lista koktajli |
| GET | `/cocktails/:id` | Szczegóły koktajlu |
| POST | `/cocktails` | Utworzenie koktajlu |
| PATCH | `/cocktails/:id` | Aktualizacja koktajlu |
| DELETE | `/cocktails/:id` | Usunięcie koktajlu |

## Struktura i decyzje projektowe

- Kontrolery odpowiadają za obsługę HTTP i wywołanie walidacji.
- Serwisy zawierają logikę operacji na koktajlach i składnikach.
- Modele Lucid opisują dane i relacje.
- Migracje pozwalają odtworzyć strukturę bazy.
- Relacja koktajli ze składnikami przechowuje dodatkowo ilość i jednostkę.
