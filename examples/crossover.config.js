
module.exports = {
  server: {
    port: 4200,
    functions: ['gameComplete'],
    websockets: { // ws: 8083; wss: 8084
      protocol: 'wss',
      host: 'broker.emqx.io',
      port: 8084,
      endpoint: '/mqtt',
      // topicPrefix: '/x/'
    },
    database: {
      type: 'sqlite',
      table: 'games',
    }
  },
  client: {
    axios: {
      baseURL: 'http://localhost:4200',
    }
  },
  routes: {
    gameComplete: {
        type: "javascript/function",
        function: "gameComplete",
        params: {'game_id': null}
    },

    // websockets
    subGame: {
        type: "websockets/sub",
        topic: "games/{game_id}",
    },
    pubGame: {
        type: "websockets/pub",
        topic: "games/{game_id}",
        http: true
    },

    // database,
    resetGamesTable: {
      type: "db/postgres",
      method: 'query',
      query: 'CREATE TABLE IF NOT EXISTS {table} ( id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), owner_id NUMBER NOT NULL, isComplete BOOLEAN );'
    },
    createNewGame: {
        type: "db/postgres",
        method: 'insert',
        params: {'name': null, 'owner_id': null, 'isComplete': false}
    },
    listGames: {
        type: "db/postgres",
        method: 'select'
    },
    getGame: {
        type: "db/postgres",
        method: 'query',
        query: 'SELECT * FROM {table} WHERE id = $id',
        params: {'id': null}
    },
    updateGameName: {
        type: "db/postgres",
        method: 'query',
        query: 'UPDATE {table} SET name = $name',
        params: {'name': null}
    },
    deleteGame: {
        type: "db/postgres",
        method: 'query',
        query: 'DELETE FROM {table} WHERE id = $id',
        params: {'id': null}
    }
  }
};