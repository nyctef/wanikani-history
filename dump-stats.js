require('es6-promise').polyfill();
var fs = require('fs');
var path = require('path');

function toPromise(nodeFunc) {
  function getNodeCallback(resolve, reject) {
    return function nodeCallback(err, result) {
      if (err) { return reject(err); }
      return resolve(result);
    }
  }

  return function() {
    var nodeArgs = Array.prototype.slice.call(arguments);
    return new Promise(function(resolve, reject) {
      nodeFunc(...nodeArgs, getNodeCallback(resolve, reject))
    });
  }
}

var readdir = toPromise(fs.readdir);
var readFile = toPromise(fs.readFile);
var writeFile = toPromise(fs.writeFile);

function flatten(arrays) { return [].concat.apply([], arrays); }

readdir('data/')
  .then(files => {
    return files.filter(x => x.endsWith('-dump.json'));
  })
  .then(files => {
    return Promise.all(files.map(x => readFile('data/'+x, 'utf8').then(data => ({data:data, filename:x}))));
  })
  .then(result => {
    datas = result.map(x => ({date:x.filename.substring(0, x.filename.length-'-dump.json'.length),
                             data:JSON.parse(x.data)['srs-distribution']}));
    return datas;
  })
  .then(result => {
    var levels = ['apprentice','guru','master','enlighten','burned'];
    var types = ['radicals','kanji','vocabulary'];
    result = result.map(x => {
      return [x.date, levels.map(level => types.map(type => x.data[level][type]))];
    });
    var titleRow =  ['date'].concat(flatten(levels.map(l => types.map(t => `${l} ${t}`))));
    return [titleRow].concat(result);
  })
  .then(result => {
    return result.map(x => flatten(flatten(x)));
  })
  .then(result => {
    return result.map(x => x.join(',')).join('\n');
  })
  .then(result => {
    return writeFile('data/srs-progress.csv', result);
  })
  .catch(console.error);

