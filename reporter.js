var fs = require('fs');
var path = require('canonical-path');
var _ = require('lodash');


// Custom reporter
var Reporter = function (options) {

//for html document
var indexHtmlFile = './node_modules/html-reporter/index.html';
var specAll = 0;
var specFailed = 0;
var specPassed = 0;

var _defaultOutputFile = path.resolve(process.cwd(), './_test-output', 'protractor-results.html');
options.outputFile = options.outputFile || _defaultOutputFile;

initOutputFile(options.outputFile);
options.appDir = options.appDir || './';
var _root = { appDir: options.appDir, suites: [] };
log('AppDir: ' + options.appDir, +1);
var _currentSuite;

this.suiteStarted = function (suite) {
_currentSuite = { description: suite.description, status: null, specs: [] };
_root.suites.push(_currentSuite);
log('Suite: ' + suite.description, +1);
};

this.suiteDone = function (suite) {
  var statuses = _currentSuite.specs.map(function (spec) {
    return spec.status;
  });

  statuses = _.uniq(statuses);
  var status = statuses.indexOf('failed') >= 0 ? 'failed' : statuses.join(', ');
  _currentSuite.status = status;
    log('Suite ' + _currentSuite.status + ': ' + suite.description, -1);
  };


  this.specStarted = function (spec) {
    specAll++;
  };

  this.specDone = function (spec) {

    var screenshotDir = path.dirname(options.outputFile)+'/screens/_';
    var screenshotName = screenshotDir+spec.description.replace(/\s+/g,"_")+'.png';

    //take a screenshot
    browser.takeScreenshot().then(function(png) {
      var stream = fs.createWriteStream(screenshotName);
      stream.write(new Buffer(png, 'base64'));
      stream.end();
    });

    var currentSpec = {
      description: spec.description,
      status: spec.status,
      img: screenshotName
    };

    if (spec.failedExpectations.length > 0) {
      currentSpec.failedExpectations = spec.failedExpectations;
    }


    _currentSuite.specs.push(currentSpec);
    log(spec.status + ' - ' + spec.description);
  };


  this.jasmineDone = function () {
    outputFile = options.outputFile;
    var output = formatOutput(_root);
    fs.appendFileSync(outputFile, output);
  };

  function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (directoryExists(dirname)) {
      return true;
    }

    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);

  }

  function directoryExists(path) {
    try {
      return fs.statSync(path).isDirectory();
    }
    catch (err) {
      return false;
    }
  }

//function for read index.html
function readHtmlFile(htmlFile){
  return fs.readFileSync(htmlFile, 'UTF-8');
}

function initOutputFile(outputFile) {
  ensureDirectoryExistence(outputFile);
  var htmlFile = readHtmlFile(indexHtmlFile);
  var header = "<div>Protractor results for: " + (new Date()).toLocaleString() + '</div>';
  fs.writeFileSync(outputFile, htmlFile+header, 'UTF-8');
}

// for output file output
  function formatOutput(output) {
    var indent = '  ';
    var pad = '  ';
    var results = [];
    results.push('AppDir:' + output.appDir);
    results.push('<h3>Total tests:'+ specAll);
    results.push('<p>Passed tests:<div class="passed">'+specPassed+'</div></p>');
    results.push('<p>Failed tests:<div class="failed">'+specFailed+'</div></p>');
    
    output.suites.forEach(function (suite) {
      
      results.push('<p>' + 'Suite: ' + suite.description + ' -- ' + suite.status+'</p><hr>');
      pad += indent;
      suite.specs.forEach(function (spec) {       
        results.push('<p>' + spec.description+'<div class="passed">'+spec.status + '</div> </p>');
        results.push('<img src='+spec.img+'  width="1360" height="768"/>');

        if (spec.failedExpectations) {
          pad += indent;
          spec.failedExpectations.forEach(function (fe) {          
            results.push('<p><div class="failed">message: ' + fe.message+'</div></p>');
          });
          
        }
      });

      results.push('</div></BODY></HTML>');
      results.push('');
    });

    results.push('');
    return results.join('\n');
  }


// for console output
var _pad;
  function log(str, indent) {
    _pad = _pad || '';
    if (indent == -1) {
      _pad = _pad.substr(2);
    }

    console.log(_pad + str);
    if (indent == 1) {
      _pad = _pad + '  ';
    }
   }

};

module.exports = Reporter;
