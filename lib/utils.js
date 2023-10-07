'use strict';

/**
 * @type
 */
const require_axios = require('axios');

/**
 * Returns a list of the functions argurment names
 * 
 * @param {Function} func 
 * @returns {Array<String>}
 */
function extractArguments(func) {
  return func
      .toString()
      .match(/\(([^)]*)\)/)?.[1]
      ?.split(',')
      ?.map(arg => arg.trim())
      ?.filter(arg => arg);
}

/**
 * Converts a list of keys and values to a JavaScript object
 * 
 * @param {Array<String>} keys 
 * @param {Array<any>} values 
 * @returns {object}
 */
function createObject(keys, values) {
  return keys.reduce((acc, key) => ({
    [key]: values[key], ...acc}),
  {});
}

/**
 * Generates an Axios Instance using axios.create
 * TODO: implment some interceptors
 * 
 * @param {object} options 
 * @param {object} options.headers
 * @returns
 */
function generateAxios(options) {
  
  // Create your own instance of Axios
  const myAxios = require_axios.create({
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  // Customize your Axios instance
  myAxios.interceptors.request.use(
    config => {
      // Modify request config if needed
      // Add headers, authentication tokens, etc.
      // console.log('Request Interceptor:', config);
      return config;
    },
    error => {
      // console.error('Request Interceptor Error:', error);
      return Promise.reject(error);
    }
  );

  myAxios.interceptors.response.use(
    response => {
      // Modify response data if needed
      // console.log('Response Interceptor:', response.data);
      return response.data;
    },
    error => {
      // console.error('Response Interceptor Error:', error);
      return Promise.reject(error);
    }
  );
  
  return myAxios;
}


class Application {
  
  constructor(config) {
    this.user_config = config;
    this.crossover_config = this.loadCrossoverConfig();
  }

  loadCrossoverConfig() {

    if (this.user_config.configPath) {
      return require(this.user_config.configPath);
    }
    
    const path = require('path');

    // Construct the path to crossover.config.js in the project root
    const configPath = path.join(process.cwd(), 'crossover.config.js');

    // Load the config
    return require(configPath);
  }
}

module.exports.extractArguments = extractArguments;
module.exports.createObject = createObject;
module.exports.generateAxios = generateAxios;
module.exports.Application = Application;
