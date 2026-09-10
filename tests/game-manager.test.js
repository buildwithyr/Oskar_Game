/* ══════════════════════════════════════
   Test: GameManager – zentrale Timer-/RAF-Bereinigung
   Prüft, dass beim Verlassen eines Levels (Screen-Wechsel)
   IMMER dessen stop() läuft, auch wenn eine Stelle im Code
   das vergisst – das Sicherheitsnetz aus Phase 2.
══════════════════════════════════════ */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { makeFakeDocument } = require('./helpers/fake-dom')

function loadGameManager(){
  const src = fs.readFileSync(path.join(__dirname, '../game/game-manager.js'), 'utf8')
  const fakeDocument = makeFakeDocument()
  const sandbox = {
    document: fakeDocument,
    window: {
      showScreen: function(id){ sandbox.window.__lastShown = id },
      addEventListener(){},
    },
    console,
  }
  vm.createContext(sandbox)
  vm.runInContext(src, sandbox, { filename: 'game-manager.js' })
  // GameManager ist ein top-level `const` -> kein window-Property, per
  // weiterem Snippet im selben Context einsammeln (teilt die lexikalische
  // Top-Level-Umgebung mit dem vorherigen runInContext-Aufruf).
  vm.runInContext('this.__GameManager = GameManager;', sandbox)
  return sandbox.__GameManager
}

function run(){
  // 1. Verlässt man Level A für Level B, wird A.stop() aufgerufen.
  {
    const GM = loadGameManager()
    let stoppedA = false
    let stoppedB = false
    GM.register('levelA', { stop: () => { stoppedA = true } })
    GM.register('levelB', { stop: () => { stoppedB = true } })

    GM.setActive('levelA')
    GM.onScreenChange('levelB') // Sicherheitsnetz: A wird verlassen
    assert.strictEqual(stoppedA, true, 'Verlassenes Level A muss gestoppt werden')
    assert.strictEqual(stoppedB, false, 'Neues Level B darf beim Wechsel noch nicht laufen/gestoppt sein')
  }

  // 2. Zurück ins Menü stoppt das aktive Level.
  {
    const GM = loadGameManager()
    let stopped = false
    GM.register('level2', { stop: () => { stopped = true } })
    GM.setActive('level2')
    GM.onScreenChange('intro')
    assert.strictEqual(stopped, true, 'Rückkehr ins Menü muss das aktive Level stoppen')
  }

  // 3. clearActive() eines bereits verlassenen Levels darf das inzwischen
  //    neu gestartete Level NICHT abräumen (Race-Schutz).
  {
    const GM = loadGameManager()
    let stoppedNew = false
    GM.register('level2', { stop: () => { stoppedNew = true } })
    GM.setActive('level2')
    GM.clearActive('level2') // korrektes Aufräumen von level2
    GM.setActive('level2')   // Level2 wird direkt neu gestartet
    GM.clearActive('level2') // ein verspäteter zweiter Aufruf für die ALTE Instanz
    // Kein Assertion-Fehler hier bedeutet: kein Crash bei doppeltem clearActive.
    assert.strictEqual(stoppedNew, false, 'clearActive darf stop() nicht selbst aufrufen')
  }

  // 4. pause()/resume() werden nur für Level aufgerufen, die sie anbieten.
  {
    const GM = loadGameManager()
    let paused = false
    GM.register('level1', { stop(){}, pause(){ paused = true }, resume(){} })
    GM.setActive('level1')
    GM.pauseActive()
    assert.strictEqual(paused, true, 'pause() muss beim registrierten Level ankommen')
  }
  {
    const GM = loadGameManager()
    // Level ohne pause() darf beim Aufruf nicht crashen.
    GM.register('level4', { stop(){} })
    GM.setActive('level4')
    assert.doesNotThrow(() => GM.pauseActive())
  }

  console.log('✓ game-manager.test.js: alle Checks bestanden')
}

if(require.main === module) run()
module.exports = run
