/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from '../macros';

// Enum for state
const XMLHttpRequestState = {
  UNOPENED: 'UNOPENED',
  OPEN_CALLED: 'OPEN_CALLED',
  SEND_CALLED: 'SEND_CALLED',
  RESPONDED: 'RESPONDED',
};


class MockXMLHttpRequest {
  constructor() {
    // Main callback function that a real XMLHttpRequest would call when the network request comes back.
    this.onreadystatechange = null;


    // Possible values of readyState
    // These are also on the XMLHttpRequest in a real XMLHttpRequest
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState
    this.UNSENT = 0;
    this.OPENED = 1;
    this.HEADERS_RECEIVED = 2;
    this.LOADING = 3;
    this.DONE = 4;

    // The state of this request
    this.readyState = this.UNSENT;

    // Properties that are on the actuall XMLHttpRequest object
    this.statusCode = null;
    this.response = null;


    // Some additional properties, for tests
    this.method = null;
    this.url = null;
    this.isAsync = null;
    this.body = null;

    // More state, just for internal
    this.state = XMLHttpRequestState.UNOPENED;

    // Provide a refence for the tests to access the same instances of this that the file being tested uses.
    this.constructor.instance = this;
  }

  addEventListener() {

  }

  setRequestHeader() {

  }

  open(method, url, isAsync) {
    if (this.state !== XMLHttpRequestState.UNOPENED) {
      macros.critical('mock XMLHttpRequest open called when not in unopened state');
      return;
    }

    this.state = XMLHttpRequestState.OPEN_CALLED;


    this.method = method;
    this.url = url;
    this.isAsync = isAsync;
  }

  send(body) {
    if (this.state !== XMLHttpRequestState.OPEN_CALLED) {
      macros.critical('mock XMLHttpRequest open called when not in unopened state');
      return;
    }

    this.state = XMLHttpRequestState.SEND_CALLED;

    this.body = body;
  }

  // Method for the testing code to call from the test code to complete the request
  respondToRequest(statusCode, responseBody) {
    if (this.state !== XMLHttpRequestState.SEND_CALLED) {
      macros.critical('respondToRequest called out of order');
      return;
    }

    this.state = XMLHttpRequestState.RESPONDED;

    this.status = statusCode;
    this.response = responseBody;

    this.readyState = this.DONE;

    if (this.onreadystatechange) {
      this.onreadystatechange();
    }
  }
}

export default MockXMLHttpRequest;
