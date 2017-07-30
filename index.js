require('es6-promise').polyfill();
require('isomorphic-fetch');
var fs = require('fs');
var moment = require('moment');

var config = require('./config.js');
var apiKey = config.apiKey;
if (!apiKey) { throw new Error('config.apiKey required'); }

var endpoints = [
  'study-queue',
  'level-progression',
  'srs-distribution',
  'recent-unlocks',
  'critical-items',
  'radicals',
  'kanji',
  'vocabulary',
];

var results = endpoints.map((endpoint) =>
  fetch(`https://www.wanikani.com/api/v1.4/user/${apiKey}/${endpoint}/`)
    .then(response => ({
      endpoint: endpoint,
      response: response
    }))
    .then(function(result) {
      if (result.response.status >= 400) {
        console.error(result.response);
        throw new Error("Bad response from server");
      }
      return result.response.json().then(json => ({
        endpoint: result.endpoint,
        response: json,
      }));
    }))

Promise.all(results).then(results => {
  var combined = {};
  results.forEach(result => {
    combined[result.endpoint] = result.response.requested_information;
  });
  combined['user_information'] = results[0].response.user_information;
  return combined;
})
.then(combined => {
  var data = JSON.stringify(combined, null, '  ');
  var date = moment().format('YYYY-MM-DD-HHmmss');
  var filename = `data/${date}-dump.json`;
  fs.writeFile(filename, data, err => {
    if (err) { return console.error(err); }
    console.log(`File saved to ${filename}`);
  });
})
.catch(err => {console.error(err);});
