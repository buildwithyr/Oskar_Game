# Skill: save-migration

Wie man das versionierte Speichersystem in `game/storage.js` sicher erweitert – ohne bestehende Spielstände zu korrumpieren.

---

## Wann ist dieser Skill nötig?

Immer wenn sich die Datenstruktur des Spielstands ändert:
- Neues Level hinzugefügt (neue Statistikfelder, neuer Highscore-Key)
- Feld umbenannt oder gelöscht
- Neues Feature mit eigenem Speicherbedarf (z. B. tägliche Challenges)

---

## Wo: `game/storage.js`

Drei Stellen müssen immer zusammen angefasst werden:

### 1. `CURRENT_SAVE_VERSION` hochzählen

```js
const CURRENT_SAVE_VERSION = 6   // war 5, jetzt 6
```

### 2. `DEFAULT_PLAYER_DATA` anpassen

Neue Felder hier eintragen – das ist der Fallback für frische Installationen und der Merge-Baustein für Migration:

```js
const DEFAULT_PLAYER_DATA = {
  saveVersion: CURRENT_SAVE_VERSION,
  // … bestehende Felder …
  statistics: {
    // … bestehende Statistiken …
    level9Completed: 0,    // NEU
    myLevelGamesPlayed: 0, // NEU
  },
  highscores: {
    // … bestehende Scores …
    level9: 0,             // NEU
  },
}
```

### 3. Migrationsschritt in `migrateSaveData()` einfügen

Die Migration läuft als sequenzielle `if (data.saveVersion < N)` Kette. Neuen Block **am Ende** einfügen:

```js
// v5 → v6: Level 9 (My New Level) hinzugefügt
if (data.saveVersion < 6) {
  data.saveVersion = 6
  // Optionale Datenumformungen hier – wenn nur neue Felder dazukommen,
  // genügt der spätere { ...DEFAULT_PLAYER_DATA, ...data } Merge.
}
```

**Wenn Felder umbenannt oder gelöscht werden**, muss die alte Key-Liste im Aufräumblock am Ende von `migrateSaveData()` gepflegt werden:

```js
for (const key of [
  'altesStatistikFeld',      // NEU: hier eintragen, wenn ein Feld entfernt wird
  'level9Completed',         // Beispiel: gelöschtes Level
]) {
  delete filled.statistics[key]
}
```

---

## Checkliste

- [ ] `CURRENT_SAVE_VERSION` um 1 erhöht
- [ ] Neue Felder in `DEFAULT_PLAYER_DATA.statistics` und/oder `.highscores` eingetragen
- [ ] Neuen `if (data.saveVersion < N)` Block in `migrateSaveData()` eingefügt
- [ ] Gelöschte Keys im Aufräumblock unten in `migrateSaveData()` eingetragen
- [ ] Änderung mit dem Skill `pwa-cache` sichern (CACHE_VERSION bump)

---

## Bestehende Versionshistorie

| Version | Änderung |
|---|---|
| v0 | Initialer Stand (kein explizites Versionsfeld) |
| v1 | Basisstruktur: bones, achievements, statistics, highscores |
| v2 | Crab-Statistiken entfernt; Frogger + Level 8 hinzugefügt |
| v3 | Dance- und Dig-Level |
| v4 | Pseudo-3D-Runner |
| v5 | Kompaktierung 11-Slot → 8-Slot-Layout |
