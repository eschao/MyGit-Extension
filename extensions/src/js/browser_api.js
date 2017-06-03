/*
 * Copyright (C) 2017 eschao <esc.chao@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *			 http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * BrowserApi class is used to hide the api differences between Chrome and
 * Firefox. We only implment a very small subset of APIs what we really use in
 * our extension.
 */
var BrowserApi = (function() {

	let UNKNOWN = -1;
	let CHROME = 0;
	let FIREFOX = 1;

	/**
	 * Constructor
	 */
	function BrowserApi() {
		// browser type
		this.type = UNKNOWN;

		// firefox browser
		if (typeof browser !== 'undefined' && browser != null) {
			this.type = FIREFOX;
			this._initFirefox();
		}
		// chrome browser
		else if (typeof chrome !== 'undefined' && chrome != null) {
			this.type = CHROME;
			this._initChrome();
		}
		// unsuportted browser
		else {
			console.warn('The browser is not supported, ' +
				'Only support Chrome and Firefox!');
		}
	}

	/**
	 * Init Chrome related APIs
	 */
	BrowserApi.prototype._initChrome = function() {
		// storage related APIs
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

		// tabs related APIs
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

		// extension related APIs
		this.extension = {
			getURL: function(path) {
				return chrome.extension.getURL(path);
			}
		};
	};

	/**
	 * Init Firefox related APIs
	 */
	BrowserApi.prototype._initFirefox = function() {
		// storage related APIs
		this.storage = {
			set: function(data, callback, error) {
				browser.storage.local.set(data).then(callback, error);
			},
			get: function(key, callback, error) {
				browser.storage.local.get(key).then(callback, error);
			},
			remove: function(key, callback, error) {
				browser.storage.local.remove(key).then(callback, error);
			}
		};

		// tab related APIs
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

		// extension related APIs
		this.extension = {
			getURL: function(path) {
				return browser.extension.getURL(path);
			}
		};
	};

	/**
	 * Is Chrome browser?
	 */
	BrowserApi.prototype.isChrome = function() {
		return this.type == CHROME;
	};

	/**
	 * Is Firefox browser?
	 */
	BrowserApi.prototype.isFirefox = function() {
		return this.type == FIREFOX;
	};

	return BrowserApi;
}());

// global browser api proxy
var browser_api = new BrowserApi();
