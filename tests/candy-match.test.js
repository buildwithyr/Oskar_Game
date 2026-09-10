/* ══════════════════════════════════════
   Test: Candy Match – Sackgassen-Erkennung
   (game/level-03-candy-match.js)
══════════════════════════════════════ */

const assert = require('assert')

// level-03-candy-match.js registriert sich beim Laden einmalig bei
// GameManager (game/game-manager.js) – im Browser längst vorhanden, hier
// per Stub bereitgestellt, damit require() nicht an dieser Zeile scheitert.
global.GameManager = { register(){}, setActive(){}, clearActive(){} }

const { findMatchesOn, boardHasValidMove } = require('../game/level-03-candy-match.js')

function run(){

  // ── findMatchesOn: erkennt horizontale und vertikale 3er-Reihen ─
  {
    const board = [
      ['A','A','A','B'],
      ['C','D','E','B'],
      ['F','G','H','B'],
    ]
    const matches = findMatchesOn(board)
    const keys = new Set(matches.map(m => `${m.r},${m.c}`))
    assert.strictEqual(keys.has('0,0') && keys.has('0,1') && keys.has('0,2'), true, 'horizontale 3er-Reihe muss erkannt werden')
    assert.strictEqual(keys.has('0,3') && keys.has('1,3') && keys.has('2,3'), true, 'vertikale 3er-Reihe muss erkannt werden')
  }

  {
    const board = [
      ['A','B','C'],
      ['D','E','F'],
      ['G','H','I'],
    ]
    assert.strictEqual(findMatchesOn(board).length, 0, 'ein Feld ohne 3er-Reihe darf keine Matches liefern')
  }

  // ── boardHasValidMove: erkennt einen möglichen Zug ──────────────
  {
    // Ein Tausch von (0,1) und (1,1) erzeugt eine Reihe "A A A" in Zeile 0.
    const board = [
      ['A','B','A'],
      ['C','A','D'],
      ['E','F','G'],
    ]
    assert.strictEqual(boardHasValidMove(board), true, 'ein Feld mit möglichem Zug muss als lösbar erkannt werden')
  }

  {
    // Lateinisches Quadrat (jede Farbe genau 1x pro Zeile/Spalte): kein
    // einzelner Nachbar-Tausch erzeugt hier je 3 gleiche in einer Reihe.
    const board = [
      ['A','B','C'],
      ['C','A','B'],
      ['B','C','A'],
    ]
    assert.strictEqual(boardHasValidMove(board), false, 'ein Feld ohne möglichen Zug muss als Sackgasse erkannt werden')
  }

  // ── boardHasValidMove darf das übergebene Feld nicht verändern ──
  {
    const board = [
      ['A','B','A'],
      ['C','A','D'],
      ['E','F','G'],
    ]
    const before = JSON.stringify(board)
    boardHasValidMove(board)
    assert.strictEqual(JSON.stringify(board), before, 'boardHasValidMove darf das Originalfeld nicht mutieren (nur eine Kopie testen)')
  }

  console.log('✓ candy-match.test.js: alle Checks bestanden')
}

if(require.main === module) run()
module.exports = run
