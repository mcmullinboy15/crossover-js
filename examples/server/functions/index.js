async function gameComplete(game_id) {
  return { success: Math.random() > 0.5, game_id }
}


module.exports = {
  gameComplete
}