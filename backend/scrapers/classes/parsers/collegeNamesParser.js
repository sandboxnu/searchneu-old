/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */


 // The point of this file is to get the name of a college from the hostname of their domain
 // Eg neu.edu -> Northeastern University
 // Couple different ways to do this
 // 1. There is a data dump for 7000 Universities created in 2013 that has many colleges in it.
 //     This was found here https://inventory.data.gov/dataset/032e19b4-5a90-41dc-83ff-6e4cd234f565/resource/38625c3d-5388-4c16-a30f-d105432553a4
 //     and is rehosted here: https://github.com/ryanhugh/coursepro/blob/master/docs/universities%20in%202013.csv
 //     This file, however, sometimes lists different colleges in the same University on the spreadsheet. Probably want manually investigate if there is > 1 row that lists a given domain
 //     Might be able to find the minimum overlap in the college name
 // 2. Hit whois. This has been suprisingly unreliable over the last couple years. Sometimes the whois server switches, etc.
 // 3. Hit the website and inspect the https certificate.
 // 4. https://github.com/leereilly/swot
 // 5. https://nc.me/faq (click the button that shows list of colleges)
 // 5. Hit the website and find the <title> in the html. This is the least reliable of all of them. (Look in git history for a function that did this; it has since been removed. )
 // Once have a name for a given college, can store forever because it is not going to change.


import asyncjs from 'async';

import macros from '../../../macros';
import cache from '../../cache';
import BaseParser from './baseParser';


let whois;

const mockWhois = require('./tests/mockWhois');
const realWhois = require('whois');

if (macros.TESTS) {
  whois = mockWhois;
} else {
  whois = realWhois;
}

const staticHosts = [
  {
    includes:'Law',
    mainHost:'neu.edu',
    title:'Northeastern University Law',
    host:'neu.edu/law',
  },
  {
    includes:'CPS',
    mainHost:'neu.edu',
    title:'Northeastern University CPS',
    host:'neu.edu/cps',
  }];


class CollegeNamesParser extends BaseParser.BaseParser {


  async main(hostname) {
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get('dev_data', this.constructor.name, hostname);
      if (devData) {
        return devData;
      }
    }

    const title = await this.getTitle(hostname);

    if (macros.DEV) {
      await cache.set('dev_data', this.constructor.name, hostname, title);
      console.log('CollegeNamesParser file saved!');
    }

    return title;
  }


  // This function modifies the TERM STRING ITSELF (IT REMOVES THE PART FOUND IN THE COLLEGE NAME)
  // AND ALSO THIS FILE SHOULD ALLWAYS RETURN THE STATIC HOSTS
  // YEAH
  getHostForTermTitle(mainHost, termString) {
    for (let i = 0; i < staticHosts.length; i++) {
      const staticHost = staticHosts[i];
      if (staticHost.mainHost === mainHost && termString.includes(staticHost.includes)) {
        return {
          host:staticHost.host,
          text:termString.replace(staticHost.includes, '').replace(/\s+/gi, ' ').trim(),
        };
      }
    }
    return null;
  }


  standardizeNames(startStrip, endStrip, title) {
    //remove stuff from the beginning
    startStrip.forEach((str) => {
      if (title.toLowerCase().indexOf(str) === 0) {
        title = title.substr(str.length);
      }
    });


    //remove stuff from the end
    endStrip.forEach((str) => {
      const index = title.toLowerCase().indexOf(str);
      if (index === title.length - str.length && index > -1) {
        title = title.substr(0, title.length - str.length);
      }
    });


    // standardize the case
    title = this.toTitleCase(title);

    return title.trim();
  }


  hitWhois(host) {
    //each domain has a different format and would probably need a different regex
    //this one works for edu and ca, but warn if find a different one
    const hostSplitByDot = host.split('.');
    if (!['ca', 'edu'].includes(hostSplitByDot[hostSplitByDot.length - 1])) {
      console.log(`Warning, unknown domain ${host}`);
    }

    return new Promise((resolve, reject) => {
      // try calling apiMethod 3 times, waiting 200 ms between each retry
      asyncjs.retry({
        times: 30,
        interval: 500 + parseInt(Math.random() * 1000, 10),
      },
        (callback) => {
          whois.lookup(host, (err, data) => {
            callback(err, data);
          });
        },
        (err, data) => {
          if (err) {
            macros.error('whois error', err, host);
            reject('whois error', err);
            return;
          }


          const match = data.match(/Registrant:\n[\w\d\s&:']+?(\n)/i);

          if (!match) {
            macros.error('whois regex fail', data, host);
            reject('whois error', err);
            return;
          }

          let name = match[0].replace('Registrant:', '').trim();


          name = this.standardizeNames(['name:'], [], name);


          if (name.length < 2) {
            macros.error(err);
            reject('whois error', err);
            return;
          }

          resolve(name);
        });
    });
  }

  //hits database, and if not in db, hits page and adds it to db
  getTitle(host) {
    if (host === 'neu.edu') {
      return 'Northeastern University';
    }

    return this.hitWhois(host);
  }

}


CollegeNamesParser.prototype.CollegeNamesParser = CollegeNamesParser;
export default new CollegeNamesParser();
