# __order__.md
# Kolejność i zależności migracji bazy danych.
# Każda nowa migracja dostaje kolejny numer (004, 005...).
# Nie zmieniaj numeru ani zawartości pliku który był już wykonany na bazie.

| Plik | Właściciel | Zależy od |
|------|-----------|-----------|
| 001_core.sql | Osoba A | — |
| 002_scores_stats.sql | Osoba B | 001 |
| 003_realtime_achievements.sql | Osoba C | 001 |
