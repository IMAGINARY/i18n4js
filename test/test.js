global.window = {};
var config = require('../package.json');
var expect = require('chai').expect;
var sinon = require('sinon');
var qs = require('query-string');
require('../distrib/i18n4js-' + config.version + '.min.js');

function withQueryString(params) {
  global.window.location = {};
  global.window.location.search = '?' + qs.stringify(params);
}

function simulateResponse(request) {
  if(request.url == 'tr/en.json') {
    request.respond(200, { "Content-Type": "application/json" }, JSON.stringify(require('./tr/en.json')));
  } else if(request.url == 'tr/es.json') {
    request.respond(200, { "Content-Type": "application/json" }, JSON.stringify(require('./tr/es.json')));
  } else if(request.url == 'tr/fr.json') {
    request.respond(200, { "Content-Type": "application/json" }, "{invalid json");
  } else {
    request.respond(404, {}, '');
  }
}

function simulateError(request) {
  request.error();
}

describe('i18n4js', function(){

  describe('global object', function() {
    beforeEach(function(){
      // Reset the library
      require('../distrib/i18n4js-' + config.version + '.min.js');
    });

    it('should create a global object', function(done) {
      expect(global.window.IMAGINARY.i18n).to.be.a('object');
      done();
    });

    it('should haven an init function', function(done) {
      expect(global.window.IMAGINARY.i18n.init).to.be.a('function');
      done();
    });
  });

  describe('api', function() {

    var i18n = global.window.IMAGINARY.i18n;
    var xhr = global.XMLHttpRequest = global.window.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
    var requests = [];

    before(function() {
      global.XMLHttpRequest.onCreate = function(fakeRequest) {
        requests.push(fakeRequest);
      };
    });

    beforeEach(function(){
      // Simulate XHR
      requests = [];

      // Clean the simulated query string
      withQueryString({});
    });

    it('should default to english', function(){
      var promise = i18n.init();
      expect(i18n.getLang()).to.equal('en');
      simulateResponse(requests[0]);
      return promise;
    });

    it('should use the specified default language if there is no query string parameter', function(){
      var promise = i18n.init({
        defaultLanguage: 'es'
      });
      expect(i18n.getLang()).to.equal('es');
      simulateResponse(requests[0]);
      return promise;
    });

    it('should use the language specified in the query string parameter', function() {
      withQueryString({lang: 'es'});
      var promise = i18n.init({
        defaultLanguage: 'en'
      });
      expect(i18n.getLang()).to.equal('es');
      simulateResponse(requests[0]);
      return promise;
    });

    it('should allow to customize the name of the query string parameter', function() {
      withQueryString({lang: 'en', translation: 'es'});
      var promise = i18n.init({
        defaultLanguage: 'en',
        queryStringVariable: 'translation'
      });
      expect(i18n.getLang()).to.equal('es');
      simulateResponse(requests[0]);
      return promise;
    });

    it('should allow setting the language manually', function() {
      var promise = i18n.init().then(function(){
        expect(i18n.getLang()).to.equal('en');
        var promise2 = i18n.setLang('es');
        simulateResponse(requests[1]);
        return promise2;
      }).then(function(){
        expect(i18n.getLang()).to.equal('es');
      });
      simulateResponse(requests[0]);
      return promise;
    });

    it('should return all the language strings', function() {
      var promise = i18n.init().then(function(){
        expect(i18n.getStrings()).to.deep.equal(require('./tr/en.json'));
      });
      simulateResponse(requests[0]);
      return promise;
    });

    it('should translate individual strings', function() {
      var promise = i18n.init().then(function(){
        expect(i18n.t("HELLO")).to.equal("Hi there!");
      });
      simulateResponse(requests[0]);
      return promise;
    });

    it('should return an empty string if the requested string is not translated', function() {
      var promise = i18n.init().then(function(){
        expect(i18n.t("NON_EXISTANT")).to.equal("");
      });
      simulateResponse(requests[0]);
      return promise;
    });

    it('should fail to init if the requested language does not exist', function() {
      var promise = i18n.init({
        defaultLanguage: 'ch'
      }).catch(function(err){
        expect(err).to.be.a('Error');
        expect(err.status).to.equal(404);
      });
      simulateResponse(requests[0]);
      return promise;
    });

    it('should fail to init if there\'s an error fetching the language', function() {
      var promise = i18n.init().catch(function(err){
        expect(err).to.be.a('Error');
        expect(err.status).to.be.undefined;
      });
      simulateError(requests[0]);
      return promise;
    });

    it('should fail to init if the language file is invalid', function() {
      withQueryString({lang: 'fr'});
      var promise = i18n.init().catch(function(err){
        expect(err).to.be.a('Error');
        expect(err.status).to.be.undefined;
      });
      simulateError(requests[0]);
      return promise;
    });
  });
});
