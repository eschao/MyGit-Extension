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

var MyGitInjector = (function() {
	'user strict';

	function MyGitInjector() {
		this.issue_injector = new IssueInjector();
		this.favorite_repos = new FavoriteReposInjector();
		//this.labels_injector = new LabelsInjector(); disable it
		this.issue_preview = new IssuePreviewInjector();
	}

	/**
	 * Try to inject appropriate function
	 *
	 * @param url Current url
	 */
	MyGitInjector.prototype._inject = function(url) {
		// try to inject issue preview if the url includes /issues/xxx or
		// /pull/xxx
		if (url.search('\/(issues|pull)\/\\d+$') > -1) {
			this.issue_preview.inject(url);
		}
		// try to inject label color list if the url ends with /labels
		// disable it in new github version since it is more complicated to handle
		// else if (url.search('\/labels$') > -1) {
		//   this.labels_injector.inject(url);
		// }
		// try to inject issue export/filter
		else if (url.search('issues(?!\/\\d+).*') > -1 ||
				url.search('labels\/.+') > -1) {
			this.issue_injector.inject(url);
		}
	};

	/**
	 * Initialize injector, install neccessary event
	 */
	MyGitInjector.prototype.install = function() {
		let self = this;

		// when window is loaded, check if we need to inject
		window.addEventListener('load', function() {
			self._inject(window.location.href);
			self.favorite_repos.inject(window.location.href);
		}, false);

		// when window state is changed, check if we need to inject
		window.addEventListener('statechange', function() {
			let state = window.history.state;
			if (state && state.url) {
				self._inject(state.url);
			}
		}, false);
	};

	return MyGitInjector;
}());

var injector = new MyGitInjector();
injector.install();
