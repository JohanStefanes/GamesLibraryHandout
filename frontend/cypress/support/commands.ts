// ***********************************************************
// Globale, benutzerdefinierte Cypress-Commands für die
// GamesLibrary E2E-Tests.
// ***********************************************************

/**
 * Öffnet die Anwendung und wartet, bis der initiale
 * GET /api/games-Aufruf abgeschlossen ist (Spiele geladen).
 */
Cypress.Commands.add('visitApp', () => {
  cy.intercept('GET', '/api/games').as('getGames');
  cy.visit('/');
  cy.wait('@getGames');
});

/**
 * Öffnet das "Add Game"-Formular über den Header-Button.
 */
Cypress.Commands.add('openAddGameForm', () => {
  cy.get('.home-page__add-btn').click();
  cy.get('.game-form').should('be.visible');
});

/**
 * Füllt das Spiel-Formular mit den übergebenen Werten aus.
 * Felder, die nicht übergeben werden, bleiben unverändert.
 */
Cypress.Commands.add('fillGameForm', (game: {
  title?: string;
  description?: string;
  imageUrl?: string;
  releaseDate?: string;
}) => {
  if (game.title !== undefined) {
    cy.get('.game-form input[name="title"]').clear();
    if (game.title) cy.get('.game-form input[name="title"]').type(game.title);
  }
  if (game.description !== undefined) {
    cy.get('.game-form textarea[name="description"]').clear();
    if (game.description) cy.get('.game-form textarea[name="description"]').type(game.description);
  }
  if (game.imageUrl !== undefined) {
    cy.get('.game-form input[name="imageUrl"]').clear();
    if (game.imageUrl) cy.get('.game-form input[name="imageUrl"]').type(game.imageUrl);
  }
  if (game.releaseDate !== undefined) {
    cy.get('.game-form input[name="releaseDate"]').clear();
    if (game.releaseDate) cy.get('.game-form input[name="releaseDate"]').type(game.releaseDate);
  }
});

/**
 * Löscht ein Spiel anhand seines Titels direkt über die API.
 * Wird für die Aufräumarbeiten nach Tests verwendet, damit die
 * Datenbank zwischen Testläufen sauber bleibt.
 */
Cypress.Commands.add('deleteGameByTitle', (title: string) => {
  cy.request('GET', '/api/games').then((res) => {
    const match = (res.body as Array<{ id: number; title: string }>).find(
      (g) => g.title === title
    );
    if (match) {
      cy.request('DELETE', `/api/games/${match.id}`);
    }
  });
});

// Suche über die UI: tippen, Button klicken, auf Request warten.
Cypress.Commands.add('searchFor', (term: string) => {
  cy.intercept('GET', '/api/games/search*').as('searchRequest');
  cy.get('.search-bar__input').clear();
  if (term) cy.get('.search-bar__input').type(term, { delay: 0 });
  cy.get('.search-bar__button').click();
  cy.wait('@searchRequest');
});

// Leere Ergebnisliste herbeiführen: nach nicht existierendem Begriff suchen.
Cypress.Commands.add('produceEmptyResultList', () => {
  cy.searchFor(`KeinSpielMitDiesemNamen__${Date.now()}`);
  cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
});

// Spiel direkt über die API anlegen.
Cypress.Commands.add('createGameViaApi', (game) => {
  return cy.request('POST', '/api/games', game).then((res) => res.body);
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitApp(): Chainable<void>;
      openAddGameForm(): Chainable<void>;
      fillGameForm(game: {
        title?: string;
        description?: string;
        imageUrl?: string;
        releaseDate?: string;
      }): Chainable<void>;
      deleteGameByTitle(title: string): Chainable<void>;
      searchFor(term: string): Chainable<void>;
      produceEmptyResultList(): Chainable<void>;
      createGameViaApi(game: {
        title: string;
        description?: string;
        imageUrl?: string;
        releaseDate: string;
      }): Chainable<{
        id: number;
        title: string;
        description?: string;
        imageUrl?: string;
        releaseDate: string;
      }>;
    }
  }
}

export {};
