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
 * Issue preview injector class
 */
var IssuePreviewInjector = (function() {
  "use strict";

  // constants
  let MAX_INTERVAL_COUNT = 100;
  let INTERVAL_TIME = 100;
  let MAX_PREVIEW_WIDTH = 500;
  let MIN_PREVIEW_WIDTH = 300;

  function IssuePreviewInjector() {
    this.timer = null;
    this.style_sheet = null;
  }

  IssuePreviewInjector.prototype._matchUrl = function(url) {
    if (url) {
      // is public github url?
      if (github_api.github_token && github_api.github_token.token) {
        let uri = "https:\/\/github.com\/.*\/.*\/";
        if (url.search(uri + "issues\/\\d+$") > -1) {
          return true;
        }
      }

      // is github enterprise url?
      if (github_api.github_e_token && github_api.github_e_token.token) {
        let uri = "https:\/\/" + github_api.github_e_token.uri + "\/.*\/.*\/";
        if (url.search(uri + "issues\/\\d+$") > -1) {
          return true;
        }
      }
    }

    return false;
  }

  IssuePreviewInjector.prototype._showLoading = function(el_root, el_anchor) {
    let el_loading = el_root.querySelector("div[id='mg-issue-loading']");
    let el_issue = el_root.querySelector("div[id='mg-issue-content']");

    el_loading.style.display = "inline-block";
    el_issue.style.display = "none";

    let screen_r = DomUtils.getElementScreenRect(el_anchor);
    let client_r = el_anchor.getBoundingClientRect();
    this._dockPreviewDialog(el_root, client_r, screen_r, 120);
  }

  /**
   * Dock issue preview dialog
   */
  IssuePreviewInjector.prototype._dockPreviewDialog =
    function(el_root, client_r, screen_r, max_dialog_width) {
    let view_size = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
    };

    let middle_x = client_r.left + client_r.width / 2;
    let where = {
        top: client_r.top > (view_size.height- client_r.bottom),
        left: client_r.left > (view_size.width - client_r.right),
        middle: (middle_x > max_dialog_width / 2) &&
                ((view_size.width - middle_x) > max_dialog_width / 2)
    };

    let after = {
      css:'content:""; position:absolute; width:0; height:0; ' +
          'box-size:border-box; border:8px solid black; transform-origin:0 0;' +
          'border-color:transparent transparent #fff #fff;',
      rotate: '',
      box_shadow: '',
      position: ''
    };

    client_r.middle_x = client_r.left + client_r.width / 2;
    let translate = { x: '0', y: '0' };

    if (where.middle) {
      after.position += 'left:calc(50% ' + (where.top ? '-' : '+') + ' 10px);';
      el_root.style.left = middle_x + 'px';
      translate.x = '-50%';
    }
    else if (where.left) {
      let right = client_r.right + max_dialog_width / 2;
      if (right > view_size.width - 2) {
        right = view_size.width - 2;
      }

      let pos = right - client_r.right + (where.top ? 8 : -16);
      after.position += 'right:' + pos + 'px;';
      el_root.style.right = (view_size.width - right) + 'px';
      el_root.style.left = 'auto';
    }
    else {
      let left = client_r.middle_x - max_dialog_width / 2;
      if (left < 2) {
        left = 2;
      }
      let pos = client_r.middle_x - left + (where.top ? -10 : 10);
      after.position += 'left:' + pos + 'px;';
      el_root.style.left = left + 'px';
      el_root.style.right = 'auto';
    }

    if (where.top) {
      after.rotate = 'transform:rotate(-45deg);'
      after.box_shadow = 'box-shadow:-2px 2px 1px 0 rgba(0, 0, 0, 0.04), ' +
          '-4px 4px 3px 0 rgba(0, 0, 0, 0.16);';
      after.position += 'bottom:-16px;';
      el_root.style.top = (screen_r.top - 10) + 'px';
      translate.y = '-100%';
    }
    else {
      after.rotate = 'transform:rotate(135deg);'
      after.box_shadow = 'box-shadow:-1px 1px 1px 0 rgba(0, 0, 0, 0.2); ';
      after.position += 'top:0px;';
      el_root.style.top = (screen_r.bottom + 16) + 'px';
    }

    el_root.style.transform = 'translate(' + translate.x + ',' +
        translate.y + ')';

    DomUtils.cleanStylesheet(this.style_sheet);
    DomUtils.addCSSRule(this.style_sheet, '.mg-issue-preview:after',
        after.css + after.position + after.rotate + after.box_shadow, 0);
  }

  IssuePreviewInjector.prototype._previewIssue =
    function(el_root, el_anchor, json) {
    let screen_r = DomUtils.getElementScreenRect(el_anchor);
    let client_r = el_anchor.getBoundingClientRect();
    let el_loading = el_root.querySelector('div[id="mg-issue-loading"]');
    let el_issue = el_root.querySelector('div[id="mg-issue-content"]');
    el_loading.style.display = 'none';
    el_issue.style.display = 'inline-block';
    this._dockPreviewDialog(el_root, client_r, screen_r, MAX_PREVIEW_WIDTH);

    let el_labels = el_root.getElementByTagName('label');
    for (let i = 0; i < el_labels.length; ++i) {
      let id = el_labels[i].id;
      if (id == 'mg-issue-number') {
      }
      else if (id == 'mg-issue-title') {
      }
      else if (id == 'mg-issue-state') {
      }
    }

    /*
    el_issue.setAttribute("issue-id", json.id);
    let el_title = el_issue.querySelector("span[id='mg-issue-title']");
    el_title.innerText = "#" + json.number + " " + json.title;
    let el_state_labels= el_issue.querySelector(
        "div[id='mg-issue-state-labels']");
    el_state_labels.innerHTML = "<label>";
    if (json.state == "open") {
    }
    else if (json.state == "closed") {
    }
    el_state_labels.innerHTML += json.state + "</label>";
    if (json.labels) {
      for (let i = 0; i < json.labels.length; ++i) {
        el_state_labels.innerHTML += "<label>" + json.labels[i].name
            + "</label>";
      }
    }*/
  }

  IssuePreviewInjector.prototype._createPreviewDialog = function(el_anchor) {
    let el_root = document.createElement('div');
    el_root.className = 'mg-issue-preview';
    el_root.id = 'mg-issue-preview';
    el_root.style.maxWidth = MAX_PREVIEW_WIDTH + 'px';
    this.style_sheet = DomUtils.createStylesheet('mg-style-sheet');
    //el_root.style.minWidth = MIN_PREVIEW_WIDTH + 'px';

    let self = this;
    let xhr = new XMLHttpRequest();
    xhr.open('GET',
             browser_api.extension.getURL('templates/issue_preview_dialog.html')
             , true);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        el_root.innerHTML = this.responseText;
        document.body.appendChild(el_root);
        self._showLoading(el_root, el_anchor);
      }
    }
    xhr.send();
    return el_root;
  }

  IssuePreviewInjector.prototype._tryInjectPreview = function() {
    let el_open = document.querySelector("button[name='comment_and_open']");
    let el_close = document.querySelector("button[name='comment_and_close']");

    if ((el_open || el_close) && this._matchUrl(window.location.href)) {
      let self = this;
      let el_links = document.querySelectorAll("a[class^='issue-link']");

      for (let i = 0; i < el_links.length; ++i) {
        el_links[i].onmouseover = function() {
          let hub = github_api.getCurrentHub();
          if (hub.token && hub.api_uri && hub.repo) {
            let el_root = document.getElementById("mg-issue-preview");
            if (el_root) {
              self._showLoading(el_root, el_links[i]);
            }
            else {
              el_root = self._createPreviewDialog(el_links[i]);
            }

            let url = "https://" + hub.api_uri + "/repos" +
                el_links[i].pathname;
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Accept",
                "application/vnd.github.mercy-preview+json");
            xhr.setRequestHeader("Authorization", "token " + hub.token);
            xhr.onreadystatechange = function() {
              if (xhr.readyState == 4 && xhr.status == 200) {
                self._previewIssue(el_root, el_links[i],
                    JSON.parse(xhr.responseText));
              }
            }
            xhr.send();
          }
        }
      }
    }
  }

  IssuePreviewInjector.prototype.inject = function(url) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this._matchUrl(url)) {
      let self = this;
      var count = 0;
      this.timer = setInterval(function() {
        if (self._tryInjectPreview() || ++count > MAX_INTERVAL_COUNT ||
            !self._matchUrl(window.location.href)) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }, INTERVAL_TIME);
    }
  }

  IssuePreviewInjector.prototype.init = function() {
  }

  return IssuePreviewInjector;
}());
