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
 * Issue Export class
 */
var IssueExport = (function() {
  "use strict";

  /**
   * Constrcutor
   */
  function IssueExport() {
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
  IssueExport.prototype._matchInjectUrl = function(url) {
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
  IssueExport.prototype._buildExportDialog = function() {
    var root = document.createElement('div');
    root.className = "mg-export-dialog-center";
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
   * Inject export button
   */
  IssueExport.prototype.inject = function(url) {
    var match = this._matchInjectUrl(url);
    if (match != this.URL_UNKNOWN) {
      var count = 0;
      var self = this;

      // periodically inject export button until it is successful or over
      // number of attempts
      var interval = setInterval(function() {
        var el_menu_div = document.querySelector(
          "div[class^='subnav-links'][role='navigation']");
        var is_injected= document.getElementById("mg-issue-export-btn") != null;
        if (el_menu_div != null && !is_injected) {
          var el_export_btn = document.createElement('a');
          el_export_btn.title = "Export";
          el_export_btn.href = "#";
          el_export_btn.innerHTML = "Export";
          el_export_btn.className = "js-selected-navigation-item subnav-item";
          el_export_btn.setAttribute("id", "mg-issue-export-btn");
          el_export_btn.onclick = function() {
            self.export_dialog.show();
          };

          el_menu_div.appendChild(el_export_btn);
          self._buildExportDialog();
          clearInterval(interval);
        }
        else {
          if (is_injected || ++count > self.MAX_INTERVAL_COUNT) {
            clearInterval(interval);
          }
          //console.log("Try inject export button after " +
          //  (count * self.INTERVAL_TIME));
        }
      }, this.INTERVAL_TIME);
    }
  };

  /**
   * Get repository name
   */
  IssueExport.prototype._getRepoName = function() {
    var meta = document.querySelector("meta[property='og:title']");
    if (meta != null) {
      return meta.getAttribute("content");
    }

    return null;
  };

  return IssueExport;
}());

