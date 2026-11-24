/// <reference types="cypress" />

// Edit-Abbruch darf Daten nicht ändern. Fehlendes/kaputtes Bild -> "No Image".
describe('Formular abbrechen und Bild-Darstellung', () => {
  const suffix = () => Date.now().toString();
  let createdTitles: string[] = [];

  beforeEach(() => {
    createdTitles = [];
    cy.visitApp();
  });

  afterEach(() => {
    createdTitles.forEach((t) => cy.deleteGameByTitle(t));
  });

  it('behält beim Abbrechen die Originaldaten', () => {
    const title = `Cypress Edit-Abbruch ${suffix()}`;
    const description = 'Originalbeschreibung, darf sich nicht ändern';
    createdTitles.push(title);

    cy.createGameViaApi({ title, description, releaseDate: '2020-02-02' });
    cy.reload();

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__btn--edit').click();
    });
    cy.get('.game-form__title').should('contain.text', 'Edit Game');
    cy.fillGameForm({ title: 'GEÄNDERTER TITEL', description: 'geänderte Beschreibung' });
    cy.get('.game-form__btn--cancel').click();
    cy.get('.game-form').should('not.exist');

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__title').should('have.text', title);
      cy.get('.game-card__description').should('have.text', description);
    });
    cy.contains('.game-card__title', 'GEÄNDERTER TITEL').should('not.exist');
  });

  it('zeigt bei kaputter Bild-URL "No Image" und kein <img>', () => {
    const title = `Cypress Kaputtes Bild ${suffix()}`;
    createdTitles.push(title);

    cy.createGameViaApi({
      title,
      imageUrl: 'https://bild-existiert-nicht.invalid/kaputt.jpg',
      releaseDate: '2020-03-03',
    });
    cy.reload();

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__no-image').should('contain.text', 'No Image');
      cy.get('.game-card__image').should('not.exist');
    });
  });

  it('zeigt "No Image", wenn keine Bild-URL angegeben wird', () => {
    const title = `Cypress Ohne Bild ${suffix()}`;
    createdTitles.push(title);

    cy.createGameViaApi({ title, imageUrl: '', releaseDate: '2020-04-04' });
    cy.reload();

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__no-image').should('contain.text', 'No Image');
      cy.get('.game-card__image').should('not.exist');
    });
  });

  it('lässt sich per Tastatur bedienen (Fokus + Enter)', () => {
    const title = `Cypress Tastatur ${suffix()}`;
    createdTitles.push(title);

    cy.openAddGameForm();

    cy.get('.game-form input[name="title"]').focus().type(title);
    cy.focused().should('have.attr', 'name', 'title');
    cy.get('.game-form input[name="releaseDate"]').focus().type('2021-05-05');

    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form input[name="title"]').type('{enter}');
    cy.wait('@createGame').its('response.statusCode').should('eq', 201);

    cy.get('.game-form').should('not.exist');
    cy.contains('.game-card__title', title).should('be.visible');
  });
});
