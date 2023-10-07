const crossover = require('../../lib/frontend');


const api = crossover.generate("axios", {
  configPath: __dirname + "/../crossover.config.js"
});

api.gameComplete({game_id: 2}).then(resp => {
  console.log("gameComplete", resp);
});

// websockets
console.log("websockets")
const game_id = "#";

api.subGame({game_id}, msg => {
  console.log("subGame", msg);
});

api.pubGame({game_id: 1}, "client-msg-1");
api.pubGame({game_id: 2}, "client-msg-2");
api.pubGame({game_id: 3}, "client-msg-3");

// database
console.log("database");

api.createGamesTable().then(resp => {
  console.log("resetGamesTable", resp)
});

api.createNewGame({name: 'Game 1', owner_id: 12345}).then(resp => {
  console.log("createNewGame", resp);
});

api.getGame({id: 1}).then(game => {
  console.log("getGame", game);
});

api.listGames().then(games => {
  console.log("listGames", games);

  // for (var game of games) {
  //   api.deleteGame({id: game.id}).then(resp => {
  //     console.log("deleteGame", resp)
  //   })
  // }
  
});
