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
 * Issue injector class
 */
var IssueInjector = (function() {
  "use strict";

  /**
   * Constrcutor
   */
  function IssueInjector() {
    // constants definition
    this.MAX_INTERVAL_COUNT = 100;
    this.INTERVAL_TIME = 100;
    this.URL_UNKNOWN = -1;
    this.URL_MATCH_GITHUB = 1;
    this.URL_MATCH_GITHUB_ENTERPRISE = 2;

    this.github_token = null;
    this.github_e_token = null;
    this.api_uri = "api.github.com";
    this.token = null;
    this.export_dialog = new IssueExportDialog();
    this.issue_filter = new IssueFilter();

    // read configurations from browser storage
    var self = this;
    browser_api.storage.get(MYGIT_GITHUB_KEY, function(item) {
      if (item != null) {
        self.github_token = item[MYGIT_GITHUB_KEY];
      }
    });
    browser_api.storage.get(MYGIT_GITHUB_E_KEY, function(item) {
      if (item != null) {
        self.github_e_token = item[MYGIT_GITHUB_E_KEY];
      }
    });
  }

  /**
   * Match inject url
   */
  IssueInjector.prototype._matchInjectUrl = function(url) {
    if (url != null) {
      // is public github url?
      if (this.github_token != null &&
          this.github_token.token != null &&
          url.search("https:\/\/github.com\/.*\/.*\/issues(?!\/\\d+).*") > -1) {
        this.token = this.github_token.token;
        return this.URL_MATCH_GITHUB;
      }

      // is github enterprise url?
      if (this.github_e_token != null &&
          this.github_e_token.token != null &&
          url.search("https:\/\/" + this.github_e_token.uri +
            "\/.*\/.*\/issues(?!\/\\d+).*") > -1) {
        this.token = this.github_e_token.token;
        this.api_uri = this.github_e_token.uri + "/api/v3";
        return this.URL_MATCH_GITHUB_ENTERPRISE;
      }
    }

    return this.URL_UNKNOWN;
  }

  /**
   * Build export dialog
   */
  IssueInjector.prototype._buildExportDialog = function() {
    var root = document.createElement('div');
    root.className = "mg-dialog-center hidden";
    root.setAttribute("id", "mg-export-dialog");

    // read export dialog html and initiate
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open("GET",
             browser_api.extension.getURL("templates/issue_export_dialog.html")
             , true);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        root.innerHTML = this.responseText;
        document.body.appendChild(root);
        self.export_dialog.initDialog(root);
        document.getElementById("mg-start-export-btn").onclick = function(e) {
          e.preventDefault();
          self.export_dialog.export(self.token, self.api_uri, self._getRepoName());
        }
      }
    };
    xhr.send();
  }

  /**
   * Try to inject issue Export button
   *
   * @return True if injection is successful
   */
  IssueInjector.prototype._tryInjectExport = function() {
    var el_menu_div = document.querySelector(
        "div[class^='subnav-links'][role='navigation']");
    var el_export_btn = document.getElementById("mg-issue-export-btn");
    if (el_menu_div != null && el_export_btn == null) {
      var el_export_btn = document.createElement('a');
      el_export_btn.title = "Export";
      el_export_btn.href = "#";
      el_export_btn.innerHTML = "Export";
      el_export_btn.className = "js-selected-navigation-item subnav-item";
      el_export_btn.setAttribute("id", "mg-issue-export-btn");
      var self = this;
      el_export_btn.onclick = function() {
        self.export_dialog.show();
      };

      el_menu_div.appendChild(el_export_btn);
      this._buildExportDialog();
      return true;
    }

    return false;
  }

  /**
   * Try to inject Save filter icon
   */
  IssueInjector.prototype._tryInjectFilter = function() {
    var el_filter_input = document.getElementById("js-issues-search");
    var el_save_filter = document.getElementById("mg-save-issue-filter");
    if (el_filter_input != null && el_save_filter == null) {
      el_filter_input.style.paddingRight = "30px";

      el_save_filter = document.createElement("i");
      el_save_filter.className = "octicon octicon-search mg-save-issue-filter"
        + " mg-icon-bookmark-o";
      el_save_filter.id = "mg-save-issue-filter";
      el_filter_input.parentNode.appendChild(el_save_filter);

      var self = this;
      el_save_filter.onclick = function() {
        self.issue_filter.save();
      }

      this.issue_filter.init();
      return true;
    }

    return false;
  }

  /**
   * Inject export button
   */
  IssueInjector.prototype.inject = function(url) {
    var match = this._matchInjectUrl(url);
    if (match != this.URL_UNKNOWN) {
      var count = 0;
      var self = this;
      var is_injected = { issue_export: false, issue_filter: false };

      // periodically try to inject until success or over number of attempts
      var interval = setInterval(function() {
        if (!is_injected.issue_export) {
          is_injected.issue_export = self._tryInjectExport();
        }

        if (!is_injected.issue_filter) {
          is_injected.issue_filter = self._tryInjectFilter();
        }

        if ((is_injected.issue_export && is_injected.issue_filter) ||
            ++count > self.MAX_INTERVAL_COUNT) {
          clearInterval(interval);
        }
      }, this.INTERVAL_TIME);
    }
  };

  /**
   * Get repository name
   */
  IssueInjector.prototype._getRepoName = function() {
    var meta = document.querySelector("meta[property='og:title']");
    if (meta != null) {
      return meta.getAttribute("content");
    }

    return null;
  };

  return IssueInjector;
}());

