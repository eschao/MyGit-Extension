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
 * Issue preview injector class
 */
var IssuePreviewInjector = (function() {
	'use strict';

	// constants
	let MAX_INTERVAL_COUNT = 100;
	let INTERVAL_TIME = 100;
	let MAX_PREVIEW_SIZE = { width: 600, height: 600 };
	let SHOW_PREVIEW_TIMEOUT = 1000;
	let CLOSE_PREVIEW_TIMEOUT = 500;

	function IssuePreviewInjector() {
		// injection timer
		this.timer = { injector: null, close_preview_dialog : null };
		// use to dynamically draw arrow of preview dialog
		this.style_sheet = null;

		// render issue content handlers
		this.renders = {
			// render issue title
			'mg-issue-title': function(el, json) {
				el.innerHTML =
						'<a href="' + json.html_url + '" class="mg-issue-a" ' +
						'target="_blank"> <span class="mg-issue-number">#' + json.number +
						'</span>&nbsp;' + StrUtils.escapeHTML(json.title) + '</a>';
			},
			// render issue state: Open or Closed
			'mg-issue-state': function(el, json) {
				if (json.state) {
					if (json.state == 'closed') {
						el.innerHTML = '<i class="mg-octicon-closed mg-issue-state-icon">' +
								'</i>Closed';
						el.style.background = '#cb2431';
					}
					else {
						el.innerHTML = '<i class="mg-octicon-opened mg-issue-state-icon">' +
								'</i>' + json.state.charAt(0).toUpperCase() +
								json.state.slice(1);
						el.style.background = '#2cbe4e';
					}
				}
			},
			// render issue state description: <who> opened this issue xxx days ago
			'mg-issue-state-desc': function(el, json) {
				if (json.closed_at && json.closed_by) {
					el.innerHTML = '<a href="' + json.closed_by.html_url + '" ' +
							'class="mg-issue-a mg-f-bold" target="_blank">' +
							StrUtils.escapeHTML(json.closed_by.login) +
							'</a> closed this issue ' + DateUtils.daysPassed(json.closed_at)
							+ ' days ago ';
				}
				else {
					el.innerHTML = '<a href="' + json.user.html_url + '" ' +
							'class="mg-issue-a mg-f-bold" target="_blank">' +
							StrUtils.escapeHTML(json.user.login) + '</a> opend this issue ' +
							DateUtils.daysPassed(json.created_at) + ' days ago ';
				}
			},
			// render issue milestone
			'mg-issue-milestone': function(el, json) {
				if (json.milestone) {
					el.style.display = 'flex';
					el.getElementsByTagName('label')[0].innerHTML =
							'<a href="' + json.milestone.html_url + '" class="mg-issue-a" ' +
							'target="_blank">' + StrUtils.escapeHTML(json.milestone.title) +
							'</a>';

					// render completion percentage
					let pct = 0;
					let el_pct = el.querySelector('span[id="mg-issue-progress-pct"]');
					if (json.milestone.open_issues != null &&
							json.milestone.closed_issues != null) {
						let opened = Number(json.milestone.open_issues);
						let closed = Number(json.milestone.closed_issues);
						pct = closed / (opened + closed) * 100;
						el_pct.style.width = pct + '%';
					}
					else {
						el_pct.style.width = '0';
					}
				}
				else {
					el.style.display = 'none';
				}
			},
			// render issue assignees
			'mg-issue-assignees': function(el, json) {
				// clean old assignees
				let el_imgs = el.getElementsByTagName('a');
				while (el_imgs.length > 0) {
					el.removeChild(el_imgs[0]);
				}

				if (json.assignees && json.assignees.length > 0) {
					el.style.display = 'flex';
					for (let i = 0; i < json.assignees.length; ++i) {
						let user = json.assignees[i];
						let el_a = document.createElement('a');
						el_a.href = user.html_url;
						el_a.target = '_blank';
						el_a.className = 'mg-issue-a';
						el_a.innerHTML = '<img alt="@' + StrUtils.escapeHTML(user.login) +
								'" class="avatar ' + 'mg-issue-avatar" width="20" height="20"' +
								' src="' + user.avatar_url + '">';
						el.appendChild(el_a);
					}
				}
				else {
					el.style.display = 'none';
				}
			},
			// render isseu labels
			'mg-issue-labels': function(el, json) {
				// clean old labels
				let el_div = el.querySelector('div[id="mg-issue-all-labels"]');
				let el_labels = el_div.getElementsByTagName('label');
				while (el_labels.length > 0) {
					el_div.removeChild(el_labels[0]);
				}

				if (json.labels && json.labels.length) {
					el.style.display = 'flex';
					for (let i = 0; i < json.labels.length; ++i) {
						let label = json.labels[i];
						let el_label = document.createElement('label');
						el_label.className = 'mg-issue-label mg-f-normal';
						el_label.style.background = '#' + label.color;

						let index = label.url.indexOf('\/repos\/');
						let url = index > -1 ? label.url.slice(index + 6) : label.url;
						let color = ColorUtils.getLuma(label.color) > 160 ?
								'style="color:black"' : '';
						el_label.innerHTML = '<a href="' + url + '" class="mg-issue-a" ' +
								'target="_blank" ' + color + '>' +
								StrUtils.escapeHTML(label.name) + '</a>';
						el_div.appendChild(el_label);
					}
				}
				else {
					el.style.display = 'none';
				}
			},
			// if no milestone/labels/assignees, the divider need to be hidden
			'mg-issue-misc-divider': function(el, json) {
				if (json.milestone ||
						(json.assignees && json.assignees.length > 0) ||
						(json.labels && json.labels.length > 0)) {
					el.style.display = 'flex';
				}
				else {
					el.style.display = 'none';
				}
			},
			// render issue comments number
			'mg-issue-comments-number': function(el, json) {
				el.innerHTML = StrUtils.escapeHTML(json.comments + ' Comments');
			},
			// render issue body
			'mg-issue-body': function(el, json) {
				el.innerHTML = StrUtils.escapeHTML(json.body || '');
			}
		};
	}

	/**
	 * Show loading message in preview dialog
	 *
	 * @param el_root Root DOM element of preview dialog
	 * @param el_anchor Anchor element where preview dialog docks on
	 */
	IssuePreviewInjector.prototype._showLoading = function(el_root, el_anchor) {
		let el_loading = el_root.querySelector('div[id="mg-issue-loading"]');
		let el_issue = el_root.querySelector('div[id="mg-issue-content"]');

		el_loading.style.display = 'block';
		el_issue.style.display = 'none';
		let max_size = { width: 120, height: 80 };
		this._dockPreviewDialog(el_root, el_anchor, el_issue, max_size);
	};

	/**
	 * Show loading error message
	 *
	 * @param el_root Root DOM element of preview dialog
	 * @param err_code Error code returning from fetching issue
	 */
	IssuePreviewInjector.prototype._showLoadingError =
	function(el_root, err_code) {
		let el_loading = el_root.querySelector('div[id="mg-issue-loading"]');
		let el_msg = el_loading.getElementsByTagName('label')[0];
		el_msg.innerHTML = "Can't load issue with error: " + err_code;
	};

	/**
	 * Dock issue preview dialog on given anchor element
	 *
	 * @param el_root Root DOM element of preview dialog
	 * @param el_anchor Anchor element where preview dialog docks on
	 * @param el_issue Root element of issue content
	 * @param max_dialog_size Max width and height of preview dialog
	 */
	IssuePreviewInjector.prototype._dockPreviewDialog =
	function(el_root, el_anchor, el_issue, max_dialog_size) {
		let screen_r = DomUtils.getElementScreenRect(el_anchor);
		let client_r = el_anchor.getBoundingClientRect();

		// viewport size of browser
		let view_size = {
			width: document.documentElement.clientWidth,
			height: document.documentElement.clientHeight,
		};

		// middle point x on anchor element
		client_r.middle_x = client_r.left + client_r.width / 2;

		// where to dock preview dialog?
		// where.top: if true, dock on the top of anchor element, otherwise dock
		//		under it
		// where.left: if true, dock on the left of anchor element, otherwise dock
		//		on the right of it
		// where.middle, if true, the middle point x of preview dialog is same with
		//		the middle point of anchor element
		let where = {
			top: client_r.top > (view_size.height- client_r.bottom),
			left: client_r.left > (view_size.width - client_r.right),
			middle: (client_r.middle_x > max_dialog_size.width / 2) &&
				((view_size.width - client_r.middle_x) > max_dialog_size.width / 2)
		};

		// the value of css: .mg-issue-preview::after which is used to draw arrow,
		// since the arrow orientation is following the preview dialog position,
		// its css value need to be dynamically computed and set
		let after = {
			css:'content:""; position:absolute; width:0; height:0; ' +
					'box-size:border-box; border:8px solid black; ' +
					'transform-origin:0 0; -moz-transform-origin:0 0; ' +
					'-webkit-transform-origin:0 0; -ms-transform-origin:0 0; ' +
					'border-color:transparent transparent #fff #fff;',
			rotate: '',
			box_shadow: '',
			position: ''
		};

		// translate params for preview dialog
		let translate = { x: '0', y: '0' };

		// dock on the middle of anchor
		if (where.middle) {
			let calc = '(50% ' + (where.top ? '-' : '+') + ' 10px)';
			after.position += 'left:calc' + calc + '; -moz-calc' + calc +
					'; -webkit-calc' + calc + '; -o-calc' + calc + ';';
			el_root.style.left = client_r.middle_x + 'px';
			translate.x = '-50%';
		}
		// dock on the left of anchor
		else if (where.left) {
			let right = client_r.right + max_dialog_size.width / 2;
			if (right > view_size.width - 4) {
				right = view_size.width - 4;
			}

			let pos = right - client_r.right + (where.top ? 8 : -16);
			after.position += 'right:' + pos + 'px;';
			el_root.style.right = (view_size.width - right) + 'px';
			el_root.style.left = 'auto';
		}
		// dock on the right of anchor
		else {
			let left = client_r.middle_x - max_dialog_size.width / 2;
			if (left < 4) {
				left = 4;
			}
			let pos = client_r.middle_x - left + (where.top ? -10 : 10);
			after.position += 'left:' + pos + 'px;';
			el_root.style.left = left + 'px';
			el_root.style.right = 'auto';
		}

		// dock on the top of anchor
		let max_height = max_dialog_size.height;
		if (where.top) {
			after.rotate = 'transform:rotate(-45deg); -moz-transform:rotate(-45deg);'
					+ ' -webkit-transform:rotate(-45deg); -ms-transform:rotate(-45deg);';
			after.box_shadow = 'box-shadow:-2px 2px 1px 0 rgba(0, 0, 0, 0.04), ' +
					'-4px 4px 3px 0 rgba(0, 0, 0, 0.16);';
			after.position += 'bottom:-15px;';
			el_root.style.top = (screen_r.top - 10) + 'px';
			translate.y = '-100%';

			// make sure preview dialog is shown in visible area
			if (screen_r.top < max_dialog_size.height + 34) {
				max_height = screen_r.top - 34;
			}
		}
		// dock under of anchor
		else {
			after.rotate = 'transform:rotate(135deg); -moz-transform:rotate(135deg);'
					+ ' -webkit-transform:rotate(135deg); -ms-transform:rotate(135deg);';
			after.box_shadow = 'box-shadow:-1px 1px 1px 0 rgba(0, 0, 0, 0.2); ';
			after.position += 'top:1px;';
			el_root.style.top = (screen_r.bottom + 16) + 'px';

			// make sure preview dialog is shown in visible area
			let scroll_height = document.documentElement.scrollHeight;
			if (screen_r.bottom + 40 + max_dialog_size.height > scroll_height) {
				max_height = scroll_height - 40 - screen_r.bottom;
			}
		}

		// set dialog transform style
		el_root.style.transform = 'translate(' + translate.x + ',' +
				translate.y + ')';
		el_issue.style.maxHeight = max_height + 'px';

		// clean old css style and set new one
		DomUtils.cleanStylesheet(this.style_sheet);
		DomUtils.addCSSRule(this.style_sheet, '.mg-issue-preview:after',
				after.css + after.position + after.rotate + after.box_shadow, 0);
	};

	/**
	 * Preview issue content
	 *
	 * @param el_root Root DOM element of preview dialog
	 * @param el_anchor Anchor DOM element where preview dialog docks on
	 * @param json Issue json data
	 */
	IssuePreviewInjector.prototype._previewIssue =
	function(el_root, el_anchor, json) {
		let el_loading = el_root.querySelector('div[id="mg-issue-loading"]');
		let el_issue = el_root.querySelector('div[id="mg-issue-content"]');

		// if uri is not matched, don't show the issue json, becuase it maybe is
		// the old issue from outdated request
		if (json && !json.html_url.endsWith(el_anchor.pathname)) {
			return;
		}

		// show preview dialog with issue content
		el_loading.style.display = 'none';
		el_issue.style.display = 'flex';
		this._dockPreviewDialog(el_root, el_anchor, el_issue, MAX_PREVIEW_SIZE);

		// update issue content if need
		if (json) {
			let el_ids = el_root.querySelectorAll('*[id^="mg-issue-"]');
			for (let i = 0; i < el_ids.length; ++i) {
				let id = el_ids[i].id;
				if (this.renders[id]) {
					this.renders[id](el_ids[i], json);
				}
			}

			// update issue url
			el_root.setAttribute('mg-issue-uri', json.html_url);
		}
	};

	/**
	 * Init preview dialog after it is created
	 *
	 * @param el_root Root element of preview dialog
	 */
	IssuePreviewInjector.prototype._initPreviewDialog =
	function(el_root, el_anchor) {
		// click event for close button
		let el_close = el_root.querySelector('i[id="mg-issue-close"]');
		el_close.style.cursor = 'pointer';
		el_close.onclick = function() {
			el_root.style.display = 'none';
		};

		// close dialog when mouse is moving outside of it
		let self = this;
		el_root.onmouseout = function(e) {
			if (!el_root.contains(e.toElement) &&
					el_anchor != e.toElement) {
				self._onClosePreview(el_root);
			}
			else if (self.timer.close_preview_dialog) {
				clearTimeout(self.timer.close_preview_dialog);
				self.close_preview_dialog = null;
			}
		};

		// clear close dialog timer
		el_root.onmouseover = function() {
			if (self.timer.close_preview_dialog) {
				clearTimeout(self.timer.close_preview_dialog);
				self.timer.close_preview_dialog = null;
			}
		};
	};

	/**
	 * Create preview dialog
	 *
	 * @param el_anchor Anchor element where preview dialog docks on
	 */
	IssuePreviewInjector.prototype._createPreviewDialog = function(el_anchor) {
		// create root element
		let el_root = document.createElement('div');
		el_root.className = 'mg-issue-preview';
		el_root.id = 'mg-issue-preview';
		el_root.style.maxWidth = MAX_PREVIEW_SIZE.width + 'px';
		this.style_sheet = DomUtils.createStylesheet('mg-style-sheet');

		// load preview dialog html template
		let self = this;
		let xhr = new XMLHttpRequest();
		xhr.open('GET',
			 browser_api.extension.getURL('templates/issue_preview_dialog.html'),
			 true);
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				el_root.innerHTML = this.responseText;
				document.body.appendChild(el_root);
				self._initPreviewDialog(el_root, el_anchor);
				self._showLoading(el_root, el_anchor);
			}
		};
		xhr.send();
		return el_root;
	};

	IssuePreviewInjector.prototype._onShowPreview = function(el_anchor) {
		let hub = github_api.getCurrentHub();
		if (!hub.token || !hub.api_uri || !hub.repo) {
			return;
		}

		// check preview dialog
		let pathname = el_anchor.pathname;
		let el_root = document.getElementById('mg-issue-preview');
		if (el_root) {
			// check if the issue is loaded in preview dialog
			let uri = el_root.getAttribute('mg-issue-uri');
			if (uri && uri.endsWith(pathname)) {
				el_root.style.display = null;
				this._previewIssue(el_root, el_anchor, null);
				return;
			}

			// show loading message
			this._showLoading(el_root, el_anchor);
			el_root.style.display = null;
		}
		else {
			// create preview dialog
			el_root = this._createPreviewDialog(el_anchor);
		}

		// send request to fetch issue content
		let self = this;
		let url = 'https://' + hub.api_uri + '/repos' + pathname;
		let xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.setRequestHeader('Accept', 'application/vnd.github.mercy-preview+json');
		xhr.setRequestHeader('Authorization', 'token ' + hub.token);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					self._previewIssue(el_root, el_anchor, JSON.parse(xhr.responseText));
				}
				else {
					self._showLoadingError(xhr.status);
				}
			}
		};
		xhr.send();
	};

	/**
	 * Close preview dialog
	 *
	 * @param el_root Root element of preview dialog
	 */
	IssuePreviewInjector.prototype._onClosePreview = function(el_root) {
		let self = this;
		this.timer.close_preview_dialog = setTimeout(function() {
			let el_loading = el_root.querySelector('div[id="mg-issue-loading"]');
			el_loading.style.display = 'none';
			el_loading.setAttribute('mg-issue-uri', null);
			el_root.style.display = 'none';
			self.timer.close_preview_dialog = null;
		}, CLOSE_PREVIEW_TIMEOUT);
	};

	/**
	 * Try to inject preview dialog
	 */
	IssuePreviewInjector.prototype._tryInjectPreview = function() {
		let el_form = document.querySelector('form[class="js-new-comment-form"]');

		if (el_form && this._matchUrl(window.location.href)) {
			let self = this;
			let el_links = document.getElementsByTagName('a');
			for (let i = 0; i < el_links.length; ++i) {
				// check if <a> is a issue link, the current issue link will be ignored
				let el_a = el_links[i];
				if (!el_a.href ||
						window.location.href.includes(el_a.pathname) ||
						el_a.href.search('\/issues\/\\d+$') < 0) {
					continue;
				}

				// when mouse is over link
				var timer;
				el_a.onmouseover = function() {
					if (!timer) {
						timer = setTimeout(function() {
							self._onShowPreview(el_a);
							timer = null;
						}, SHOW_PREVIEW_TIMEOUT);
					}
				};

				// when mouse is moving outside of link
				el_a.onmouseout = function() {
					if (timer) {
						clearTimeout(timer);
						timer = null;
					}
					else {
						let el_root = document.getElementById('mg-issue-preview');
						if (el_root) {
							self._onClosePreview(el_root);
						}
					}
				};
			}

			return true;
		}

		return false;
	};

	/**
	 * Match the url to determine if it can be injected?
	 */
	IssuePreviewInjector.prototype._matchUrl = function(url) {
		if (url) {
			// is public github url?
			if (github_api.github_token && github_api.github_token.token) {
				let uri = 'https:\/\/github.com\/.*\/.*\/';
				if (url.search(uri + '(issues|pull)\/\\d+$') > -1) {
					return true;
				}
			}

			// is github enterprise url?
			if (github_api.github_e_token && github_api.github_e_token.token) {
				let uri = 'https:\/\/' + github_api.github_e_token.uri + '\/.*\/.*\/';
				if (url.search(uri + '(issues|pull)\/\\d+$') > -1) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Inject preview dialog
	 */
	IssuePreviewInjector.prototype.inject = function(url) {
		if (this.timer.injector) {
			clearInterval(this.timer.injector);
			this.timer.injector = null;
		}

		if (this._matchUrl(url)) {
			let self = this;
			var count = 0;
			this.timer.injector = setInterval(function() {
				if (self._tryInjectPreview() || ++count > MAX_INTERVAL_COUNT ||
						!self._matchUrl(window.location.href)) {
					clearInterval(self.timer.injector);
					self.timer.injector = null;
				}
			}, INTERVAL_TIME);
		}
	};

	return IssuePreviewInjector;
}());
