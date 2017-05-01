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

var FavoriteRepos = (function() {
  /**
   * { "github url" : [
   *    {
   *      "name" : "repo name",
   *      "url" : "repo url"
   *    },
   *    ...
   *    ]
   *   "github enterprise url" : [
   *    ...
   *   ]
   * }
   */

  function FavoriteRepos() {
    this.repos = {};

    var self = this;
    chrome.storage.sync.get(MYGIT_FAVORITE_REPOS_KEY, function(item) {
      self.repos = item[MYGIT_FAVORITE_REPOS_KEY];
    });
  }

  FavoriteRepos.prototype.inject = function(url) {
    var el_favorite_nav = document.getElementById("mg-favorite-repos-nav-item");
    if (el_favorite_nav == null) {
      var el_nav_item = document.querySelector(
        "li[class^='header-nav-item dropdown js-menu-container']");
      el_favorite_nav = document.createElement("li");
      el_favorite_nav.className = "header-nav-item dropdown js-menu-container";

      var self = this;
      var xhr = new XMLHttpRequest();
      xhr.open("GET",
               chrome.extension.getURL("templates/favorite_repos.html")
               , true);
      xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          el_favorite_nav.innerHTML = this.responseText;
          el_nav_item.parentNode.insertBefore(el_favorite_nav, el_nav_item);
        }
      };
      xhr.send();
    }
  }

  FavoriteRepos.prototype._createItem = function(item) {
    var el_item = document.createElement("div");
    el_item.className = "dropdown-item mg-dropdown-item";
    el_item.innerHTML =
      '<a class="mg-dropdown-item-text" href="' + item.url + '">\n' +
      item.name + '</a>\n' +
      '<span class="mg-dropdown-item-del"><i class="mg-icon-close"></i></span>'
      + '\n';
    el_item.getElementsByTagName("span")[0].onclick = function(e) {
    }
  }

  FavoriteRepos.prototype._init = function(root) {
    var self = this;
    var el_add = document.getElementById("mg-fr-add");
    el_add.onclick = function() {
      var repo_name = self._getRepoName();
      if (repo_name != null) {
        // new repo item
        var item = { name: repo_name, url: window.origin + '/' + repo_name };
        self.repos[window.origin].push(item);

        // save to chrome storage
        var data = {};
        data[MYGIT_FAVORITE_REPOS_KEY] = self.repos;
        chrome.storage.sync.set(data, function() {} );

        // insert a repo item into dropdown menu DOM
        var el_item = self._createItem(item);
        var el_ul = document.getElementById("mg-fr-dropdown-menu");
        var el_items = el_ul.querySelector("mg-dropdown-item-text");
        el_items.forEach(function(el) {
          if (el.href.startsWith(window.origin)) {
            el_ul.insertBefore(el_item, el.parentNode);
            return;
          }
        });
      }
    }

  }

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

  return FavoriteRepos;
}());
