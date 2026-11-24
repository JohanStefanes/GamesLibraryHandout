package ch.diethelm.backend.service;

import ch.diethelm.backend.model.Game;
import ch.diethelm.backend.repository.GameRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit-Tests für GameService
 */
@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;

    @InjectMocks
    private GameService gameService;

    private Game game;

    @BeforeEach
    void setUp() {
        game = Game.builder()
                .id(1L)
                .title("The Witcher 3")
                .description("Open-World-Rollenspiel")
                .imageUrl("http://example.com/witcher.jpg")
                .releaseDate(LocalDate.of(2015, 5, 19))
                .build();
    }

    @Test
    void getAllGames_gibtListeVomRepositoryZurueck() {
        Game game2 = Game.builder()
                .id(2L)
                .title("Cyberpunk 2077")
                .releaseDate(LocalDate.of(2020, 12, 10))
                .build();
        List<Game> spiele = List.of(game, game2);

        when(gameRepository.findAll()).thenReturn(spiele);

        List<Game> result = gameService.getAllGames();

        assertEquals(2, result.size());
        assertEquals(spiele, result);
        verify(gameRepository).findAll();
    }

    @Test
    void getGameById_gibtSpielZurueck_wennVorhanden() {
        when(gameRepository.findById(1L)).thenReturn(Optional.of(game));

        Game result = gameService.getGameById(1L);

        assertEquals(game, result);
        verify(gameRepository).findById(1L);
    }

    @Test
    void getGameById_wirftException_wennNichtGefunden() {
        when(gameRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> gameService.getGameById(99L));

        verify(gameRepository).findById(99L);
    }

    @Test
    void createGame_speichertUndGibtSpielZurueck() {
        when(gameRepository.save(game)).thenReturn(game);

        Game result = gameService.createGame(game);

        assertEquals(game, result);
        verify(gameRepository).save(game);
    }

    @Test
    void updateGame_ueberschreibtAlleFelder() {
        // Spiel, das schon in der Datenbank ist
        Game bestehend = Game.builder()
                .id(1L)
                .title("Alter Titel")
                .description("Alte Beschreibung")
                .imageUrl("http://example.com/alt.jpg")
                .releaseDate(LocalDate.of(2000, 1, 1))
                .build();

        // Neue Werte, die gespeichert werden sollen
        Game neueDaten = Game.builder()
                .title("Neuer Titel")
                .description("Neue Beschreibung")
                .imageUrl("http://example.com/neu.jpg")
                .releaseDate(LocalDate.of(2022, 6, 15))
                .build();

        when(gameRepository.findById(1L)).thenReturn(Optional.of(bestehend));
        // save() gibt einfach das Objekt zurück, das es bekommt
        when(gameRepository.save(any(Game.class))).thenAnswer(aufruf -> aufruf.getArgument(0));

        Game result = gameService.updateGame(1L, neueDaten);

        assertEquals("Neuer Titel", result.getTitle());
        assertEquals("Neue Beschreibung", result.getDescription());
        assertEquals("http://example.com/neu.jpg", result.getImageUrl());
        assertEquals(LocalDate.of(2022, 6, 15), result.getReleaseDate());
        // ID bleibt gleich
        assertEquals(1L, result.getId());

        verify(gameRepository).findById(1L);
        verify(gameRepository).save(bestehend);
    }

    @Test
    void updateGame_wirftException_wennIdNichtExistiert() {
        when(gameRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> gameService.updateGame(99L, game));

        verify(gameRepository).findById(99L);
        // save() darf hier nicht aufgerufen werden
        verify(gameRepository, never()).save(any(Game.class));
    }

    @Test
    void deleteGame_loeschtSpiel_wennVorhanden() {
        when(gameRepository.existsById(1L)).thenReturn(true);

        gameService.deleteGame(1L);

        verify(gameRepository).existsById(1L);
        verify(gameRepository).deleteById(1L);
    }

    @Test
    void deleteGame_wirftException_wennIdNichtExistiert() {
        when(gameRepository.existsById(99L)).thenReturn(false);

        assertThrows(NoSuchElementException.class, () -> gameService.deleteGame(99L));

        verify(gameRepository).existsById(99L);
        // deleteById() darf hier nicht aufgerufen werden
        verify(gameRepository, never()).deleteById(any());
    }

    @Test
    void searchByTitle_ruftRepositoryMethodeAuf() {
        List<Game> treffer = List.of(game);
        when(gameRepository.findByTitleContainingIgnoreCase("witcher")).thenReturn(treffer);

        List<Game> result = gameService.searchByTitle("witcher");

        assertEquals(treffer, result);
        verify(gameRepository).findByTitleContainingIgnoreCase("witcher");
    }
}
