package main

import 'fmt';

struct ConfigParser {
  input_path: string;
  output_path: string;
  input_type: string, default: 'js:axios';
  output_type: string, default: 'swagger';
};

struct Arguments extends map {
  
};

struct FunctionType {
  name: string;
  arguments: Arguments;
};

func main() {

  config := ConfigParser();

  err := config.validate();
  if err != nil {
    panic(err);
  }

  loadInput(config.input_type, config.input_path);
}