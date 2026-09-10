/* ══════════════════════════════════════
   Winziger DOM-Stub für Tests, die game-manager.js
   (o.ä. Dateien mit document/window-Referenzen) via
   vm.runInContext laden müssen – kein jsdom, keine
   zusätzliche Abhängigkeit nötig.
══════════════════════════════════════ */

function makeFakeElement(){
  const classes = new Set()
  return {
    style: {},
    dataset: {},
    children: [],
    classList: {
      add(c){ classes.add(c) },
      remove(c){ classes.delete(c) },
      contains(c){ return classes.has(c) },
      toggle(c, v){
        const want = v === undefined ? !classes.has(c) : v
        if(want) classes.add(c); else classes.delete(c)
        return want
      },
    },
    appendChild(child){ this.children.push(child); return child },
    remove(){},
    addEventListener(){},
    removeEventListener(){},
    setAttribute(){},
    querySelectorAll(){ return [] },
  }
}

function makeFakeDocument(){
  return {
    body: makeFakeElement(),
    createElement(){ return makeFakeElement() },
    getElementById(){ return makeFakeElement() },
    querySelector(){ return null },
    querySelectorAll(){ return [] },
    addEventListener(){},
    hidden: false,
  }
}

module.exports = { makeFakeElement, makeFakeDocument }
