import Logger from 'pretty-logger';

let logger = new Logger({
  showTimestamp: false,
  info: "gray",
  error: "red",
  warn: "yellow",
  debug: "green",
  prefix: '[' + `Test Process`.green + ']'
});

Logger.setLevel('warning', true);


export { logger };