'use strict';

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const mqtt = require('mqtt');

const { Application, extractArguments } = require('./utils');


class BackendApplication extends Application {
  
  // Used for function calling,
  // use lib.extractArguments to get the argument names
  async handleFunctionCall(func, args) {
    try {
        
      // If the function is asynchronous, await its execution
      if (func instanceof Function && func.constructor.name === 'AsyncFunction') {
        return await func(...args);
      }

      // If the function is synchronous, wrap it with a Promise and resolve the result
      return new Promise(resolve => resolve(func(...args)));
  
    } catch (error) {

      // Handle any errors that occur during execution
      console.error('Error:', error);
      throw error;

    }
  }

}

class ExpressApplication extends BackendApplication {

  constructor(config) {
    super(config);

    this.app = express();
    this.app.use(express.json());

    Object.entries(this.crossover_config.routes).forEach(([routeName, routeConfig]) => {

      if (routeConfig.type === "javascript/function") {
        this.handleFuncs(routeName, this.user_config.functions[routeConfig.function]);
      } else if (routeConfig.type === "db/postgres") {
        this.handleDB(routeName, routeConfig);
      } else if (routeConfig.type === 'websockets/sub' || routeConfig.type === 'websockets/pub') {
        this.handleWS(routeName, routeConfig);
      }

    });
  }
  
  /**
   * Adds a function as a route handler to an Express app.
   *
   * @param {Function} func - The function to be added as a route handler.
   * @returns {void}
   */
  handleFuncs(name, func) {
    const funcArguments = extractArguments(func);
  
    this.app.post('/' + name, async (req, res) => {
      try {
        
        const args = funcArguments.map(key => {
          if (req.body === undefined || req.body[key] === undefined) {
            throw new Error("Parameter '" + key + "' was not provided");
          }

          return req.body[key];
        });

        console.log(name, func, JSON.stringify(args));
        const output = await this.handleFunctionCall(func, args);
        res.send(output);

      } catch (error) {

        console.error(error);
        console.error(error.message);
        console.error(error.stack);

        res.status(500).send({ message: error.message });

      }
    });
  
  }

  
  handleDB(routeName, routeConfig) {
    let db;
    const db_config = this.crossover_config.server.database;
  
    if (db_config.type === "sqlite") {
      db = new sqlite3.Database(db_config.path ?? "sqlite3.db"); // Assuming db_config has a path property for SQLite
    } else if (db_config.type === "postgres") {
      // Implement Postgres connection
    } else if (db_config.type === "mongodb") {
      // Implement MongoDB connection
    } else {
      throw new Error("Unsupported database type");
    }


    this.app.post(`/${routeName}`, (req, res) => {
      try {

        let sql;
        const table = routeConfig.table ?? db_config.table;
        const columns = Object.keys(routeConfig.params || {});

        // TODO: param validation and allow params to be an Array
        for (let col of columns) {
          if (routeConfig.params[col] === null && req.body[col] === undefined) {
            throw new Error("Parameter '" + col + "' is required");              
          } else if (req.body[col] == null) {
            req.body[col] = routeConfig.params[col]
          }
        }

        const params = Object.keys(req.body).reduce((acc, curr) => {
          acc['$' + curr] = req.body[curr];
          return acc;
        }, {});

  
        switch (routeConfig.method) {
          case 'select':
            
            sql = 'SELECT * FROM ' + table;
            sql += routeConfig.params?.length > 0 ? ' WHERE ' : '';
            sql += columns.map(k => k + ' = $' + k).join(' AND ');
            break;
  
          case 'insert':
            const columnsStr = columns.join(', ');
            const placeholders = columns.map(col => `$${col}`).join(', ');
            sql = `INSERT INTO ${table} (${columnsStr}) VALUES (${placeholders});`;
            break;
  
          case 'query':
            sql = routeConfig.query.replace('{table}', table);
            break;
  
          default:
            return res.status(400).json({ error: 'Invalid endpoint type' });
        }
  
        db.all(sql, params, (err, rows) => {
          if (err) {
            
            console.error(err);
            console.error(err.message);
            console.error(err.stack);

            return res.status(500).json({ error: err.message });
          }
          res.json(rows);
        });
        
      } catch (error) {
        
        console.error(error);
        console.error(error.message);
        console.error(error.stack);
        
        res.status(500).send({ error: error.message });

      }

    });

  }


  handleWS(routeName, routeConfig) {

    const { protocol, host, port, endpoint, topicPrefix='/', ...options } = this.crossover_config.server.websockets;
    const url = `${protocol}://${host}:${port}${endpoint}`

    function sub(args, callback) {
      const client = mqtt.connect(url);
      var topic = routeConfig.topic;
      const extractedArgs = topic.match(/[^{\}]+(?=})/g);
      extractedArgs?.map(key => {
        const arg = args[key];
        if (arg == null) {
          throw new Error("Argument '"+key+"' not provided");
        }
        topic = topic.replace(new RegExp(`{${key}}`, 'gm'), arg);
      });
      const fullTopic = topicPrefix + topic;
      // console.log("sub", {args, fullTopic, topic, extractedArgs})
      
      client.on("connect", () => {
        client.subscribe(fullTopic, (err) => {
          if (err) {
            throw new Error("Unable to Subscribe to: " + fullTopic);
          }
        });
      });

      client.on("message", (topic, message) => {
        callback(topic.toString(), message.toString())
      });

      // mqtt.subscribe(fullTopic, callback);
    }

    function pub(args, message) {
      const client = mqtt.connect(url);
      var topic = routeConfig.topic;
      const extractedArgs = topic.match(/[^{\}]+(?=})/g);
      extractedArgs?.map(key => {
        const arg = args[key];
        if (arg == null) {
          throw new Error("Argument '"+key+"' not provided");
        }
        topic = topic.replace(new RegExp(`{${key}}`, 'gm'), arg);
      });
      const fullTopic = topicPrefix + topic;
      // console.log("pub", {args, fullTopic, topic, extractedArgs})
      
      client.on("connect", () => {
        client.publish(fullTopic, message);
      });

      // mqtt.publish(fullTopic, message);
    }


    if (routeConfig.type === 'websockets/sub') {
      this[routeName] = sub;
    } else if (routeConfig.type === 'websockets/pub') {
      this[routeName] = pub;
    }
    

    if (routeConfig.type === 'websockets/pub' && routeConfig.http) {

      this.app.post('/' + routeName, async (req, res) => {
        try {

          const args = req.body.args;
          const message = req.body.message;

          const client = mqtt.connect(url);
          var topic = routeConfig.topic;
          const extractedArgs = topic.match(/[^{\}]+(?=})/g);
          extractedArgs?.map(key => {
            const arg = args[key];
            if (arg == null) {
              throw new Error("Argument '"+key+"' not provided")
            }
            topic = topic.replace(new RegExp(`{${key}}`, 'gm'), arg);
          });
          const fullTopic = topicPrefix + topic;

          client.on("connect", () => {
            client.publish(fullTopic, message);
            res.send({success: true});
          });
  
        } catch (error) {
  
          console.error(error);
          console.error(error.message);
          console.error(error.stack);
  
          res.status(500).send({ message: error.message });
  
        }
      });

    }

  }

  serve() {
    this.app.listen(this.crossover_config.server.port, () => {
      console.log('Server running on port ' + this.crossover_config.server.port);
    });
  }

}


module.exports.generate = (service, config) => {
  
  switch (service) {

    case "express":
      return new ExpressApplication(config);

    default:
      throw new Error("crossover/backend.js: '" + "' service not found");
  }
}