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

  // constants
  let MAX_INTERVAL_COUNT = 100;
  let INTERVAL_TIME = 100;
  let URL_UNKNOWN = -1;
  let URL_MATCH_GITHUB = 1;
  let URL_MATCH_GITHUB_ENTERPRISE = 2;

  /**
   * Constrcutor
   */
  function IssueInjector() {
    this.export_dialog = new IssueExportDialog();
    this.issue_filter = new IssueFilter();
    this.timer = null;
  }

  /**
   * Match if the url is issue URL and can be injected
   */
  IssueInjector.prototype._matchUrl = function(url) {
    if (url) {
      // is public github url?
      if (github_api.github_token && github_api.github_token.token) {
        let uri = "https:\/\/github.com\/.*\/.*\/";
        if (url.search(uri + "issues(?!\/\\d+).*") > -1 ||
            url.search(uri + "labels\/.+") > -1) {
          return URL_MATCH_GITHUB;
        }
      }

      // is github enterprise url?
      if (github_api.github_e_token && github_api.github_e_token.token) {
        let uri = "https:\/\/" + github_api.github_e_token.uri + "\/.*\/.*\/";
        if (url.search(uri + "issues(?!\/\\d+).*") > -1 ||
            url.search(uri + "labels\/.+") > -1) {
          return URL_MATCH_GITHUB_ENTERPRISE;
        }
      }
    }

    return URL_UNKNOWN;
  }

  /**
   * Try to inject issue Export button
   *
   * @return True if injection is successful
   */
  IssueInjector.prototype._tryInjectExport = function() {
    let el_menu_div = document.querySelector(
        "div[class^='subnav-links'][role='navigation']");
    let el_export_btn = document.getElementById("mg-issue-export-btn");

    if (el_menu_div && !el_export_btn &&
        this._matchUrl(window.location.href) != URL_UNKNOWN) {
      let el_export_btn = document.createElement('a');
      el_export_btn.title = "Export";
      el_export_btn.href = "#";
      el_export_btn.innerHTML = "Export";
      el_export_btn.className = "js-selected-navigation-item subnav-item";
      el_export_btn.setAttribute("id", "mg-issue-export-btn");
      let self = this;
      el_export_btn.onclick = function() {
        self.export_dialog.show();
      };
      el_menu_div.appendChild(el_export_btn);
      return true;
    }

    return false;
  }

  /**
   * Try to inject Save filter icon
   */
  IssueInjector.prototype._tryInjectFilter = function() {
    let el_filter_input = document.getElementById("js-issues-search");
    let el_save_filter = document.getElementById("mg-save-issue-filter");

    if (el_filter_input && !el_save_filter &&
        this._matchUrl(window.location.href) != URL_UNKNOWN) {
      el_filter_input.style.paddingRight = "30px";

      el_save_filter = document.createElement("i");
      el_save_filter.className = "octicon octicon-search mg-save-issue-filter"
        + " mg-icon-bookmark-o";
      el_save_filter.id = "mg-save-issue-filter";
      el_filter_input.parentNode.appendChild(el_save_filter);

      let self = this;
      el_save_filter.onclick = function() {
        self.issue_filter.show();
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
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    let match = this._matchUrl(url);
    if (match != URL_UNKNOWN) {
      let self = this;
      let is_injected = { issue_export: false, issue_filter: false };

      // periodically try to inject until success or over number of attempts
      var count = 0;
      this.timer = setInterval(function() {
        if (!is_injected.issue_export) {
          is_injected.issue_export = self._tryInjectExport();
        }

        if (!is_injected.issue_filter) {
          is_injected.issue_filter = self._tryInjectFilter();
        }

        if ((is_injected.issue_export && is_injected.issue_filter) ||
            ++count > MAX_INTERVAL_COUNT ||
            self._matchUrl(window.location.href) == URL_UNKNOWN) {
          clearInterval(self.timer);
          self.timer = null;
        }
      }, INTERVAL_TIME);
    }
  };

  return IssueInjector;
}());

