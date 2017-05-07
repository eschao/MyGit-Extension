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
 * Issue export dialog class
 */
var IssueExportDialog = (function() {
  "use strict";

  /**
   * Constructor
   */
  function IssueExportDialog() {
    // constants definition
    this.DIALOG_ROOT_ID = "mg-export-dialog";
    this.DELIMITER = ",";
    this.TBL_HEADERS_DIV_ID = "mg-table-headers";
    this.GEN_TBL_HEADER_ID = "mg-gen-headers";
    this.CSV_DELIMITER_ID = "mg-csv-delimiter";
    this.EXPAND_LABELS_ID = "mg-expand-labels";
    this.LABEL_DELIMITER_ID = "mg-label-delimiter";
    this.MESSAGE_ID = "mg-message";

    // use drag & drop to adjust issue headers
    this.drag_drop = new DragDrop();
    this._initConfig();
  }

  /**
   * Init configuration from browser storage
   */
  IssueExportDialog.prototype._initConfig = function() {
    var self = this;
    browser_api.storage.get(MYGIT_GITHUB_CONFIG_KEY, function(item) {
      var config = (item != null) ? item[MYGIT_GITHUB_CONFIG_KEY] : null;
      if (config != null && config.headers != null) {
        self.config = config;
      }
      else {
        self.config = {
          "delimiter": self.DELIMITER,
          "gen_headers": true,
          "label": { "expand": true, "delimiter": "|" },
          "headers": [
            { "name": "number", "title": "Issue No", "enable": true },
            { "name": "state", "title": "State", "enable": true },
            { "name": "title", "title": "Title", "enable": true },
            { "name": "assignee", "title": "Assignee", "enable": true },
            { "name": "user", "title": "Author", "enable": true },
            { "name": "milestone", "title": "Milestone", "enable": true },
            { "name": "labels", "title": "Labels", "enable": true }
          ]
        };
      }
    });

    this.parser = {
      // issue number parser
      "number": function(item) {
        return item.number;
      },
      // issue state parser
      "state": function(item) {
        return item.state;
      },
      // issue titler parser
      "title": function(item) {
        return item.title;
      },
      // issue assignee parser
      "assignee": function(item) {
        var s = "";
        if (item.assignees != null) {
          item.assignees.forEach(function(a) {
            s += a.login + ' ';
          });
          s = s.slice(0, -1);
        }

        return s;
      },
      // issue user(author) parser
      "user": function(item) {
        return item.user.login;
      },
      // issue milestone parser
      "milestone": function(item) {
        return item.milestone != null ? item.milestone.title : "";
      },
      // issue labels parser
      "labels": function(item, delimiter, expand, exports) {
        // expand labels, which means every label is a column in csv
        if (expand) {
          Object.keys(exports.labels).forEach(function(l) {
            exports.labels[l] = "";
          });

          if (item.labels != null) {
            item.labels.forEach(function(l) {
              exports.labels[l.name] = l.name;
            });
          }

          var labels = [];
          Object.keys(exports.labels).forEach(function(l) {
            labels.push(exports.labels[l]);
          });
          return labels;
        }
        // don't expand labels, which means all labels are in one column in csv
        else {
          if (item.labels == null) {
            return "";
          }

          var labels = [];
          item.labels.forEach(function(l) {
            labels.push(l.name);
          });

          return labels.sort().join(delimiter);
        }
      }
    };
  }

  /**
   * Show message
   *
   * @param msg message
   * @param is_error True if message is error and will be showed with red color
   */
  IssueExportDialog.prototype.showMessage = function(msg, is_error) {
    var el_msg = document.getElementById(this.MESSAGE_ID);
    if (is_error != null && is_error) {
      el_msg.style.color = "red";
    }
    else {
      el_msg.style.color = "blue";
    }

    if (msg == null) {
      msg = "";
    }
    el_msg.innerText = msg;
  }

  /**
   * Init export dialog
   *
   * @param root Root element of dialog
   */
  IssueExportDialog.prototype.initDialog = function(root) {
    // init generate headers
    var el_gen_headers = document.getElementById(this.GEN_TBL_HEADER_ID);
    el_gen_headers.checked = this.config.gen_headers;

    // init csv delimiter
    var el_delimiter = document.getElementById(this.CSV_DELIMITER_ID);
    el_delimiter.value = this.config.delimiter;

    // init expand labels
    var el_expand_labels = document.getElementById(this.EXPAND_LABELS_ID);
    el_expand_labels.checked = this.config.label.expand;

    // init label delimiter
    var el_label_delimiter = document.getElementById(this.LABEL_DELIMITER_ID);
    el_label_delimiter.value = this.config.label.delimiter;

    // close export dialog
    var self = this;
    document.getElementById("mg-close").onclick = function() {
      document.getElementById(self.DIALOG_ROOT_ID).style.display = "none";
      self.saveConfig();
    }

    // toggle table header
    var onToggleHeader = function() {
      if (this.className.indexOf("mg-header-disable") != -1) {
        this.className = this.className.replace(" mg-header-disable", "");
        this.setAttribute("enable", "true");
      }
      else {
        this.className += " mg-header-disable";
        this.setAttribute("enable", "false");
      }
    }

    var headers = document.getElementById(this.TBL_HEADERS_DIV_ID)
                          .getElementsByTagName("div");
    for (var i = 0; i < headers.length; ++i) {
      headers[i].onclick = onToggleHeader;
      headers[i].setAttribute("name", this.config.headers[i].name);
      headers[i].innerHTML = this.config.headers[i].title;
      headers[i].setAttribute("enable", this.config.headers[i].enable
                                            .toString());
      if (!this.config.headers[i].enable) {
        headers[i].className += " mg-header-disable";
      }
    }

    this.drag_drop.init(headers);

    // onclick of expand label
    el_expand_labels.onclick = function() {
      var div = document.getElementById("mg-label-delimter-d");
      if (this.checked) {
        div.style.color = "lightgray";
        el_label_delimiter.disabled = true;
      }
      else {
        div.style = null;
        el_label_delimiter.disabled = false;
      }
    }
    el_expand_labels.onclick();
  }

  /**
   * Show dialog
   */
  IssueExportDialog.prototype.show = function() {
    var root = document.getElementById(this.DIALOG_ROOT_ID)
    root.style.display = "flex";
  }

  /**
   * Save configurations to browser storage
   */
  IssueExportDialog.prototype.saveConfig = function() {
    var gen_headers = document.getElementById(this.GEN_TBL_HEADER_ID);
    var delimiter = document.getElementById(this.CSV_DELIMITER_ID);
    var expand_labels = document.getElementById(this.EXPAND_LABELS_ID);
    var label_delimiter = document.getElementById(this.LABEL_DELIMITER_ID);
    var is_others_changed = (delimiter.value != this.config.delimiter ||
                           gen_headers.checked != this.config.gen_headers ||
                           expand_labels.checked != this.config.label.expand ||
                           label_delimiter.value != this.config.label.delimiter);

    var headers = document.getElementById(this.TBL_HEADERS_DIV_ID)
                          .getElementsByTagName("div");
    var is_headers_changed = false;
    for (var i = 0; i < headers.length; ++i) {
      var name = headers[i].getAttribute("name");
      var enable = headers[i].getAttribute("enable");
      if (name != this.config.headers[i].name ||
          enable != this.config.headers[i].enable.toString()) {
        is_headers_changed = true;
        break;
      }
    }

    if (is_others_changed || is_headers_changed) {
      var config = {
        "delimiter": delimiter.value,
        "gen_headers": gen_headers.checked,
        "label": {
          "expand": expand_labels.checked,
          "delimiter": label_delimiter.value
        }
      };

      if (is_headers_changed) {
        var values = [];
        headers.forEach(function(header) {
          values.push({
            "name": header.getAttribute("name"),
            "title": header.innerText,
            "enable": header.getAttribute("enable") == "true" ? true : false
          });
        });
        config["headers"] = values;
      }
      else {
        config["headers"] = this.config.headers;
      }

      this.config = config;
      var data = {};
      data[MYGIT_GITHUB_CONFIG_KEY] = this.config;
      browser_api.storage.set(data, function() {});
    }
  }

  /**
   * Export issues
   *
   * @param exports Export state
   */
  IssueExportDialog.prototype._exportIssues = function(exports) {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", exports.url, true);
    xhr.setRequestHeader("Accept", "application/vnd.github.mercy-preview+json");
    xhr.setRequestHeader("Authorization", "token " + exports.token);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var json = JSON.parse(xhr.responseText);
          if (json != null) {
            if (exports.total_count < 1) {
              exports.total_count = json.total_count;
            }
            self._buildIssues(json, exports);
          }

          var link = xhr.getResponseHeader("Link");
          if (link == null) {
            self._saveIssues(exports);
          }
          else {
            var items = link.split(',');
            var next_url = null;
            items.forEach(function(item) {
              if (item.includes('rel="next"')) {
                var hrefs = item.split(';');
                if (hrefs[0] != null) {
                  next_url = hrefs[0].trim().slice(1, -1);
                }
              }
            });

            if (next_url != null) {
              exports.url = next_url;
              self._exportIssues(exports);
            }
            else {
              self._saveIssues(exports);
            }
          }
        }
        else {
          self.showMessage("Failed to search issues: " + xhr.status);
        }
      }
    }
    xhr.send();
  };

  /**
   * Build issue search url by filters
   */
  IssueExportDialog.prototype._buildSearchUrlByFilters = function(base_uri, repo) {
    var el_filter = document.querySelector("input[id='js-issues-search']");
    if (el_filter == null) {
      console.log("Can't find issue filter input element");
      return null;
    }

    var filters = el_filter.getAttribute("value");
    if (filters == null || filters.trim().length < 1) {
      return base_uri + "?q=" + encodeURI("repo:" + repo + " state:open is:issue");
    }

    if (repo != null) {
      if (filters[filters.length-1] != ' ') {
        filters += " repo:" + repo;
      }
      else {
        filters += "repo:" + repo;
      }
    }

    return base_uri + "?q=" + encodeURI(filters);
  }

  /**
   * Build issue result
   */
  IssueExportDialog.prototype._buildIssues = function(json, exports) {
    var self = this;
    var expanded = this.config.label.expand;
    var delimiter = this.config.label.delimiter;

    json.items.forEach(function(item) {
      if (item == null) {
        return;
      }

      var issue = [];
      Object.keys(exports.parser).forEach(function(prop) {
        if (prop == "labels") {
          issue.push(exports.parser[prop](item, delimiter, expanded, exports));
        }
        else {
          issue.push(exports.parser[prop](item));
        }
      });

      exports.issues.push(issue);
      self.showMessage("Exporting issues " + exports.issues.length + " of " +
        exports.total_count + " ...");
    });
  };

  /**
   * Save issues to local disk
   */
  IssueExportDialog.prototype._saveIssues = function(exports) {
    var data = "";
    var label_index = -1;
    var headers = [];

    this.config.headers.forEach(function(e) {
      if (exports.parser[e.name] != null) {
        headers.push(e.title);
        if (e.name == "labels") {
         label_index = headers.length - 1;
        }
      }
    });

    var is_expand = this.config.label.expand;
    var labels = Object.keys(exports.labels);
    var delimiter = this.config.delimiter;
    if (this.config.gen_headers) {
      if (is_expand && label_index > -1 && labels.length > 0) {
        headers[label_index] = labels.join(delimiter);
      }

      data = headers.join(delimiter) + "\n";
    }

    exports.issues.forEach(function(issue) {
      if (label_index > -1 && is_expand) {
        var l = issue[label_index].join(delimiter);
        issue[label_index].forEach(function(o) {
          l += delimiter;
        });
        issue[label_index] = l;
      }

      data += issue.join(delimiter) + "\n";
    });

    var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "exported_issues.csv");
    this.showMessage("");
    data = null;
    blob = null;
  };

  /**
   * Export issues from GitHub issue page
   *
   * @param token GitHub token
   * @param api_uri GitHub API uri
   * @param repo GitHub repository name
   */
  IssueExportDialog.prototype.export = function(token, api_uri, repo) {
    this.saveConfig();
    if (token == null) {
      this.showMessage("Please sign in GitHub!", true);
      return;
    }

    var self = this;
    var exports = {
      url: null, issues: [], parser: {}, labels: {}, total_count: 0
    };
    var can_export = false;
    this.config.headers.forEach(function(header) {
      if (header.enable) {
        exports.parser[header.name] = self.parser[header.name]
        can_export = true;
      }
    });

    if (!can_export) {
      this.showMessage("Please choose issue columns to export!", true);
      return;
    }

    var base_uri = "https://" + api_uri + "/search/issues";
    var url = this._buildSearchUrlByFilters(base_uri, repo);
    if (url != null) {
      exports.url = url;
      exports.token = token;
      this.showMessage("Exporting issues ...");
      this._exportIssues(exports);
    }
  };

  return IssueExportDialog;
}());

