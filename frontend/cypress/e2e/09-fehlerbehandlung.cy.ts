/// <reference types="cypress" />

// Server-/Netzwerkfehler (cy.intercept). Muss klare Fehlermeldung zeigen.
describe('Fehlerbehandlung bei Server- und Netzwerkfehlern', () => {
  const suffix = () => Date.now().toString();
  let createdTitles: string[] = [];

  beforeEach(() => {
    createdTitles = [];
  });

  afterEach(() => {
    createdTitles.forEach((t) => cy.deleteGameByTitle(t));
  });

  it('zeigt eine Fehlermeldung, wenn das Laden mit 500 fehlschlägt', () => {
    cy.intercept('GET', '/api/games', { statusCode: 500, body: {} }).as('getGamesError');
    cy.visit('/');
    cy.wait('@getGamesError');

    cy.get('.home-page__error').should('be.visible').and('contain.text', 'Fehler beim Laden der Spiele.');
    cy.get('.home-page__headline').should('contain.text', 'Games Library');
  });

  it('zeigt eine Fehlermeldung, wenn die Suche mit 500 fehlschlägt', () => {
    cy.visitApp();

    cy.intercept('GET', '/api/games/search*', { statusCode: 500, body: {} }).as('searchError');
    cy.get('.search-bar__input').type('irgendwas');
    cy.get('.search-bar__button').click();
    cy.wait('@searchError');

    cy.get('.home-page__error').should('be.visible').and('contain.text', 'Fehler bei der Suche.');
  });

  it('gaukelt bei einem Netzwerkfehler beim Erstellen keinen Erfolg vor', () => {
    const title = `Cypress Netzwerkfehler ${suffix()}`;
    createdTitles.push(title);

    cy.visitApp();
    cy.openAddGameForm();
    cy.fillGameForm({ title, description: 'Darf nicht gespeichert werden', releaseDate: '2020-06-06' });

    cy.intercept('POST', '/api/games', { forceNetworkError: true }).as('createFailed');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createFailed');

    cy.get('.home-page__error').should('be.visible').and('contain.text', 'Fehler beim Erstellen des Spiels.');
    cy.contains('.game-card__title', title).should('not.exist');
    cy.get('.game-form').should('not.exist');
  });

  it('zeigt bei einer langsamen Antwort einen Ladezustand', () => {
    cy.intercept('GET', '/api/games', (req) => {
      req.on('response', (res) => {
        res.setDelay(1500);
      });
    }).as('getSlow');
    cy.visit('/');

    cy.get('.game-list__spinner').should('be.visible');
    cy.get('.game-list__status-title').should('contain.text', 'Loading Library...');

    cy.wait('@getSlow');
    cy.get('.game-list__spinner').should('not.exist');
  });
});
