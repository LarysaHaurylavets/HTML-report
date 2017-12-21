var fs = require('fs');
var path = require('canonical-path');
var _ = require('lodash');
var xlsx = require('excel4node');


// Custom reporter
var Reporter = function (options) {
  var _defaultOutputFile = path.resolve(process.cwd(), './_test-output', 'protractor-results.xlsx');
  options.outputFile = options.outputFile || _defaultOutputFile;

  //Create an instance of a Workbook class
  var workbook = new xlsx.Workbook();

  //Add Worksheet to the workbook
  var worksheet = workbook.addWorksheet('Sheet 1');

  //Create a style
  var styleForSheet = workbook.createStyle({
    font: {
      bold: true,
      color: '#7708B2',
      size: 12
    },
    numberFormat: 'yyyy-mm-dd hh:mm:ss',
    alignment: {
      horizontal: 'center'
    }
  });

  //Set custom widths and heights of columns/rows
  worksheet.column(1).setWidth(50);
  worksheet.row(1).setHeight(20);

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

  };

  this.specDone = function (spec) {
    var currentSpec = {
      description: spec.description,
      status: spec.status
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
    workbook.write(outputFile);
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

  function initOutputFile(outputFile) {
    ensureDirectoryExistence(outputFile);
    worksheet.cell(1, 1).string('Protractor results for: ' + (new Date()).toLocaleString()).style(styleForSheet);
    workbook.write(outputFile);
  }

  // for output file output
  function formatOutput(output) {
    worksheet.cell(2, 1).string('AppDir:' + output.appDir).style(styleForSheet);
    output.suites.forEach(function (suite) {
    worksheet.cell(3, 1).string('Suite:' + suite.description + ' -- ' + suite.status).style(styleForSheet);
    suite.specs.forEach(function (spec) {
    worksheet.cell(4, 1).string(spec.status + ' - ' + spec.description).style(styleForSheet);
      if (spec.failedExpectations) {
         spec.failedExpectations.forEach(function (fe) {
         worksheet.cell(5, 1).string('message: ' + fe.message);
        });
      }
    });
    });
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
