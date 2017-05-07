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
  }

  /**
   * Get repository name
   *
   * @return Repository name or NULL if can't find name
   */
  GitHubApi.prototype.getRepoName = function() {
    var el_a = document.querySelector(
      "div[class*='repohead-details-container'] strong[itemprop='name'] a");
    if (el_a != null && el_a.pathname != null && el_a.pathname.length > 0) {
      var name = el_a.pathname;
      if (name[0] == "/") {
        name = name.slice(1);
      }

      if (name.slice(0, -1) == "/") {
        name = name.slice(0, -1);
      }

      return name;
    }

    return null;
  }

  return GitHubApi;
}());

var github_api = new GitHubApi();
