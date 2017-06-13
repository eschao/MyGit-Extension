/*
 * Copyright (C) 2017 eschao <esc.chao@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Issue export dialog class
 */
var _export_config = {};
browser_api.storage.get(MYGIT_GITHUB_ISSUE_EXPORT_KEY, function(item) {
	let config = item ? item[MYGIT_GITHUB_ISSUE_EXPORT_KEY] : null;
	if (config && config.headers) {
		_export_config = config;
	}
	else {
		_export_config = {
			'delimiter': ',',
			'gen_headers': true,
			'label': { 'expand': true, 'delimiter': '|' },
			'headers': [
				{ 'name': 'number', 'title': 'Issue No', 'enable': true },
				{ 'name': 'state', 'title': 'State', 'enable': true },
				{ 'name': 'title', 'title': 'Title', 'enable': true },
				{ 'name': 'assignee', 'title': 'Assignee', 'enable': true },
				{ 'name': 'user', 'title': 'Author', 'enable': true },
				{ 'name': 'milestone', 'title': 'Milestone', 'enable': true },
				{ 'name': 'labels', 'title': 'Labels', 'enable': true },
				{ 'name': 'estimate', 'title': 'Estimate', 'enable': false },
				{ 'name': 'pipeline', 'title': 'Pipeline', 'enable': false },
				{ 'name': 'is_epic', 'title': 'Is Epic', 'enable': false }
			]
		};
	}
});

var IssueExportDialog = (function() {
	'use strict';

	let DELIMITER = ',';
	let TBL_HEADERS_DIV_ID = 'mg-table-headers';
	let GEN_TBL_HEADER_ID = 'mg-gen-headers';
	let CSV_DELIMITER_ID = 'mg-csv-delimiter';
	let EXPAND_LABELS_ID = 'mg-expand-labels';
	let LABEL_DELIMITER_ID = 'mg-label-delimiter';
	let MESSAGE_ID = 'mg-message';

	/**
	 * Constructor
	 */
	function IssueExportDialog() {
		// use drag & drop to adjust issue headers
		this._init();
		this._closed = true;
	}

	/**
	 * Init configuration from browser storage
	 */
	IssueExportDialog.prototype._init = function() {
		this.parser = {
			// issue number parser
			'number': function(item) {
				return item.number;
			},
			// issue state parser
			'state': function(item) {
				return item.state;
			},
			// issue titler parser
			'title': function(item) {
				return item.title;
			},
			// issue assignee parser
			'assignee': function(item) {
				let s = '';
				if (item.assignee) {
					item.assignees.forEach(function(a) {
						s += a.login + ' ';
					});
					s = s.slice(0, -1);
				}

				return s;
			},
			// issue user(author) parser
			'user': function(item) {
				return item.user.login;
			},
			// issue milestone parser
			'milestone': function(item) {
				return item.milestone ? item.milestone.title : '';
			},
			// issue labels parser
			'labels': function(item, delimiter, expand, exports) {
				// expand labels, which means every label is a column in csv
				if (expand) {
					Object.keys(exports.labels).forEach(function(l) {
						exports.labels[l] = '';
					});

					let labels = {};
					if (item.labels) {
						item.labels.forEach(function(l) {
							exports.labels[l.name] = l.name;
							labels[l.name] = l.name;
						});
					}

					return labels;
				}
				// don't expand labels, which means all labels are in one column in csv
				else {
					if (item.labels == null) {
						return '';
					}

					let labels = [];
					item.labels.forEach(function(l) {
						labels.push(l.name);
					});

					return labels.sort().join(delimiter);
				}
			},
			// estimate - zenhub
			'estimate': function(item) {
				return item['estimate'] ? item.estimate.value : 0;
			},
			// pipeline - zenhub
			'pipeline': function(item) {
				return item['pipeline'] ? item.pipeline.name : '';
			},
			// is epic - zenhub
			'is_epic': function(item) {
				return (item['is_epic'] !== null) ? item.is_epic : false;
			}
		};
	};

	/**
	 * Show message
	 *
	 * @param msg message
	 * @param is_error True if message is error and will be showed with red color
	 */
	IssueExportDialog.prototype.showMessage = function(msg, is_error) {
		let el_msg = document.getElementById(MESSAGE_ID);
		if (el_msg && el_msg.style) {
			el_msg.style.color = is_error ? 'red' : 'blue';
			el_msg.innerText = msg || '';
		}
	};

	/**
	 * Show export dialog
	 */
	IssueExportDialog.prototype.show = function() {
		let root = document.createElement('div');
		root.className = 'mg-dialog-center mg-flex';
		root.setAttribute('id', 'mg-export-dialog');

		// read export dialog html and initiate
		let self = this;
		let xhr = new XMLHttpRequest();
		xhr.open('GET',
		         browser_api.extension.getURL('templates/issue_export_dialog.html')
		         , true);
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				root.innerHTML = this.responseText;
				document.body.appendChild(root);
				self.initDialog(root);
			}
		};
		xhr.send();
	};

	/**
	 * Init export dialog
	 *
	 * @param root Root element of dialog
	 */
	IssueExportDialog.prototype.initDialog = function(root) {
		this._closed = false;
		// init generate headers
		let el_gen_headers = document.getElementById(GEN_TBL_HEADER_ID);
		el_gen_headers.checked = _export_config.gen_headers;

		// init csv delimiter
		let el_delimiter = document.getElementById(CSV_DELIMITER_ID);
		el_delimiter.value = _export_config.delimiter;

		// init expand labels
		let el_expand_labels = document.getElementById(EXPAND_LABELS_ID);
		el_expand_labels.checked = _export_config.label.expand;

		// init label delimiter
		let el_label_delimiter = document.getElementById(LABEL_DELIMITER_ID);
		el_label_delimiter.value = _export_config.label.delimiter;

		// close export dialog
		let self = this;
		let el_close = document.getElementById('mg-close');
		let win_click = function(e) {
			if (e.target != root && !root.contains(e.target)) {
				el_close.onclick();
			}
		};
		window.addEventListener('click', win_click, false);
		el_close.onclick = function() {
			window.removeEventListener('click', win_click, false);
			self.storeConfig();
			self._closed = true;
			document.body.removeChild(root);
		};

		// toggle table header
		let onToggleHeader = function() {
			if (this.className.indexOf('mg-header-disable') != -1) {
				this.className = this.className.replace(' mg-header-disable', '');
				this.setAttribute('enable', 'true');
			}
			else {
				this.className += ' mg-header-disable';
				this.setAttribute('enable', 'false');
			}
		};

		let headers = document.getElementById(TBL_HEADERS_DIV_ID)
		                      .getElementsByTagName('div');
		for (let i = 0; i < headers.length; ++i) {
			headers[i].onclick = onToggleHeader;
			headers[i].setAttribute('name', _export_config.headers[i].name);
			headers[i].innerHTML = _export_config.headers[i].title;
			headers[i].setAttribute('enable', _export_config.headers[i].enable
			                                      .toString());
			if (!_export_config.headers[i].enable) {
				headers[i].className += ' mg-header-disable';
			}
		}

		// init drag & drop
		let drag_drop = new DragDrop();
		drag_drop.init(headers);

		// onclick of expand label
		el_expand_labels.onclick = function() {
			let div = document.getElementById('mg-label-delimter-d');
			if (this.checked) {
				div.style.color = 'lightgray';
				el_label_delimiter.disabled = true;
			}
			else {
				div.style = null;
				el_label_delimiter.disabled = false;
			}
		};
		el_expand_labels.onclick();

		// click event for export button
		document.getElementById('mg-start-export-btn').onclick = function(e) {
			e.preventDefault();
			self.export();
		};
	};

	/**
	 * Save configurations to browser storage
	 */
	IssueExportDialog.prototype.storeConfig = function() {
		let gen_headers = document.getElementById(GEN_TBL_HEADER_ID);
		let delimiter = document.getElementById(CSV_DELIMITER_ID);
		let expand_labels = document.getElementById(EXPAND_LABELS_ID);
		let label_delimiter = document.getElementById(LABEL_DELIMITER_ID);
		let is_others_changed = (delimiter.value != _export_config.delimiter ||
			  gen_headers.checked != _export_config.gen_headers ||
			  expand_labels.checked != _export_config.label.expand ||
			  label_delimiter.value != _export_config.label.delimiter);

		let headers = document.getElementById(TBL_HEADERS_DIV_ID)
		                      .getElementsByTagName('div');
		let is_headers_changed = false;
		for (let i = 0; i < headers.length; ++i) {
			let name = headers[i].getAttribute('name');
			let enable = headers[i].getAttribute('enable');
			if (name != _export_config.headers[i].name ||
				  enable != _export_config.headers[i].enable.toString()) {
				is_headers_changed = true;
				break;
			}
		}

		if (is_others_changed || is_headers_changed) {
			let config = {
				'delimiter': delimiter.value,
				'gen_headers': gen_headers.checked,
				'label': {
					'expand': expand_labels.checked,
					'delimiter': label_delimiter.value
				}
			};

			if (is_headers_changed) {
				let values = [];
				headers.forEach(function(header) {
					values.push({
						'name': header.getAttribute('name'),
						'title': header.innerText,
						'enable': header.getAttribute('enable') == 'true' ? true : false
					});
				});
				config['headers'] = values;
			}
			else {
				config['headers'] = _export_config.headers;
			}

			_export_config = config;
			let data = {};
			data[MYGIT_GITHUB_ISSUE_EXPORT_KEY] = _export_config;
			browser_api.storage.set(data);
		}
	};

	/**
	 * Export issues
	 *
	 * @param exports Export state
	 */
	IssueExportDialog.prototype._exportIssues = function(exports) {
		let self = this;
		let xhr = new XMLHttpRequest();
		xhr.open('GET', exports.url, true);
		xhr.setRequestHeader('Accept', 'application/vnd.github.mercy-preview+json');
		xhr.setRequestHeader('Authorization', 'token ' + exports.token);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					if (self._closed) {
						return;
					}

					let json = JSON.parse(xhr.responseText);
					if (json) {
						if (exports.total_count < 1) {
							exports.total_count = json.total_count;
						}

						if (exports.zenhub) {
							self._fetchRepoId(json, exports);
						}
						else {
							self._buildIssues(json, exports);
						}
					}

					let link = xhr.getResponseHeader('Link');
					if (link) {
						let items = link.split(',');
						let next_url = null;
						for (let i = 0; i < items.length && !self._closed; ++i) {
							if (items[i].includes('rel="next"')) {
								let hrefs = items[i].split(';');
								if (hrefs[0]) {
									next_url = hrefs[0].trim().slice(1, -1);
								}
							}
						}

						if (!self._closed && next_url) {
							if (exports.zenhub) {
								exports.next_url = next_url;
							}
							else {
								exports.url = next_url;
								self._exportIssues(exports);
							}
						}
						else if (!self._closed && !exports.zenhub) {
							self._saveIssues(exports);
						}
					}
					else if (!self._closed && !exports.zenhub) {
						self._saveIssues(exports);
					}
				}
				else {
					self.showMessage('Failed to search issues: ' + xhr.status);
				}
			}
		};

		if (!this._closed) {
			xhr.send();
		}
	};

	/**
	 * Build issue search url by filters
	 */
	IssueExportDialog.prototype._buildSearchUrlByFilters = function(base_uri, repo) {
		let el_filter = document.querySelector('input[id="js-issues-search"]');
		if (!el_filter) {
			console.warn("Can't find issue filter input element");
			return null;
		}

		let filters = el_filter.getAttribute('value');
		if (!filters) {
			return base_uri + '?q=' + encodeURI('repo:' + repo +
			       ' state:open is:issue');
		}

		if (repo) {
			if (filters[filters.length-1] != ' ') {
				filters += ' repo:' + repo;
			}
			else {
				filters += 'repo:' + repo;
			}
		}

		return base_uri + '?q=' + encodeURI(filters);
	};

	/**
	 * Fetch repository id, when we want to fetch zenhub related data for issues,
	 * we need to get repository id first. This function is only called if user
	 * choose to export zenhub related fields
	 */
	IssueExportDialog.prototype._fetchRepoId = function(issuesJson, exports) {
		let self = this
		let xhr = new XMLHttpRequest();
		xhr.open('GET', exports.repoApi, true);
		xhr.setRequestHeader('Accept', 'application/vnd.github.mercy-preview+json');
		xhr.setRequestHeader('Authorization', 'token ' + exports.token);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					if (self._closed) {
						return;
					}

					let json = JSON.parse(xhr.responseText);
					if (json) {
						self._fetchZenhub(json.id, issuesJson, exports);
					}
					else {
						self.showMessage('Can\'t get repository id from response.', true);
					}
				}
				else {
					self.showMessage('Can\'t get repository id for fetching zenhub data. '
					  + 'Error: ' + xhr.status, true);
				}
			}
		}

		if (!this._closed) {
			xhr.send();
		}
	}

	/**
	 * Fetch zenhub data for each issue
	 */
	IssueExportDialog.prototype._fetchZenhub = function(repoId, json, exports) {
		let self = this;

		for (let i = 0; i < json.items.length; ++i) {
			let item = json.items[i];
			let url = 'https://' + exports.zenhub.api + '/p1/repositories/' +
				repoId + '/issues/' + item.number;
			let xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.setRequestHeader('X-Authentication-Token', exports.zenhub.token);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						if (self._closed) {
							exports.zenhub.requests = [];
							return;
						}

						let json = JSON.parse(xhr.responseText);
						if (json) {
							item['estimate'] = json.estimate;
							item['pipeline'] = json.pipeline;
							item['is_epic'] = json.is_epic;
							self._buildIssue(item, exports);
						}
						else {
							self.showMessage('Can\'t fetch zenhub data for issue: ' +
								item.number, true);
							self._buildIssue(item, exports);
						}

						if (exports.zenhub.requests.length > 0) {
							setTimeout(function() {
								if (self._closed) {
									exports.zenhub.requests = [];
								}
								else {
									exports.zenhub.requests.shift().send();
								}
							}, 600);
						}
						else if (exports.zenhub.requests.length < 1 && !self._closed) {
							if (exports.next_url) {
								exports.url = exports.next_url;
								exports.next_url = null;
								self._exportIssues(exports);
							}
							else {
								self._saveIssues(exports);
							}
						}
					}
					else {
						self.showMessage('Can\'t fetch zenhub data for issue: ' +
							item.number + '. Status: ' + xhr.status, true);
					}
				}
			}

			exports.zenhub.requests.push(xhr);
		}

		if (!this._closed && exports.zenhub.requests.length > 0) {
			exports.zenhub.requests.shift().send();
		}
	}

	/**
	 * Export single issue
	 */
	IssueExportDialog.prototype._buildIssue = function(item, exports) {
		let issue = [];
		let expanded = _export_config.label.expand;
		let delimiter = _export_config.label.delimiter;

		Object.keys(exports.parser).forEach(function(prop) {
			if (self._closed) {
				return;
			}

			if (prop == 'labels') {
				issue.push(exports.parser[prop](item, delimiter, expanded, exports));
			}
			else {
				issue.push(exports.parser[prop](item));
			}
		});

		if (!self._closed) {
			exports.issues.push(issue);
			this.showMessage('Exporting issues ' + exports.issues.length + ' of ' +
					exports.total_count + ' ...');
		}
}

	/**
	 * Export all searched issues
	 */
	IssueExportDialog.prototype._buildIssues = function(json, exports) {
		let self = this;
		let expanded = _export_config.label.expand;
		let delimiter = _export_config.label.delimiter;

		for (let i = 0; i < json.items.length && !this._closed; ++i) {
			let item = json.items[i];
			if (!item) {
				return;
			}

			let issue = [];
			Object.keys(exports.parser).forEach(function(prop) {
				if (prop == 'labels') {
					issue.push(exports.parser[prop](item, delimiter, expanded, exports));
				}
				else {
					issue.push(exports.parser[prop](item));
				}
			});

			exports.issues.push(issue);
			self.showMessage('Exporting issues ' + exports.issues.length + ' of ' +
					exports.total_count + ' ...');
		}
	};

	/**
	 * Save issues to local disk
	 */
	IssueExportDialog.prototype._saveIssues = function(exports) {
		if (this._closed) {
			return;
		}

		let data = '';
		let label_index = -1;
		let headers = [];

		// find label index
		_export_config.headers.forEach(function(e) {
			if (exports.parser[e.name]) {
				headers.push(e.title);
				if (e.name == 'labels') {
					label_index = headers.length - 1;
				}
			}
		});

		let is_expand = _export_config.label.expand;
		let labels = Object.keys(exports.labels);
		let delimiter = _export_config.delimiter;
		// generate header line
		if (_export_config.gen_headers) {
			if (is_expand && label_index > -1 && labels.length > 0) {
				headers[label_index] = labels.join(delimiter);
			}

			data = headers.join(delimiter) + '\n';
		}

		// generate issue line
		exports.issues.forEach(function(issue) {
			if (label_index > -1 && is_expand) {
				let t = '';
				let issue_labels = issue[label_index];
				labels.forEach(function(l) {
					t += (issue_labels[l] || '') + delimiter;
				});

				if (t.slice(-1) == delimiter) {
					t = t.slice(0, -1);
				}
				issue[label_index] = t;
			}

			data += issue.join(delimiter) + '\n';
		});

		if (!this._closed) {
			let blob = new Blob([data], {type: 'text/plain;charset=utf-8'});
			saveAs(blob, 'exported_issues.csv');
			this.showMessage('');
			blob = null;
		}
		data = null;
	};

	/**
	 * Export issues from GitHub issue page
	 */
	IssueExportDialog.prototype.export = function() {
		this.storeConfig();
		let hub = github_api.getCurrentHub();
		if (!hub.token) {
			this.showMessage('Please sign in GitHub!', true);
			return;
		}

		let self = this;
		let exports = {
			url: null, next_url: null, issues: [], parser: {}, labels: {},
			total_count: 0, zenhub: null
		};
		let can_export = false;
		let has_zenhub = false;
		_export_config.headers.forEach(function(header) {
			if (header.enable) {
				exports.parser[header.name] = self.parser[header.name];
				can_export = true;

				// do we want to export zenhub related data?
				if (!has_zenhub &&
				    (header.name == 'estimate' ||
				     header.name == 'pipeline' ||
				     header.name == 'is_epic')) {
					has_zenhub = true;
				}
			}
		});

		if (!can_export) {
			this.showMessage('Please choose issue columns to export!', true);
			return;
		}

		// check if zenhub is cofnigured if we want to export its data
		if (has_zenhub && (!hub.zenhub || !hub.zenhub.token || !hub.zenhub.api)) {
			this.showMessage('Please configure zenhub api and token if you want to' +
			  ' export zenhub related issue data!');
			return;
		}

		let base_uri = 'https://' + hub.api_uri + '/search/issues';
		let url = this._buildSearchUrlByFilters(base_uri, hub.repo);
		if (url) {
			exports.url = url;
			exports.repoApi = 'https://' + hub.api_uri + '/repos/' + hub.repo;
			exports.token = hub.token;

			if (has_zenhub) {
				exports.zenhub = hub.zenhub;
				exports.zenhub.requests = [];
			}
			else {
				exports.zenhub = null;
			}

			this.showMessage('Exporting issues ...');
			this._exportIssues(exports);
		}
		else {
			this.showMessage("Can't export issues, Please check issue filter!", true);
		}
	};

	return IssueExportDialog;
}());

