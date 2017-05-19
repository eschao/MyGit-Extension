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
  'use strict';
  /**
   * data structure in storage
   *
   * storage[MYGIT_GITHUB_ISSUE_FILTER_SETTINGS_KEY] = {
   *  'settings': { overwrite: true },
   * }
   *
   * storage[MYGIT_GITHUB_ISSUE_FILTER_KEY] = {
   *  'repo 1': { 'filter 1': 'fliter express..', ... },
   *  'repo 2': { 'filter 2': 'filter express..', ... }
   *  ...
   * }
   */

  function IssueFilter() {
    this.settings = { overwrite: true };
    this.filters = {};
    this.el_filter_mlist = null;

    // read configs from storage
    let self = this;
    browser_api.storage.get(MYGIT_GITHUB_ISSUE_FILTER_KEY, function(item) {
      if (item) {
        let data = item[MYGIT_GITHUB_ISSUE_FILTER_KEY];
        if (data) {
          self.filters = data;
        }
      }
    });
    browser_api.storage.get(MYGIT_GITHUB_ISSUE_FILTER_SETTINGS_KEY,
    function(item) {
      if (item) {
        let data = item[MYGIT_GITHUB_ISSUE_FILTER_SETTINGS_KEY];
        if (data) {
          self.settings = data;
        }
      }
    });
  }

  /**
   * Init after injection
   */
  IssueFilter.prototype.init = function() {
    // find out filter menu list DOM element
    let el_btns = document.querySelectorAll(
                  'button[class*="select-menu-button"]');
    for (let i = 0; i < el_btns.length; ++i) {
      if (el_btns[i].textContent.includes('Filters')) {
        let parent = el_btns[i].parentNode;
        this.el_filter_mlist = parent.querySelector(
                               'div[class="select-menu-list"]');
        break;
      }
    }

    // add filters to menu list
    if (this.el_filter_mlist) {
      this.el_filter_mlist.style.maxHeight = '600px';
      let repo_name = github_api.getRepoName();

      if (this.filters.hasOwnProperty(repo_name)) {
        let self = this;
        let el_last = this.el_filter_mlist.lastElementChild;

        Object.keys(this.filters[repo_name])
              .sort(StrUtils.compareIgnoreCase)
              .forEach(function(n) {
          let filter = {
            repo: repo_name, name: n, value: self.filters[repo_name][n],
            buildUrl: function() {
              return '/' + this.repo + '/issues?q=' + encodeURI(this.value);
            }
          };
          let node = self._createFilterMenuItem(filter);
          self.el_filter_mlist.insertBefore(node, el_last);
        })
      }
    }
  };

  /**
   * Save filters to storage
   */
  IssueFilter.prototype.storeFilters = function() {
    let data = {};
    data[MYGIT_GITHUB_ISSUE_FILTER_KEY] = this.filters;
    browser_api.storage.set(data);
  };

  /**
   * Save settings to storage
   */
  IssueFilter.prototype.storeSettings = function() {
    let data = {};
    data[MYGIT_GITHUB_ISSUE_FILTER_SETTINGS_KEY] = this.settings;
    browser_api.storage.set(data);
  };

  /**
   * Save filter
   */
  IssueFilter.prototype.show = function() {
    let el_filter = document.querySelector('input[id="js-issues-search"]');
    if (!el_filter) {
      console.warn("Can't find issue filter input element!");
      return;
    }

    // filter value
    let value = el_filter.value || '';
    value = value.trim();
    if (!value) {
      console.warn('The issue filter is empty!');
      return;
    }

    // repo name
    let repo_name = github_api.getRepoName();
    if (!repo_name) {
      console.warn("Can't get repository name!");
      return;
    }

    // show filter save dialog
    let filter = {
      repo: repo_name, name: '', value: value,
      buildUrl: function() {
        return '/' + this.repo + '/issues?q=' + encodeURI(this.value);
      }
    };
    this._showSaveDialog(filter);
  };

  /**
   * Show save dialog
   *
   * @param repo Repository which filter belongs to
   * @param filter Issue filter
   */
  IssueFilter.prototype._showSaveDialog = function(filter) {
    let root = document.createElement('div');
    root.className = 'mg-dialog-center mg-save-filter-dialog';
    root.id = 'mg-save-issue-filter-dialog';

    let self = this;
    let xhr = new XMLHttpRequest();
    xhr.open('GET',
      browser_api.extension.getURL('templates/save_issue_filter_dialog.html'),
      true);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        root.innerHTML = this.responseText;
        document.body.appendChild(root);
        self._initSaveDialog(root, filter);
      }
    };
    xhr.send();
  };

  /**
   * Inits save dialog
   *
   * @param root Dialog root DOM element
   * @param filter Issue filter
   */
  IssueFilter.prototype._initSaveDialog = function(root, filter) {
    let el_close = root.querySelector('a[id="mg-close"]');
    let win_click = function(e) {
      if (e.target != root && !root.contains(e.target)) {
        el_close.onclick();
      }
    };

    // check if close dialog when click is outside of it
    window.addEventListener('click', win_click, false);
    // click event for close button
    let close_dialog = function() {
      window.removeEventListener('click', win_click, false);
      document.body.removeChild(root);
    };
    el_close.onclick = close_dialog;

    // set filter
    let el_filter = root.querySelector('p[id="mg-filter"]');
    el_filter.innerText = filter.value;

    let el_overwrite = root.querySelector('input[id="mg-overwrite"]');
    let el_name = root.querySelector('input[id="mg-filter-name"]');
    let el_save = root.querySelector('a[id="mg-save-filter-btn"]');

    // set filter name if the filter exists
    let repo = filter.repo;
    if (this.filters.hasOwnProperty(repo)) {
      let keys = Object.keys(this.filters[repo]);
      for (let i = 0; i < keys.length; ++i) {
        let name = keys[i];
        if (this.filters[repo][name] == filter.value) {
          el_name.value = name;
          filter.name = name;
          break;
        }
      }
    }

    // state changed handler
    let self = this;
    let state_change_func = function() {
      let name = el_name.value;
      if (name) {
        name = name.trim();
      }

      if (!name ||
         (self._isFilterExists(filter.repo, name) && !el_overwrite.checked)) {
        if (!el_save.className.includes('mg-disabled')) {
          el_save.className += ' mg-disabled';
        }
      }
      else if (el_save.className.includes('mg-disabled')) {
        el_save.className = el_save.className.replace(' mg-disabled', '');
      }
    };

    // click event of Overwrite
    el_overwrite.checked = this.settings.overwrite;
    el_overwrite.onclick = function() {
      if (self.settings.overwrite != this.checked) {
        self.settings.overwrite = this.checked;
        self.storeSettings();
        state_change_func();
      }
    };

    // click event for Save
    el_save.onclick = function() {
      let name = el_name.value;
      if (name) {
        name = name.trim();
      }

      if (name) {
        // close save dialog
        close_dialog();

        // save to memory
        filter.name = name;
        if (!self.filters[repo]) {
          self.filters[repo] = {};
        }
        self.filters[repo][name] = filter.value;

        // save to storage
        self.storeFilters();

        // add/update menu list
        self._addFilterItem(filter);
      }
    };

    // lost focus event for Filter name
    el_name.onblur = state_change_func;
    el_name.onkeyup = function(e) {
      if (e.keyCode == 13) {
        state_change_func();
        if (!el_save.className.includes('mg-disabled')) {
          el_save.onclick();
        }
      }
    };

    state_change_func();
  };

  /**
   * Does filter exist?
   *
   * @param repo Repository name
   * @param name Issue filter name
   * @return True if it exists in storage
   */
  IssueFilter.prototype._isFilterExists = function(repo, name) {
    return (this.filters[repo] && this.filters[repo][name]);
  };

  /**
   * Create a filter menu item
   *
   * @param filter Issue filter
   * @return A DOM element represents menu item
   */
  IssueFilter.prototype._createFilterMenuItem = function(filter) {
    let el_a = document.createElement('a');
    el_a.className = 'select-menu-item js-navigation-item';
    el_a.innerHTML =
      '<i class="mg-icon-trash-o select-menu-item-icon hidden" ' +
      'id="mg-filter-trash"></i>\n' +
      '<div class="select-menu-item-text">' + filter.name + '</div>';
    el_a.href = filter.buildUrl();
    el_a.setAttribute('mg-filter-name', filter.name);

    // click event handler for deleting filter
    let self = this;
    let el_trash = el_a.querySelector('i[id="mg-filter-trash"]');
    el_trash.onclick = function() {
      el_a.parentNode.removeChild(el_a);
      delete self.filters[filter.repo][filter.name];
      self.storeFilters();
    };

    // show trash icon when mouse is over
    el_a.onmouseover = function() {
      el_trash.style.display = 'inline-block';
    };
    // hide trash icon when mouse is out
    el_a.onmouseout = function() {
      el_trash.style.display = 'none';
    };
    return el_a;
  };

  /**
   * Add a filter item to menu list, if the menu item exists, update it
   *
   * @param filter Issue filter
   */
  IssueFilter.prototype._addFilterItem = function(filter) {
    if (!this.el_filter_mlist) {
      return;
    }

    // check if filter existing in filter menu list
    let el_node = null;
    let el_nodes = this.el_filter_mlist.children;
    for (let i = 0; i < el_nodes.length; ++i) {
      let name = el_nodes[i].getAttribute('mg-filter-name');
      if (name && name == filter.name) {
        el_node = el_nodes[i];
        break;
      }
    }

    // update existing node
    if (el_node) {
      el_node.href = filter.buildUrl();
    }
    // insert a new node
    else {
      let el_last = this.el_filter_mlist.lastElementChild;
      let el_new = this._createFilterMenuItem(filter);
      this.el_filter_mlist.insertBefore(el_new, el_last);
    }
  };

  return IssueFilter;
}());

