# Testkonzept GamesLibrary

Stand: erste Fassung, Meilenstein 1 (Auftrag 5.2, 22.11.2026).
Noch offen bis zur Schlussabgabe: Rollen, Infrastruktur, Testfallerstellung, Testfalldurchführung, Fehlerbehandlung.

## 1. Teststrategie

### Testobjekt

Testobjekt ist die GamesLibrary (Stand Handout `bbw-md/GamesLibraryHandout`):

| Teil | Technologie | Maven-Ordner | Im CI |
|---|---|---|---|
| Backend | Spring Boot, REST-API `/api/games`, `/api/steam`, H2-In-Memory | `backend` | ja |
| Frontend | React mit TypeScript, Cypress-E2E | – (kein Maven-Wrapper) | nein |

Abzudeckende Funktionen:

| Funktion | Ort |
|---|---|
| Spiele auflisten, einzeln laden | `GameService.getAllGames`, `getGameById` |
| Titelsuche (case-insensitive) | `GameService.searchByTitle` |
| Spiel erstellen, ändern, löschen | `GameService.createGame`, `updateGame`, `deleteGame` |
| Titel einheitlich speichern | `TitleNormalizer.normalize` |
| Validierung: Titel Pflicht, Datum Pflicht und nicht in der Zukunft | `Game` (Bean Validation) |
| Steam-Import (Proxy auf die Steam Store API) | `SteamController` |

### Risiken

| Risiko | Auswirkung | Wahrscheinlichkeit | Teststufe |
|---|---|---|---|
| Ändern oder Löschen einer nicht vorhandenen ID zerstört Daten oder liefert 500 | hoch | mittel | Unit (`GameServiceTest`), später Controller |
| Titel uneinheitlich gespeichert (Leerzeichen, Kleinschreibung, leer) | mittel | hoch | Unit (`TitleNormalizerTest`) |
| Kaputter Stand wird gepusht und fällt erst Tage später auf | hoch | mittel | Pipeline (jeder Push) |
| Steam-API nicht erreichbar oder verändert | mittel | mittel | später Controller-Test mit Mock |

### Teststufen

| Stufe | Werkzeug | Was | Stand |
|---|---|---|---|
| Unit | JUnit 5, Mockito | `GameService` mit gemocktem `GameRepository`; `TitleNormalizer` | vorhanden |
| Integration | `@SpringBootTest`, H2 | Service mit echter Datenbank | ab 5.3 |
| Schnittstelle | `@WebMvcTest`/MockMvc, Postman | REST-Endpunkte, Statuscodes | ab 6.1/6.2 |
| System/E2E | Cypress | UI-Abläufe im Browser | vorhanden (lokal, nicht im CI) |

## 4. Entwicklungsvorgehen

- **TDD**: Neues Verhalten entsteht in Zyklen rot – grün – refactor. Pro Zyklus ein Commit `rot: …` (nur der Test, Lauf rot) und ein Commit `grün: …` (Umsetzung, alle Tests grün). Beispiel: `TitleNormalizer` auf dem Branch `feature/title-normalizer`.
- **Branches und Pull Requests**: Arbeit auf einem Feature-Branch, Merge nach `main` über einen Pull Request.
- **Pipeline** (`.github/workflows/ci.yml`): Bei jedem Push und Pull Request führt GitHub Actions `./mvnw -B test` für jeden Maven-Ordner der Matrix aus (aktuell `backend`, JDK 26).
- **Deploy nur bei grünen Tests**: Der Job `deploy` hat `needs: test` und startet nur, wenn alle Test-Jobs grün sind. Vorerst ist er ein Platzhalter (`echo "deploy"`).
