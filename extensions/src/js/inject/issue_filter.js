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

var IssueFilter = (function() {

  /**
   * filter data structure in storage
   *
   * storage[MYGIT_ISSUE_FILTER_KEY] = {
   *  "repo 1": { "filter 1": "fliter express..", ... },
   *  "repo 2": { "filter 2": "filter express..", ... }
   *  ...
   * }
   */

  function IssueFilter() {
    this.filters = {};
    this.el_filter_mlist = null;

    let self = this;
    browser_api.storage.get(MYGIT_ISSUE_FILTER_KEY, function(item) {
      if (item != null) {
        self.filters = item[MYGIT_ISSUE_FILTER_KEY];
        if (self.filters == null) {
          self.filters = {};
        }
      }
    });
  }

  IssueFilter.prototype.init = function() {
    // find out filter menu list DOM element
    let el_btns = document.querySelectorAll(
                  "button[class*='select-menu-button']");
    for (let i = 0; i < el_btns.length; ++i) {
      if (el_btns[i].textContent.includes("Filters")) {
        let parent = el_btns[i].parentNode;
        this.el_filter_mlist = parent.querySelector(
                               "div[class='select-menu-list']");
        break;
      }
    };

    // add filters to menu list
    if (this.el_filter_mlist) {
      this.el_filter_mlist.style.maxHeight = "600px";
      let repo_name = github_api.getRepoName();

      if (this.filters.hasOwnProperty(repo_name)) {
        let self = this;
        let el_last = this.el_filter_mlist.lastElementChild;

        Object.keys(this.filters[repo_name]).forEach(function(n) {
          let filter = {
            repo: repo_name, name: n, value: self.filters[repo_name][n],
            buildUrl: function() {
              return "/" + this.repo + "/issues?q=" + encodeURI(this.value);
            }
          };
          let node = self._createFilterMenuItem(filter);
          self.el_filter_mlist.insertBefore(node, el_last);
        });
      }
    }
  }

  /**
   * Inject 'save' icon menu in issue filter input box
   */
  /*
  IssueFilter.prototype.inject = function(url) {
    let matched = this.matchInjectUrl(url);
    if (matched != this.URL_UNKNOWN) {
      let el_save_filter = document.getElementById("mg-save-issue-filter");

      if (el_save_filter == null) {
        let el_filter_input = document.getElementById("js-issues-search");
        el_filter_input.style.paddingRight = "30px";

        el_save_filter = document.createElement("i");
        el_save_filter.className = "octicon octicon-search mg-save-issue-filter"
          + " mg-icon-bookmark-o";
        el_save_filter.id = "mg-save-issue-filter";
        el_filter_input.parentNode.appendChild(el_save_filter);

        // click event handler for saving filter
        el_save_filter.onclick = function() {
        }
      }
    }
  }*/

  /**
   * Save filter
   */
  IssueFilter.prototype.save = function() {
    let el_filter = document.querySelector("input[id='js-issues-search']");
    if (el_filter == null) {
      console.log("Can't find issue filter input element!");
      return;
    }

    // filter value
    let value = el_filter.getAttribute("value");
    if (value == null) {
      return;
    }
    value = value .trim();
    if (value.length < 1) {
      return;
    }

    // repo name
    let repo_name = github_api.getRepoName();
    if (repo_name == null) {
      console.log("Can't get repository name!");
      return null;
    }

    // show filter save dialog
    let filter = {
      repo: repo_name, name: "", value: value,
      buildUrl: function() {
        return "/" + this.repo + "/issues?q=" + encodeURI(this.value);
      }
    };
    this._showSaveDialog(filter);
  }

  /**
   * Show save dialog
   *
   * @param repo Repository which filter belongs to
   * @param filter Issue filter
   */
  IssueFilter.prototype._showSaveDialog = function(filter) {
    let root = document.createElement("div");
    root.className = "mg-dialog-center mg-save-filter-dialog";
    root.id = "mg-save-issue-filter-dialog";

    var self = this;
    let xhr = new XMLHttpRequest();
    xhr.open("GET",
      browser_api.extension.getURL("templates/save_issue_filter_dialog.html"),
      true);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        root.innerHTML = this.responseText;
        document.body.appendChild(root);
        self._initSaveDialog(root, filter);
      }
    }
    xhr.send();
  }

  /**
   * Inits save dialog
   *
   * @param root Dialog root DOM element
   * @param filter Issue filter
   */
  IssueFilter.prototype._initSaveDialog = function(root, filter) {
    let self = this;
    let el_close = root.querySelector("a[id='mg-close']");
    el_close.onclick = function() {
      document.body.removeChild(root);
    }

    // set filter
    let el_filter = root.querySelector("p[id='mg-filter']");
    el_filter.innerText = filter.value;

    let el_overwrite = root.querySelector("input[id='mg-overwrite']");
    let el_name = root.querySelector("input[id='mg-filter-name']");
    let el_save = root.querySelector("a[id='mg-save-filter-btn']");

    // set filter name if the filter exists
    let repo = filter.repo;
    if (this.filters.hasOwnProperty(repo)) {
      let keys = Object.keys(this.filters[repo]);
      for (let i = 0; i < keys.length; ++i) {
        if (keys[i] == filter.name) {
          el_name.value = keys[i];
          break;
        }
      }
    }

    let state_change_func = function() {
      let name = el_name.value;
      if (name != null) {
        name = name.trim();
      }

      if ((name == null || name.length < 1 ||
          (self._isFilterExists(filter.repo, name) && !el_overwrite.checked)) &&
          !el_save.className.includes("mg-disabled")) {
        el_save.className += " mg-disabled";
      }
      else if (el_save.className.includes("mg-disabled")) {
        el_save.className = el_save.className.replace(" mg-disabled", "");
      }
    }

    // click event of Overwrite
    el_overwrite.onclick = state_change_func;
    // lost focus event for Filter name
    el_name.onfocusout = state_change_func;

    // click event for Save
    el_save.onclick = function() {
      let name = el_name.value;
      if (name != null) {
        name = name.trim();
      }

      if (name != null && name.length > 0) {
        // close save dialog
        document.body.removeChild(root);

        // save to memory
        filter.name = name;
        if (self.filters[repo] == null) {
          self.filters[repo] = {};
        }
        self.filters[repo][name] = filter.value;

        // save to storage
        let data = {};
        data[MYGIT_ISSUE_FILTER_KEY] = self.filters;
        browser_api.storage.set(data);

        // add/update menu list
        self._addFilterItem(filter);
      }
    }

    state_change_func();
  }

  /**
   * Does filter exist?
   *
   * @param repo Repository name
   * @param name Issue filter name
   * @return True if it exists in storage
   */
  IssueFilter.prototype._isFilterExists = function(repo, name) {
    return (this.filters[repo] != null &&
            this.filters[repo][name] != null);
  }

  /**
   * Create a filter menu item
   *
   * @param filter Issue filter
   * @return A DOM element represents menu item
   */
  IssueFilter.prototype._createFilterMenuItem = function(filter) {
    let el_a = document.createElement("a");
    el_a.className = "select-menu-item js-navigation-item navigation-focus";
    el_a.innerHTML = '<div class="select-menu-item-text">' + filter.name +
                     '</div>';
    el_a.href = filter.buildUrl();
    el_a.setAttribute("mg-filter-name", filter.name);
    return el_a;
  }

  /**
   * Add a filter item to menu list, if the menu item exists, update it
   *
   * @param filter Issue filter
   */
  IssueFilter.prototype._addFilterItem = function(filter) {
    if (this.el_filter_mlist == null) {
      return;
    }

    // check if filter existing in filter menu list
    let el_node = null;
    let el_nodes = this.el_filter_mlist.children;
    for (let i = 0; i < el_nodes.length; ++i) {
      let name = el_nodes[i].getAttribute("mg-filter-name");
      if (name != null && name == filter.name) {
        el_node = el_nodes[i];
        break;
      }
    }

    // update existing node
    if (el_node != null) {
      el_node.href = filter.buildUrl();
    }
    // insert a new node
    else {
      let el_last = this.el_filter_mlist.lastElementChild;
      let el_new = this._createFilterMenuItem(filter);
      this.el_filter_mlist.insertBefore(el_new, el_last);
    }
  }

  return IssueFilter;
}());

