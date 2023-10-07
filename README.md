[![Crossover-js Logo](https://raw.githubusercontent.com/mcmullinboy15/crossover-js/main/logo.png)](https://github.com/mcmullinboy15/crossover-js)

### Bridging the Gap between Frontend and Backend.

[![npm version](https://img.shields.io/npm/v/crossover-js.svg?)](https://www.npmjs.org/package/crossover-js)
[![License](https://img.shields.io/github/license/mcmullinboy15/crossover-js)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/crossover-js.svg?)](https://npm-stat.com/charts.html?package=crossover-js)
[![install size](https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json?p=crossover-js&query=$.install.pretty&label=install%20size&)](https://packagephobia.now.sh/result?p=crossover-js)
<!-- [![Build status](https://img.shields.io/github/actions/workflow/status/mcmullinboy15/crossover-js/ci.yml?branch=v1.x&label=CI&logo=github&)](https://github.com/mcmullinboy15/crossover-js/actions/workflows/ci.yml) -->
<!-- [![code coverage](https://img.shields.io/coveralls/mcmullinboy15/crossover-js.svg?)](https://coveralls.io/r/mcmullinboy15/crossover-js) -->

  
## What is Crossover?

In the modern era of web development, maintaining a seamless connection between `frontend` and `backend` systems is crucial, yet often challenging. Enter `crossover` - a revolutionary tool designed to simplify and streamline this connection. Whether you're working with React on the frontend and Express on the backend, sql queries, websocket connections, or any other combination, crossover effortlessly syncs your function calls, making it feel as if you're working within a single unified environment.

With `crossover`, you define your functions once and call them anywhere. It abstracts the intricacies of API endpoints, ensuring developers can focus on writing impactful code rather than battling configurations. Backed by a robust configuration system, crossover not only improves development speed but also ensures consistency, reliability, and scalability.

## Developers Welcome!!

Dive in and experience the future of web development!

Feel free to modify or expand upon this as needed!


## Table of Contents

- [What is Crossover?](#what-is-crossover)
- [Developers Welcome!!](#developers-welcome)
- [Table of Contents](#table-of-contents)
- [Features](#features)
- [Installation](#installation)
- [Example](#example)
  - [Possible Project Structure](#possible-project-structure)
  - [Configuration](#configuration)
  - [Server Initialization](#server-initialization)
  - [Client Initialization](#client-initialization)
- [Benefits](#benefits)
- [License](#license)


## Features
- Axios based api module generation
- Express based api Application generation
- SQL backend function generation
- WebSocket pub/sub handers generation

## Installation
Installation is done using the
[`npm install`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) command:
```console
$ npm install crossover-js
```


## Example

### Possible Project Structure

```
project-root/
|-- crossover.config.js
|-- server/
|   |-- index.js
|   |-- functions.js (or other sub-modules)
|-- client/
    |-- index.js
    |-- components/
```

### Configuration
The `crossover.config.js` at the root would allow you to maintain a centralized configuration, making it easier to manage the relationship between the client and server.

```js
// crossover.config.js

module.exports = {
  server: {
    port: 3000,
    middleware: [...],
    functions: ['gameComplete'],

    // WebSockets
    websockets: { // ws: 8083; wss: 8084
      protocol: 'wss',
      host: 'broker.emqx.io',
      port: 8084,
      endpoint: '/mqtt',
    },

    // Database configurations
    database: {
      type: 'postgres', // or sqlite, or mongodb
      connectionString: 'YOUR_DB_CONNECTION_STRING',
      table: 'games',
      // ... other DB-related configurations
    },

    // Cache configurations
    cache: {
      type: 'redis',
      host: 'localhost',
      port: 6379,
      // ... other cache-related configurations
    },

    // External service configurations
    externalServices: {
      paymentGateway: {
        apiKey: 'YOUR_API_KEY',
        endpoint: 'https://api.payment-gateway.com',
        // ... other service-related configurations
      },
      // ... other external services
    },

    // Third-party client-side services
    analytics: {
      googleAnalyticsId: 'UA-XXXXXXXXX',
      // ... other analytics configurations
    },

    // Any other server-specific configurations
    // ...
  },
  client: {
    axios: {
      baseURL: 'http://api.crossover-server.com:3000', // default 'https' + 'localhost' + server.port
    }
    // ... client-specific configurations
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
        topic: "games/:game_id",
        // Usage: api.subGame('12345', () => ...)
    },
    pubGame: {
        type: "websockets/pub",
        topic: "games/:game_id"
        // Usage: api.pubGame('12345', msg)
    },
    // database
    createGamesTable: {
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
```

### Server Initialization
On the server side, initialize your Express (or other) server with crossover and pass the required functions.

```js
// server/index.js

const crossover = require('crossover/express');
const { gameComplete } = require('./functions');
/**
 * function gameComplete(gameObj) {
 *     return true
 * };
 */

const app = crossover.generate({
  functions: { gameComplete }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Client Initialization
On the client side, initialize your client with crossover, which would provide you an interface to make calls to the server.

```js
// client/index.js

import crossover from 'crossover/http';

const api = crossover.generate();

// Now, you can use the `api` object to make calls to your server, e.g.:
api.gameComplete(gameObj).then(gameObj => {
  console.log(gameObj); // true
});

// websockets
api.subGame(game_id, msg => {
  console.log(msg);
});
api.pubGame(game_id, msg);

// database
api.createNewGame({name: 'Game 1', owner_id: 12345}).then(sql_response => {
  console.log(sql_response);
});
api.getGame(id).then(game => {
  console.log(game);
});

api.listGames(id).then(games => {
  console.log(games);
});
```

## Benefits
<b>Separation of Concerns:</b> By keeping the client and server in separate directories, you cleanly separate their responsibilities.

<b>Centralized Configuration:</b> Having a single `crossover.config.js` at the root allows you to easily manage the relationship between the client and server.

<b>Flexibility:</b> By allowing different configurations for different server frameworks (Express, Koa, etc.), you make `crossover` adaptable to various needs.

<b>Explicit Function Exports:</b> By passing the server functions explicitly when generating the server, you have more control over what's exposed. It also makes the code self-documenting, as it's clear which functions are accessible from the client.

## License

[MIT](LICENSE)