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
    this.issue_injector = new IssueInjector();
    this.favorite_repos = new FavoriteReposInjector();
  }

  /**
   * Initialize injector, install neccessary event
   */
  MyGitInjector.prototype.install = function() {
    let self = this;

    // when window is loaded, check if we need to inject
    window.addEventListener("load", function() {
      self.issue_injector.inject(window.location.href);
      self.favorite_repos.inject(window.location.href);
    }, false);

    // when window state is changed, check if we need to inject
    window.addEventListener("statechange", function() {
      let state = window.history.state;
      if (state != null) {
        self.issue_injector.inject(window.location.href);
      }
    }, false);
  };

  return MyGitInjector;
}());

var injector = new MyGitInjector();
injector.install();
