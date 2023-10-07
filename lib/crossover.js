'use strict';

const frontend = require('./frontend');
const backend = require('./backend');

module.exports = {
  generate(type, service) {

    switch (type) {
      
      case "frontend":

        frontend.generate(service);
        break;

      case "backend":

        backend.generate(service);
        break;

      default:

        throw new Error("Generation type not Supported: " + type);
        
    }

  }
}