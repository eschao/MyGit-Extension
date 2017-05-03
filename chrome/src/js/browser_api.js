/*
 * Copyright (C) 2017 eschao <esc.chao@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var BrowserApi = (function() {

  function BrowserApi() {
    this.type = "unsupported";

    if (window.browser) {
      this.type = "firefox";
      this._initFirefox();
    }
    else if (window.chrome) {
      this.type = "chrome";
      this._initChrome();
    }
    else {
      console.log("The browser is not supported, " +
        "Only support Chrome and Firefox!");
    }
  }

  BrowserApi.prototype._initChrome = function() {
    this.storage = {
      set: function(data, callback) {
        chrome.storage.sync.set(data, callback);
      },
      get: function(key, callback) {
        chrome.storage.sync.get(key, callback);
      },
      remove: function(key, callback) {
        chrome.storage.sync.remove(key, callback);
      }
    };

    this.tabs = {
      create: function(props, callback) {
        chrome.tabs.create(props, callback);
      },
      onUpdated: {
        addListener: function(l) {
          chrome.tabs.onUpdated.addListener(l);
        }
      }
    };
  }

  BrowserApi.prototype._initFirefox = function() {
    this.storage = {
      set: function(data, callback, error) {
        browser.storage.local.set(data).then(callback, error);
      },
      get: function(key, callback, error) {
        browser.storage.local.get(key).then(callback, error);
      },
      remove: function(key, callback, error) {
        browser.storage.remove(key).then(callback, error);
      }
    };

    this.tabs = {
      create: function(props, callback, error) {
        browser.tabs.create(props).then(callback, error);
      },
      onUpdated: {
        addListener: function(l) {
          browser.tabs.onUpdated.addListener(l);
        }
      }
    };
  }

  BrowserApi.prototype.isChrome = function() {
    return this.type == "chrome";
  }

  BrowserApi.prototype.isFirefox = function() {
    return this.type = "firefox";
  }

  return BrowserApi;
}());

var browser_api = new BrowserApi();
