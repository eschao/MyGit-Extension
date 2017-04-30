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

var MyGitInjector = (function() {
  "user strict";

  function MyGitInjector() {
    this.issue_export = new IssueExport();

    var self = this;
    chrome.storage.sync.get(MYGIT_SETTINGS_KEY, function(item) {
      var settings = item[MYGIT_SETTINGS_KEY];
      if (settings.enable_issue_export != null &&
          settings.enable_issue_export == false) {
        self.issue_export = null;
      }
    });
  }

  /**
   * Initialize injector, install neccessary event
   */
  MyGitInjector.prototype.install = function() {
    var self = this;

    // when window is loaded, check if we need to inject export button
    window.addEventListener("load", function() {
      if (self.issue_export != null) {
        self.issue_export.inject(window.location.href);
      }
    }, false);

    // when window state is changed, check if we need to inject export button
    window.addEventListener("statechange", function() {
      var state = window.history.state;
      if (state != null && self.issue_export != null) {
        self.issue_export.inject(window.location.href);
      }
    }, false);
  };

  return MyGitInjector;
}());

var injector = new MyGitInjector();
injector.install();
