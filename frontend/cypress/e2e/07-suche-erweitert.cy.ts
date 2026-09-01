/// <reference types="cypress" />

// Suche mit ungewöhnlichen Eingaben. Darf nicht abstürzen.
describe('Suche mit Randfällen', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  const expectNoCrash = () => {
    cy.get('.home-page__headline').should('contain.text', 'Games Library');
    cy.get('.home-page__error').should('not.exist');
    cy.get('body').then(($body) => {
      const hasCards = $body.find('.game-card').length > 0;
      const hasEmptyState = $body.find('.game-list__status-title').length > 0;
      expect(hasCards || hasEmptyState).to.be.true;
    });
  };

  it('stürzt bei Sonderzeichen nicht ab', () => {
    cy.searchFor('%<&äöü');
    expectNoCrash();
  });

  it('kommt mit einem sehr langen Suchbegriff klar', () => {
    cy.searchFor('A'.repeat(250));
    expectNoCrash();
  });

  it('sucht erst beim Absenden, nicht bei jedem Tastendruck', () => {
    cy.intercept('GET', '/api/games/search*').as('search');

    cy.get('.search-bar__input').type('witcher');
    cy.get('@search.all').should('have.length', 0);

    cy.get('.search-bar__input').type('{enter}');
    cy.wait('@search');
    cy.get('@search.all').should('have.length', 1);
  });
});
