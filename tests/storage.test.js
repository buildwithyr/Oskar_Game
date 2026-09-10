/* ══════════════════════════════════════
   Test: Speicher-System (game/storage.js)
   - createDefaultPlayerData() liefert unabhängige, tiefe Kopien
   - Migration alter Spielstände (inkl. v5 -> v6 Highscore-Rettung)
   - eindeutige, stabile Level-/Highscore-Keys
   - Validierung kaputter/manipulierter Daten
══════════════════════════════════════ */

const assert = require('assert')

// storage.js läuft im Browser als klassisches <script> (kein require()),
// exportiert seine reinen Funktionen aber über einen CommonJS-Guard am
// Dateiende extra für genau solche Tests.
const {
  CURRENT_SAVE_VERSION,
  createDefaultPlayerData,
  migrateSaveData,
  sanitizePlayerData,
} = require('../game/storage.js')

function run(){

  // ── Factory liefert unabhängige Kopien ─────────────────────
  {
    const a = createDefaultPlayerData()
    const b = createDefaultPlayerData()
    a.statistics.level1Completed = 5
    a.highscores.level2 = 99
    a.bones = 7
    assert.strictEqual(b.statistics.level1Completed, 0, 'zweite Kopie darf von der ersten nicht mitverändert werden (statistics)')
    assert.strictEqual(b.highscores.level2, 0, 'zweite Kopie darf von der ersten nicht mitverändert werden (highscores)')
    assert.strictEqual(b.bones, 0, 'zweite Kopie darf von der ersten nicht mitverändert werden (bones)')
  }

  // ── Eindeutige Level-/Highscore-Keys ───────────────────────
  {
    const data = createDefaultPlayerData()
    const scoreKeys = Object.keys(data.highscores)
    const uniqueKeys = new Set(scoreKeys)
    assert.strictEqual(scoreKeys.length, uniqueKeys.size, 'Highscore-Keys müssen eindeutig sein')
    assert.deepStrictEqual(scoreKeys.sort(), ['level1','level2','level3','level4','level5','level6','level7','level8'].sort(),
      'Es muss für jedes der 8 Level genau einen Highscore-Key geben, keine Lücken/Dopplungen')
  }

  // ── Migration: leerer/kaputter Spielstand -> Defaults ──────
  {
    const migrated = migrateSaveData(null)
    assert.strictEqual(migrated.saveVersion, CURRENT_SAVE_VERSION)
    assert.strictEqual(migrated.bones, 0)
  }

  // ── Migration: der Beach-Run/Candy-Match-Highscore-Bug ─────
  // Vor dem Fix (l3StopGame-Kollision) landete ein Beach-Run-Highscore
  // fälschlich unter "level3" statt "level2". Die v5->v6-Migration muss
  // ihn retten, wenn level2 noch leer ist.
  {
    const oldBroken = {
      saveVersion: 5,
      bones: 3,
      statistics: {},
      highscores: { level1: 0, level2: 0, level3: 42, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0 },
    }
    const migrated = migrateSaveData(oldBroken)
    assert.strictEqual(migrated.highscores.level2, 42, 'Beach-Run-Highscore muss von level3 nach level2 gerettet werden')
  }

  // Ist level2 bereits korrekt befüllt, darf die Rettung ihn nicht überschreiben.
  {
    const oldOk = {
      saveVersion: 5,
      statistics: {},
      highscores: { level1: 0, level2: 15, level3: 42, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0 },
    }
    const migrated = migrateSaveData(oldOk)
    assert.strictEqual(migrated.highscores.level2, 15, 'ein bereits vorhandener echter level2-Highscore darf nicht überschrieben werden')
  }

  // ── Migration: sehr alter 11-Slot-Spielstand (v4) läuft bis zur
  //    aktuellen Version durch, ohne zu crashen ────────────────
  {
    const veryOld = {
      saveVersion: 1,
      bones: 12,
      statistics: { level9Completed: 3, crabsCaughtTotal: 9 },
      highscores: { level9: 77 },
    }
    const migrated = migrateSaveData(veryOld)
    assert.strictEqual(migrated.saveVersion, CURRENT_SAVE_VERSION)
    assert.strictEqual(migrated.bones, 12, 'bones bleiben über alle Migrationsschritte erhalten')
    assert.strictEqual('crabsCaughtTotal' in migrated.statistics, false, 'entfernte Felder dürfen nach der Migration nicht mehr existieren')
    assert.strictEqual('level9' in migrated.highscores, false, 'Highscore-Keys jenseits level8 dürfen nicht mehr existieren')
  }

  // ── Validierung: kaputte/manipulierte Werte werden repariert ─
  {
    const corrupt = createDefaultPlayerData()
    corrupt.bones = -5
    corrupt.statistics.level1Completed = NaN
    corrupt.highscores.level2 = -100
    const sane = sanitizePlayerData(corrupt)
    assert.strictEqual(sane.bones, 0, 'negative bones müssen auf 0 korrigiert werden')
    assert.strictEqual(sane.statistics.level1Completed, 0, 'NaN-Statistik muss auf 0 korrigiert werden')
    assert.strictEqual(sane.highscores.level2, 0, 'negativer Highscore muss auf 0 korrigiert werden')
  }

  console.log('✓ storage.test.js: alle Checks bestanden')
}

if(require.main === module) run()
module.exports = run
