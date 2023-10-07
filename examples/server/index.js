const crossover = require('../../lib/backend');
const { gameComplete } = require('./functions');


const app = crossover.generate("express", {
  functions: { gameComplete },
  configPath: __dirname + "/../crossover.config.js"
});

// websockets
const game_id = "#";

app.subGame({game_id}, (topic, msg) => {
  console.log(topic, msg);
});

app.pubGame({game_id}, "msg1111");

app.serve();
