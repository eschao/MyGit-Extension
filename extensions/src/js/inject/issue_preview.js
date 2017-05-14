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

  IssuePreviewInjector.prototype._showLoading = function(el_root) {
    let el_loading = el_root.querySelector("div[id='mg-issue-loading']");
    let el_issue = el_root.querySelector("div[id='mg-issue-content']");

    el_loading.style.display = "inline-block";
    el_issue.style.dispaly = "none";
  }

  // https://codepen.io/ryanmcnz/pen/JDLhu
  IssuePreviewInjector.prototype._setPreviewDialogPos =
    function(el_root, clientRect, scrRect) {
    let view_width = document.documentElement.clientWidth;
    let view_height = document.documentElement.clientHeight;
    let is_top = true;//clientRect.top > (view_height - clientRect.bottom);
    let is_left = clientRect.left > (view_width - clientRect.right);

    let middle_x = scrRect.left + clientRect.width / 2;
    let is_middle = (middle_x > MAX_PREVIEW_WIDTH / 2) &&
                    ((view_width - middle_x) > MAX_PREVIEW_WIDTH / 2);
    DomUtils.cleanStylesheet(this.style_sheet);

    let after_before_css = 'border:solid transparent; content:" "; height:0; border-left-width: 0; border-right-width:0;'
        + 'width:0; position:absolute; pointer-events:none;';
    let top_or_bottom = is_top ? "top:100%; " : "bottom:100%; ";
    let transform = { x: '0', y: '0' };
    if (is_middle) {
      after_before_css += top_or_bottom + 'left:50%;';
      el_root.style.left = middle_x + 'px';
      transform.x = '-50%';
    }
    else if (is_left) {
      after_before_css += top_or_bottom + 'left:calc(100% - ' +
          clientRect.width / 2 + 'px);';
      el_root.style.left = 'calc(' + scrRect.right + 'px - 100%)';
      el_root.style.transform = null;
    }
    else {
      after_before_css += top_or_bottom + 'left:' + clientRect.width / 2 + 'px;';
      el_root.style.left = scrRect.left + 'px';
      el_root.style.transform = null;
    }

    let after_css;
    let before_css;
    if (is_top) {
      after_css = "border-top-color:#fff; border-width: 10px; " +
          "margin-left: -10px;";
      before_css = "border-top-color:#d1d5da; border-width: 11px; " +
          "margin-left: -11px; box-shadow: 10px 5px 5px black";
      let s = "calc(" + (scrRect.top - 12) + "px -100%)";
      el_root.style.top = (scrRect.top - 12) + 'px';
      transform.y = '-100%';
    }
    else {
      after_css = "border-bottom-color:#fff; border-width: 10px; " +
          "margin-left: -10px;";
      before_css = "border-bottom-color:#d1d5da; border-width: 11px; " +
          "margin-left: -11px;";
      el_root.style.top = (scrRect.bottom + 12) + "px";
    }

    el_root.style.transform = 'translate(' + transform.x + ',' +
        transform.y + ')';

    DomUtils.addCSSRule(this.style_sheet, ".mg-issue-preview:after",
        after_css, 0);
    DomUtils.addCSSRule(this.style_sheet, ".mg-issue-preview:before",
        before_css, 0);
    DomUtils.addCSSRule(this.style_sheet,
        ".mg-issue-preview:after, .mg-issue-preview:before",
        after_before_css, 0);
  }

  IssuePreviewInjector.prototype._showIssue =
    function(el_anchor, el_root, json) {
    let scrRect = DomUtils.getElementScreenRect(el_anchor);
    this._setPreviewDialogPos(el_root, el_anchor.getBoundingClientRect(),
        scrRect);
    //el_root.style.left = rect.left + "px";
    //el_root.style.top = rect.bottom + "px";
    let el_loading = el_root.querySelector("div[id='mg-issue-loading']");
    let el_issue = el_root.querySelector("div[id='mg-issue-content']");

    /*
    el_loading.style.display = "none";
    el_issue.style.display = "inline-block";

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

  IssuePreviewInjector.prototype._createPreviewDialog = function() {
    this.style_sheet = DomUtils.createStylesheet('mg-style-sheet');
    let el_root = document.createElement('div');
    el_root.className = 'mg-issue-preview';
    el_root.id = 'mg-issue-preview';
    el_root.style.maxWidth = MAX_PREVIEW_WIDTH + 'px';

    let xhr = new XMLHttpRequest();
    xhr.open("GET",
             browser_api.extension.getURL("templates/issue_preview_dialog.html")
             , true);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        el_root.innerHTML = this.responseText;
        document.body.appendChild(el_root);
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
              this._showLoading(el_root);
            }
            else {
              el_root = self._createPreviewDialog();
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
                self._showIssue(el_links[i], el_root,
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
