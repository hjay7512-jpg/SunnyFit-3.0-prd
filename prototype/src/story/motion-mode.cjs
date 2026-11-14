// Respect the system until the viewer explicitly chooses a mode.
function motionChoice(value) {
  return value === 'full' || value === 'reduce' ? value : 'system'
}
function isReduced(choice, systemReduced) {
  return choice === 'reduce' || (choice === 'system' && systemReduced)
}
module.exports = { motionChoice, isReduced }
