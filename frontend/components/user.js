/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import randomstring from 'randomstring';

<<<<<<< HEAD
import _ from 'lodash';
import request from './request';
import macros from './macros';
import Keys from '../../common/Keys';

=======
>>>>>>> 852a98ca6aa4105a9d83eb6252bacee748e5bd84

// Manages user data in the frontend
// Downloads the data from the server when the page first starts

// Eventually, this can be used to get the current user data from the server.

class User {
<<<<<<< HEAD
  constructor() {
    // Promise to keep track of user data.
    this.userDataPromise = null;

    // downloads the user data immediately
    this.downloadUserData();

    // holds all of the callbacks necessary for the fuuttuurree
    this.callBack = [];
  }

  // Downloads the user data from the server.
  // Send the loginKey and the facebookMessengerId (if we have it).
  // Save the facebookMessengerId when the server responds (the server can respond to this request a lot faster when given the facebookMessengerId).
  // Optional int is the number of times downloadUserData will retry downloading the user before giving up
  async downloadUserData(retry = 3) {
    // User has not logged in before, don't bother making the request
    if (!this.hasLoggedInBefore()) {
      return;
    }


    const body = {
      loginKey: this.getLoginKey(),
    };

    // If we have sender id, send that up too
    // (will make the server respond faster)
    if (window.localStorage.senderId) {
      body.senderId = window.localStorage.senderId;
    }

    let response;
    for (let i = 0; i < retry; i++) {
      response = await request.post({ //eslint-disable-line no-await-in-loop
        url: '/getUserData',
        body: body,
      });

      if (!response || !response.error) {
        break;
      }
    }

    // If error, delete local invalid data.
    if (response.error) {
      macros.log('Data in localStorage is invalid, deleting');
      this.logOut();
      return;
    }

    this.user = response.user;

    // Keep track of the sender id too.
    window.localStorage.senderId = response.user.facebookMessengerId;

    for (const callback of this.callBack) {
      callback();
    }

    macros.log('got user data');
  }

  // sends the new user data to the backend.
  async sendUserData() {
    // User has not logged in before, don't bother making the request
    if (!this.hasLoggedInBefore()) {
      return;
    }


    const body = {
      loginKey: this.getLoginKey(),
    };

    body.info = this.user;

    // If we have sender id, send that up too
    // (will make the server respond faster)
    if (window.localStorage.senderId) {
      body.senderId = window.localStorage.senderId;
    }

    const response = await request.post({
      url: '/sendUserData',
      body: body,
    });


    // If error, log it
    if (response.error) {
      macros.log('something went wrong sending data');
      return;
    }

    // calls callbacks to ensure the frontend is updated
    for (const callback of this.callBack) {
      callback();
    }

    macros.log('sending success?');
  }

=======
>>>>>>> 852a98ca6aa4105a9d83eb6252bacee748e5bd84
  // Revokes the loginKey and user user-specific data
  logOut() {
    delete window.localStorage.loginkey;
    delete window.localStorage.senderId;
  }

  // Return if the user has logged in before.
  // This doesn't mean they are currently logged in, it just means they might be logged in.
  // and we need to hit the server and check.
  hasLoggedInBefore() {
    return !!window.localStorage.loginKey;
  }

  // gets a user's (as in browser) loginKey, or generates one if it doesn't exist yet
  getLoginKey() {
    let loginKey = window.localStorage.loginKey;

    // Init the loginKey if it dosen't exist
    if (!loginKey) {
      loginKey = randomstring.generate(100);
      window.localStorage.loginKey = loginKey;
    }

    return loginKey;
  }

  // checks if the user already has the section in it
  hasSectionAlready(sectionHash) {
    if (this.user) {
      return this.user.watchingSections.includes(sectionHash);
    }
    return false;
  }

  // removes a section from a user, as well as the class if no more sections are tracked
  // in that class
  removeSection(section) {
    if (!this.user) {
      macros.error('no user for removal?');
      return;
    }


    const sectionHash = Keys.getSectionHash(section);

    if (this.user.watchingSections.includes(sectionHash)) {
      _.pull(this.user.watchingSections, sectionHash);
      // this.user.watchingSections.splice(this.user.watchingSections.indexOf(sectionHash), 1);

      const classHash = Keys.getClassHash({
        host: section.host,
        termId: section.termId,
        subject: section.subject,
        classId: section.classId,
      });

      let acc = false;
      for (let i = 0; i < this.user.watchingSections.length; i++) {
        acc = acc || this.user.watchingSections[i].includes(classHash);
      }

      if (!acc) {
        _.pull(this.user.watchingClasses, classHash);
        // this.user.watchingClasses.splice(this.user.watchingClasses.indexOf(classHash), 1);
      }
    } else {
      macros.error("removed section that doesn't exist on user?", section, this.user);
    }
  }

  // enrolls a user in a section of a class
  enrollSection(section) {
    if (!this.user) {
      macros.error('no user for addition?');
      return;
    }

    const sectionHash = Keys.getSectionHash(section);

    if (this.user.watchingSections.includes(sectionHash)) {
      macros.error('user already watching section?', section, this.user);
    }

    this.user.watchingSections.push(Keys.getSectionHash(section));

    const classHash = Keys.getClassHash({
      host: section.host,
      termId: section.termId,
      subject: section.subject,
      classId: section.classId,
    });

    if (!this.user.watchingClasses.includes(classHash)) {
      this.user.watchingClasses.push(classHash);
    }

    macros.log('user has been enrolled in section', this.user);
  }

  // registers a callback to go on the list of callbacks for a user.
  registerCallback(theCallback) {
    this.callBack.push(theCallback);
  }

  // gets rid of said callback, and all other variants of it.
  unregisterCallback(theCallback) {
    _.pull(this.callBack, theCallback);
  }
}


export default new User();
