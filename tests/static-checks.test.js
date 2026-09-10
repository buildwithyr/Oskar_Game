/* ══════════════════════════════════════
   Test: Statische Konsistenz-Checks (kein DOM nötig)
   - Jede in index.html referenzierte lokale Datei liegt auch in
     service-worker.js PRECACHE_URLS (Offline-Kernressourcen).
   - Keine Funktion ist in zwei verschiedenen game/*.js-Dateien
     gleichzeitig definiert (die l3StopGame-Kollision, die diese
     Aufräumaktion ausgelöst hat, darf nicht wiederkommen).
   - Jedes Level mit einer erkennbaren "start"-Funktion hat auch
     eine zugehörige "stop"-Funktion.
══════════════════════════════════════ */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function read(rel){
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function run(){

  // ── PWA: alle lokalen index.html-Ressourcen sind offline verfügbar ──
  {
    const html = read('index.html')
    const sw = read('service-worker.js')

    // script src="..." und link rel=stylesheet href="..." (lokale Pfade, keine http(s)-URLs)
    const refs = []
    for(const m of html.matchAll(/<script src="([^"]+)"/g)) refs.push(m[1])
    for(const m of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) refs.push(m[1])
    assert.ok(refs.length > 5, 'Sanity-Check: es sollten mehrere <script>/<link>-Referenzen in index.html stehen')

    // Basename ohne "?v=..."-Query, denn der Service Worker cacht bewusst
    // ohne Cache-Busting-Query (siehe fetch-Handler mit ignoreSearch).
    const basenames = refs.map(r => r.split('?')[0])

    for(const rel of basenames){
      assert.ok(
        sw.includes(`'${rel}'`) || sw.includes(`"${rel}"`),
        `${rel} wird von index.html geladen, fehlt aber in service-worker.js PRECACHE (CORE_URLS)`
      )
    }
  }

  // ── Keine doppelt definierten Top-Level-Funktionen über game/*.js hinweg ──
  {
    const gameDir = path.join(ROOT, 'game')
    const files = fs.readdirSync(gameDir).filter(f => f.endsWith('.js'))
    const definedIn = {} // funcName -> [files]

    for(const file of files){
      const src = fs.readFileSync(path.join(gameDir, file), 'utf8')
      for(const m of src.matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\(/gm)){
        const name = m[1]
        if(!definedIn[name]) definedIn[name] = []
        definedIn[name].push(file)
      }
    }

    const collisions = Object.entries(definedIn).filter(([, fs_]) => fs_.length > 1)
    assert.deepStrictEqual(
      collisions, [],
      `Funktionsnamen dürfen nur in einer Datei definiert sein (spätere Datei überschreibt sonst die frühere): ${JSON.stringify(collisions)}`
    )
  }

  // ── Jedes Level mit start*/begin* hat ein zugehöriges stop* ──
  {
    // levelPrefix -> { startPattern, stopFn }
    const checks = [
      { file: 'level1.js',               start: 'startLevel1',       stop: 'l1StopGame' },
      { file: 'level-02-beach-run.js',    start: 'startLevel2',       stop: 'l2StopGame' },
      { file: 'level-03-candy-match.js',  start: 'startLevel3Match',  stop: 'matchStopGame' },
      { file: 'level4_memory.js',         start: 'startLevel4Memory', stop: 'l4StopGame' },
      { file: 'level_frogger.js',         start: 'startFroggerLevel', stop: 'frogStop' },
      { file: 'level_dance.js',           start: 'startDanceLevel',   stop: 'dcStopGame' },
      { file: 'level_dig.js',             start: 'startDigLevel',     stop: 'dgStopGame' },
      { file: 'level_run3d.js',           start: 'startRun3dLevel',   stop: 'r3Stop' },
    ]
    for(const c of checks){
      const src = read(path.join('game', c.file))
      assert.ok(src.includes(`function ${c.start}(`), `${c.file}: erwartete Einstiegsfunktion ${c.start}() fehlt`)
      assert.ok(src.includes(`function ${c.stop}(`), `${c.file}: erwartete Stop-Funktion ${c.stop}() fehlt`)
    }
  }

  console.log('✓ static-checks.test.js: alle Checks bestanden')
}

if(require.main === module) run()
module.exports = run
