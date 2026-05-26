function vibe(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern)
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"))
  document.getElementById(id).classList.add("active")
}

function showLevelComplete({ title, text, button, next, stars = 3 }){
