'use strict';

const mqtt = require('mqtt');
const { Application, extractArguments, createObject, generateAxios } = require("./utils");

class FrontendApplication extends Application {

}


class AxiosApplication extends FrontendApplication {

  constructor(config) {
    super(config);

    this.axios = generateAxios(this.crossover_config.client.axios)

    Object.entries(this.crossover_config.routes).forEach(([routeName, routeConfig]) => {

      if (routeConfig.type === "javascript/function") {
        this.handleFuncs(routeName, routeConfig);
      } else if (routeConfig.type === "db/postgres") {
        this.handleDB(routeName, routeConfig);
      } else if (routeConfig.type === 'websockets/sub' || routeConfig.type === 'websockets/pub') {
        this.handleWS(routeName, routeConfig);
      }

    });
  }

  handleFuncs(routeName, routeConfig) {

    const paramKeys = Object.keys(routeConfig.params || {})

    this[routeName] = async (data) => {

      if (paramKeys.length > 0 && data == null) {
        throw new Error("Parameters: '" + paramKeys + "', were not provided to function: " + routeName);
      }

      // console.log({routeName, routeConfig, paramKeys, data})

      paramKeys.map(key => {

        if (routeConfig.params[key] == null && data[key] === undefined) {
          throw new Error("Parameter '" + key + "' was not provided to function: " + routeName);
        } else if (data[key] == null) {
          data[key] = routeConfig.params[key]
        }

      });

      return await this.axios.post('/' + routeName, data);
    };

  }

  handleDB(routeName, routeConfig) {
    this.handleFuncs(routeName, routeConfig);
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
  }

}


module.exports.generate = (service, config) => {
  
  switch (service) {

    case "axios":
      return new AxiosApplication(config);

    default:
      throw new Error("crossover/frontend.js: '" + "' service not found");
  }
}