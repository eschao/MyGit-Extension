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

  let EMPTY_NAME = "__empty__";

  /**
   * storage data structure of favorite repository
   * {
   *    "github url" : {
   *      "user name" : ["repo1", "repo2", ...],
   *      "org name" : ["repo1", "repo2", ....],
   *      "__empty__": ...
   *      ...
   *    },
   *    ...
   * }
   */

  /**
   * Constructor
   */
  function FavoriteReposInjector() {
    this.repos = {};

    // read favorite repositories from browser storage
    let self = this;
    browser_api.storage.get(MYGIT_GITHUB_FAVORITE_REPOS_KEY, function(item) {
      if (item) {
        let data = item[MYGIT_GITHUB_FAVORITE_REPOS_KEY];
        if (data) {
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
    let origin = window.location.origin;
    let repo_name = github_api.getRepoName();
    if (!repo_name && Object.keys(this.repos).length < 1) {
      return;
    }

    // inject favorite repos menu
    let el_favorite_nav = document.getElementById("mg-favorite-repos-nav-item");
    if (!el_favorite_nav) {
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
          let el_pre = el_item.previousElementSibling;
          let el_next = el_item.nextElementSibling;
          let el_parent = el_item.parentNode;

          // remove from dropdown DOM
          el_parent.removeChild(el_item);

          // remove from memory data
          self.repos[origin].splice(i, 1);
          if (self.repos[origin].length < 1) {
            delete self.repos[origin];

            // if its pre sibling is divider, remove it
            if (el_pre && el_pre.className &&
                el_pre.className == "dropdown-divider") {
              el_parent.removeChild(el_pre);
            }
            // if its next sibling is divider and is the first element in
            // parent node, remove it
            else if (el_next && el_next.className &&
                el_next.className == "dropdown-divider" &&
                !el_next.previousElementSibling) {
              el_parent.removeChild(el_next);
            }
          }

          // save to storage
          self.storeFavoriteRepos();

          // remove favorite repos menu from top banner if need
          if (Object.keys(self.repos).length < 1 &&
              !github_api.getRepoName()) {
            let el_li = document.getElementById("mg-favorite-repos-nav-item");
            el_li.parentNode.removeChild(el_li);
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
      let repo = github_api.getRepoNameDict();
      if (repo) {
        // new repo item
        let item = {
          name: repo.full_name,
          url: origin + '/' + repo.full_name
        };
        if (!self.repos[origin]) {
          self.repos[origin] = {};
        }
        if (self.repos[origin][repo.name] == null) {
          self.repos[origin][repo.name] = [];
        }
        self.repos[origin][repo.name].push(repo.repo);

        // save to browser storage
        self.storeFavoriteRepos();

        // insert a repo item into dropdown menu DOM
        let el_item = self._createItem(item);
        let el_items = el_ul.querySelectorAll(
            "a[class='mg-dropdown-item-text']");
        if (el_items.length < 1) {
          el_ul.insertBefore(el_item, el_divider);
        }
        else {
          let el_repo_divider = el_ul.querySelector(
              "div[mg-divider='" + repo.name + "']");
          if (!el_repo_divider) {
            el_ul.insertBefore(el_item, el_divider);
            el_ul.insertBefore(self._createDivider(repo.name), el_item);
          }
          else {
            el_ul.insertAfter(el_item, el_repo_divider.nextSibling);
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
      let repo_name = github_api.getRepoName();
      if (self.repos[origin]) {
        for (let i = 0; i < self.repos[origin].length; ++i) {
          let repo = self.repos[origin][i];
          if (repo.name == repo_name) {
            is_added = true;
            break;
          }
        }
      }

      if (is_added || !repo_name) {
        el_divider.style.display = "none"
        el_add.style.display = "none";
      }
      else {
        if (Object.keys(self.repos).length > 0) {
          el_divider.style = null;
        }
        else {
          el_divider.style.display = "none"
        }
        el_add.style = null;
      }
    }

    // create elements for all favorite repos and add it into DOM
    let uris = Object.keys(this.repos);
    let is_insert_divider = false;
    // every github uri
    for (let i = 0; i < uris.length; ++i) {
      let uri = uris[i];
      if (!this.repos[uri]) {
        continue;
      }

      // every user name or organization name
      let names = Object.keys(this.repos[uri]).sort();
      for (let j = 0; j < names.length; ++j) {
        let repos = this.repos[uri][names[j]];

        // every repository name under specified user/org
        if (repos) {
          repos.sort();
          repos.forEach(function(item) {
            let el_item = self._createItem(item);
            el_ul.insertBefore(el_item, el_divider);
          });

          // add divider between different user
          if (is_insert_divider) {
            el_ul.insertBefore(this._createDivider(names[j]), el_divider);
          }
          else {
            is_insert_divider = true;
          }
        };
      }
    }
  }

  /**
   * Create a divider element between repsotories from different github uri
   */
  FavoriteReposInjector.prototype._createDivider = function(name) {
    let el_divider = document.createElement("div");
    el_divider.className = "dropdown-divider";
    el_divider.setAttribute("mg-divider", name);
    return el_divider;
  }

  return FavoriteReposInjector;
}());
