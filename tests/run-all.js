/* Führt alle Tests in diesem Ordner nacheinander aus. Kein Test-Framework
   nötig: jede *.test.js-Datei wirft bei einem fehlgeschlagenen assert()
   einfach eine Exception – die fängt dieser Runner ab und zählt sie. */

const fs = require('fs')
const path = require('path')

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort()

let failed = 0
for(const file of files){
  try {
    const run = require(path.join(__dirname, file))
    if(typeof run === 'function') run()
  } catch (e) {
    failed++
    console.error(`✗ ${file} FEHLGESCHLAGEN:`)
    console.error(e.message)
  }
}

console.log('')
if(failed === 0){
  console.log(`Alle ${files.length} Test-Dateien bestanden.`)
} else {
  console.log(`${failed} von ${files.length} Test-Dateien fehlgeschlagen.`)
  process.exitCode = 1
}
