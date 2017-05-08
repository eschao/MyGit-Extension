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
 * Favorite repositories injector class
 */
var FavoriteReposInjector = (function() {
  "use strict";

  /**
   * storage data structure of favorite repository
   * {
   *    "github url" : [
   *      {
   *        "name" : "repo name",
   *        "url" : "repo url"
   *      },
   *      ...
   *      ]
   *      "github enterprise url" : [
   *      ...
   *    ]
   * }
   */

  /**
   * Constructor
   */
  function FavoriteReposInjector() {
    this.repos = {};

    // read favorite repositories from chrom storage
    let self = this;
    browser_api.storage.get(MYGIT_GITHUB_FAVORITE_REPOS_KEY, function(item) {
      if (item != null) {
        let data = item[MYGIT_GITHUB_FAVORITE_REPOS_KEY];
        if (data != null) {
          self.repos = data;
        }
      }
    });
  }

  /**
   * Save favorite repository to storage
   */
  FavoriteReposInjector.prototype.storeFavoriteRepos = function() {
    let data = {};
    data[MYGIT_GITHUB_FAVORITE_REPOS_KEY] = this.repos;
    browser_api.storage.set(data);
  }

  /**
   * Inject favorite repos icon in github top bar
   */
  FavoriteReposInjector.prototype.inject = function(url) {
    // check if should inject
    let repo_name = this._getRepoName();
    if (repo_name == null && Object.keys(this.repos).length < 1) {
      return;
    }

    // inject favorite repos menu
    let el_favorite_nav = document.getElementById("mg-favorite-repos-nav-item");
    if (el_favorite_nav == null) {
      let el_nav_item = document.querySelector(
        "li[class^='header-nav-item dropdown js-menu-container']");
      el_favorite_nav = document.createElement("li");
      el_favorite_nav.className = "header-nav-item dropdown js-menu-container";
      el_favorite_nav.id = "mg-favorite-repos-nav-item";

      // initiate html template
      let self = this;
      let xhr = new XMLHttpRequest();
      xhr.open("GET",
               browser_api.extension.getURL("templates/favorite_repos.html")
               , true);
      xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          el_favorite_nav.innerHTML = this.responseText;
          el_nav_item.parentNode.insertBefore(el_favorite_nav, el_nav_item);
          self._init(el_favorite_nav);
        }
      };
      xhr.send();
    }
  }

  /**
   * Create dropdown item element for repoisotry
   *
   * @param item repository item
   * @return a html element for repository item
   */
  FavoriteReposInjector.prototype._createItem = function(item) {
    let el_item = document.createElement("div");
    el_item.className = "dropdown-item mg-dropdown-item";
    el_item.innerHTML =
      '<a class="mg-dropdown-item-text" href="' + item.url + '">\n' +
      item.name + '</a>\n' +
      '<span class="mg-dropdown-item-del"><i class="mg-icon-close"></i></span>'
      + '\n';

    // del event handler for removing current item from favorite repos dropdown
    // list
    let self = this;
    el_item.getElementsByTagName("span")[0].onclick = function(e) {
      let origin = el_item.getElementsByTagName("a")[0].origin;
      for (let i = 0; i < self.repos[origin].length; ++i) {
        let it = self.repos[origin][i];
        if (it.name == item.name) {
          // remove from memory data
          self.repos[origin].splice(i, 1);
          if (self.repos[origin].length < 1) {
            delete self.repos[origin];
          }

          // remove from dropdown DOM
          el_item.parentNode.removeChild(el_item);

          // save to storage
          self.storeFavoriteRepos();

          // remove favorite repos menu from top banner if need
          if (Object.keys(self.repos).length < 1) {
            let repo_name = self._getRepoName();
            if (repo_name == null) {
              let el_li = document.getElementById("mg-favorite-repos-nav-item");
              el_li.parentNode.removeChild(el_li);
            }
          }
          break;
        }
      }
    }

    return el_item;
  }

  /**
   * Init favorite repos dropdown DOM
   *
   * @param root root element(<li>) of dropdown DOM
   */
  FavoriteReposInjector.prototype._init = function(root) {
    let self = this;
    let origin = window.location.origin;
    let el_divider = document.getElementById("mg-fr-divider");
    let el_add = document.getElementById("mg-fr-add");
    let el_ul = document.getElementById("mg-fr-dropdown-menu");

    // add repository event handler
    el_add.onclick = function() {
      let repo_name = self._getRepoName();
      if (repo_name != null) {
        // new repo item
        let item = {
          name: repo_name,
          url: origin + '/' + repo_name
        };
        if (self.repos[origin] == null) {
          self.repos[origin] = [];
        }
        self.repos[origin].push(item);

        // save to browser storage
        self.storeFavoriteRepos();

        // insert a repo item into dropdown menu DOM
        let el_item = self._createItem(item);
        let el_items = el_ul.querySelectorAll("mg-dropdown-item-text");
        if (el_items.length < 1) {
          el_ul.insertBefore(el_item, el_divider);
        }
        else {
          for (let i = 0; i < el_items.length; ++i) {
            let el = el_items[i];
            if (el.href.startsWith(origin)) {
              el_ul.insertBefore(el_item, el.parentNode);
              break;
            }
          }
        }

        // hide add button
        el_divider.style.display = "none";
        el_add.style.display = "none";
      }
    }

    // click event handler to show favorite repos dropdown
    let el_fr = root.getElementsByTagName("a")[0];
    let old_click_handler = el_fr.onclick;
    el_fr.onclick = function(e) {
      let is_added = false;
      let repo_name = self._getRepoName();
      if (self.repos[origin] != null) {
        for (let i = 0; i < self.repos[origin].length; ++i) {
          let repo = self.repos[origin][i];
          if (repo.name == repo_name) {
            is_added = true;
            break;
          }
        }
      }

      if (is_added || repo_name == null) {
        el_divider.style.display = "none"
        el_add.style.display = "none";
      }
      else {
        el_divider.style = null;
        el_add.style = null;
      }
    }

    // create elements for all favorite repos and add it into DOM
    Object.keys(this.repos).forEach(function(key) {
      if (self.repos[key] != null) {
        self.repos[key].forEach(function(repo) {
          let el_item = self._createItem(repo);
          el_ul.insertBefore(el_item, el_divider);
        });
      }
    });
  }

  /**
   * Get repository name
   */
  FavoriteReposInjector.prototype._getRepoName = function() {
    let el_a = document.querySelector(
      "div[class*='repohead-details-container'] strong[itemprop='name'] a");
    if (el_a != null && el_a.pathname != null && el_a.pathname.length > 0) {
      let name = el_a.pathname;
      if (name[0] == "/") {
        name = name.slice(1);
      }

      if (name.slice(0, -1) == "/") {
        name = name.slice(0, -1);
      }

      return name;
    }

    return null;
  };

  return FavoriteReposInjector;
}());
