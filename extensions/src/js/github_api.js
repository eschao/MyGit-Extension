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

/**
 * GitHub Api class
 */
var GitHubApi = (function() {

	function GitHubApi() {
		this.github_token = null;
		this.github_e_token = null;
		this.zenhub_token = null;
		this.zenhub_e_token = null;

		// read configurations from browser storage
		let self = this;
		browser_api.storage.get(MYGIT_GITHUB_KEY, function(item) {
			if (item) {
				self.github_token = item[MYGIT_GITHUB_KEY];
			}
		});
		browser_api.storage.get(MYGIT_GITHUB_E_KEY, function(item) {
			if (item) {
				self.github_e_token = item[MYGIT_GITHUB_E_KEY];
			}
		});
		browser_api.storage.get(MYGIT_ZENHUB_KEY, function(item) {
			if (item) {
				self.zenhub_token = item[MYGIT_ZENHUB_KEY];
			}
		});
		browser_api.storage.get(MYGIT_ZENHUB_E_KEY, function(item) {
			if (item) {
				self.zenhub_e_token = item[MYGIT_ZENHUB_E_KEY];
			}
		});
	}

	/**
	 * Get current GitHub information
	 *
	 * @return GitHub information object which includes:
	 * {
	 *   token: github_token,
	 *   api_uri: github api uri,
	 *   repo: current repository name,
	 *   zenhub: {
	 *     token: zenhub token,
	 *     api: zenhub api uri
	 *   }
	 * }
	 * Some property is null if it is not avialable
	 */
	GitHubApi.prototype.getCurrentHub = function() {
		let url = window.location.href;
		let name = this.getRepoName();

		// is github enterprise?
		if (this.github_e_token && this.github_e_token.uri &&
				url.search('https:\/\/' + this.github_e_token.uri + '\/.*') > -1) {
			return {
				token: this.github_e_token.token,
				api_uri: this.github_e_token.uri + '/api/v3',
				repo: name,
				zenhub: {
					token: this.zenhub_e_token ? this.zenhub_e_token.token : null,
					api: this.zenhub_e_token ? this.zenhub_e_token.api: null
				}
			};
		}

		// is public github?
		if (url.search('https:\/\/github.com\/.*') > -1) {
			return {
				token: this.github_token.token,
				api_uri: 'api.github.com',
				repo: name,
				zenhub: {
					token: this.zenhub_token ? this.zenhub_token.token : null,
					api: 'api.zenhub.io'
				}
			};
		}

		return { token: null, api_uri: null, repo: name,
		         zenhub: { token: null, api: null} };
	};

	/**
	 * Get repository name
	 *
	 * @return Repository name or NULL if can't find name
	 */
	GitHubApi.prototype.getRepoName = function() {
		let el_a = document.querySelector(
			'div[class*="repohead-details-container"] strong[itemprop="name"] a');
		if (el_a && el_a.pathname) {
			let name = el_a.pathname;
			if (name[0] == '/') {
				name = name.slice(1);
			}

			if (name.slice(0, -1) == '/') {
				name = name.slice(0, -1);
			}

			return name;
		}

		return null;
	};

	/**
	 * Get repository name as dictionary
	 * The GitHub repository normally is composed by: <user/organization>/<repo>
	 *
	 * @return A dictionary object is like the below:
	 * {
	 *   name : <user name or organization name>
	 *   repo : <repository name>
	 *   full_name : original name
	 * }
	 */
	GitHubApi.prototype.getRepoNameDict = function() {
		let name = this.getRepoName();
		if (name) {
			let i = name.indexOf('/');
			if (i < 0) {
				return { user: '__empty__', repo: name, full_name: name };
			}
			else {
				return {
					user: name.substring(0, i),
					repo: name.substring(i + 1),
					full_name: name
				};
			}
		}

		return null;
	};

	return GitHubApi;
}());

var github_api = new GitHubApi();
