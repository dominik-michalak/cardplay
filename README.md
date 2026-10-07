# CardPlay

Webowa platforma do gier karcianych dla wielu graczy (War, Macao, Texas Clinch, Poker).

---

## Struktura repozytorium

```
cardplay/
├── shared/          # @cardplay/shared — typy i kontrakty
├── server/          # @cardplay/server — Node.js + Express + Socket.IO
├── client/          # @cardplay/client — React + Vite
├── docker-compose.yml
├── .env.example
└── package.json     # root workspace
```

---

## Szybki start (pierwsze uruchomienie)

### 1. Wymagania

| Narzędzie | Wersja |
|-----------|--------|
| Node.js   | 20+    |
| npm       | 10+    |
| Docker    | 24+    |
| Docker Compose | 2.x |

### 2. Sklonuj i zainstaluj

```bash
git clone <repo-url> cardplay
cd cardplay
cp .env.example .env          # uzupełnij wartości
npm install                   # instaluje wszystkie workspace'y
```

### 3. Zbuduj /shared

```bash
cd shared && npm run build && cd ..
```

### 4. Uruchom bazę danych (Docker)

```bash
docker compose up db -d
# Poczekaj chwilę na start PostgreSQL, potem sprawdź:
docker compose logs db --tail=20
```

### 5. Wykonaj migracje i seed

```bash
npm run db:migrate   # tworzy tabele
npm run db:seed      # tworzy użytkowników testowych (hasło: Test1234!)
```

### 6. Uruchom serwer i klienta

```bash
npm run dev          # startuje server + client równolegle
```

- **Frontend:** http://localhost:5173  
- **Backend API:** http://localhost:3000/api/v1  
- **Health check:** http://localhost:3000/health  

### Konta testowe

| Login | Hasło | Rola |
|-------|-------|------|
| admin@cardplay.local | Test1234! | admin |
| moderator@cardplay.local | Test1234! | moderator |
| alice@cardplay.local | Test1234! | user |
| bob@cardplay.local | Test1234! | user |

---

## Podział pracy

| Osoba | Moduły |
|-------|--------|
| **A** | Auth, Users, War, Lobby, Layout, design system |
| **B** | Macao, Scores, Elo, Leaderboard, Profile |
| **C** | Texas Clinch, Poker, Rooms, Matchmaking, Achievements, Moderation |

---

## Zasady pracy z Git

```
main              — stabilna wersja; merge tylko przez PR
dev/osoba-a       — gałąź osoby A
dev/osoba-b       — gałąź osoby B
dev/osoba-c       — gałąź osoby C
```

### Konwencja commitów

```
feat(auth): dodaj rejestrację użytkownika
feat(war): silnik gry — podział talii i rundy
fix(macao): poprawka kary za waleta
chore(shared): dodaj typ GameResult
docs(contract): zaktualizuj zdarzenia Socket.IO
test(poker): testy evaluatora układów
```

### Pliki chronione (tylko przez osobny PR)

```
/shared/src/**
/client/src/games/registry.ts
/client/src/app/routes.tsx
/client/src/styles/design-tokens.css
/server/src/socket/index.ts
/server/src/db/migrations/001_core.sql
/docker-compose.yml
```

---

## Kolejność mergowania

```
Etap 1: wspólna baza (ten commit)
  └─ PR A: auth + JWT + middleware
     └─ PR B: migracja scores + seed danych
     └─ PR C: migracja realtime + matchmaking szkielet

Etap 2 (równolegle):
  A: War engine + frontend
  B: Macao + ranking + profil
  C: Pokoje + Texas Clinch + Poker

Etap 3: integracja
  C merguje rooms/matchmaking → B podłącza scores → A,B,C podłączają gry

Etap 4: testy + dokumentacja
```

---

## Testy

```bash
npm test                        # wszystkie
npm test --workspace=server     # tylko backend
```

---

## Zmienne środowiskowe

Patrz `.env.example` — każda zmienna jest opatrzona komentarzem.

---

## CI / GitHub Actions

Każdy push i każdy PR uruchamia 4 niezależne joby:

| Job | Co sprawdza | Kiedy faila |
|-----|------------|-------------|
| **Lint** | ESLint na całym projekcie | błąd składni, nieużywane zmienne |
| **Typecheck** | `tsc --noEmit` na server + client | niezgodność typów z `/shared` |
| **Test** | Jest — smoke testy + testy jednostkowe | złamany silnik gry, błędna logika |
| **Build** | Pełny produkcyjny build | cokolwiek nie kompiluje się do `dist/` |

Job **Build** startuje dopiero gdy Lint + Typecheck + Test przejdą ✓

### Pierwsze uruchomienie repozytorium

```bash
# 1. Utwórz repo na github.com (bez README, bez .gitignore)
# 2. W katalogu projektu:

git init
git add .
git commit -m "chore: baza startowa CardPlay"
git branch -M main
git remote add origin https://github.com/<twoj-login>/cardplay.git
git push -u origin main

# 3. Utwórz gałęzie dla każdej osoby:
git checkout -b dev/osoba-a && git push -u origin dev/osoba-a
git checkout main
git checkout -b dev/osoba-b && git push -u origin dev/osoba-b
git checkout main
git checkout -b dev/osoba-c && git push -u origin dev/osoba-c
git checkout main

# 4. Ustaw Branch Protection na main (patrz .github/BRANCH_PROTECTION.md)
```

### Workflow każdej osoby

```bash
git checkout dev/osoba-X
git pull origin main          # zawsze sync przed pracą
# ... pisz kod ...
git add .
git commit -m "feat(war): silnik gry — podział talii"
git push origin dev/osoba-X
# Otwórz Pull Request na GitHub: dev/osoba-X → main
# CI odpali się automatycznie
```
