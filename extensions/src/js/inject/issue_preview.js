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
  let MAX_PREVIEW_WIDTH = 600;

  function IssuePreviewInjector() {
    this.timer = null;
    this.style_sheet = null;

    this.renders = {
      'mg-issue-title': function(el, json) {
        el.innerHTML =
            '<a href="' + json.html_url + '" class="mg-issue-a" ' +
            'target="_blank"> <span class="mg-issue-number">#' + json.number +
            '</span>&nbsp;' + json.title + '</a>';
      },
      'mg-issue-state': function(el, json) {
        if (json.state) {
          if (json.state == 'closed') {
            el.innerHTML = '<i class="mg-octicon-closed mg-issue-state-icon">' +
                '</i>Closed';
            el.style.background = '#cb2431';
          }
          else {
            el.innerHTML = '<i class="mg-octicon-opened mg-issue-state-icon">' +
                '</i>' + json.state.charAt(0).toUpperCase() +
                json.state.slice(1);
            el.style.background = '#2cbe4e';
          }
        }
      },
      'mg-issue-state-desc': function(el, json) {
        if (json.closed_at && json.closed_by) {
          el.innerHTML = '<a href="' + json.closed_by.html_url + '" ' +
              'class="mg-issue-a mg-f-bold" target="_blank">' +
              json.closed_by.login + '</a> closed this issue ' +
              DateUtils.daysPassed(json.closed_at) + ' days ago ';
        }
        else {
          el.innerHTML = '<a href="' + json.user.html_url + '" ' +
              'class="mg-issue-a mg-f-bold" target="_blank">' +
              json.user.login + '</a> opend this issue ' +
              DateUtils.daysPassed(json.created_at) + ' days ago ';
        }
      },
      'mg-issue-milestone': function(el, json) {
        if (json.milestone) {
          el.style.display = 'flex';
          el.getElementsByTagName('label')[0].innerHTML =
              '<a href="' + json.milestone.html_url + '" class="mg-issue-a" ' +
              'target="_blank">' + json.milestone.title + '</a>';

          let pct = 0;
          let el_pct = el.querySelector('span[id="mg-issue-progress-pct"]');
          if (json.milestone.open_issues != null &&
              json.milestone.closed_issues != null) {
            let open = Number(json.milestone.open_issues);
            let closed = Number(json.milestone.closed_issues);
            pct = closed / (open + closed) * 100;
            el_pct.style.width = pct + '%';
          }
          else {
            el_pct.style.width = '0';
          }
        }
        else {
          el.style.display = 'none';
        }
      },
      'mg-issue-assignees': function(el, json) {
        let el_imgs = el.getElementsByTagName('a');
        while (el_imgs.length > 0) {
          el.removeChild(el_imgs[0]);
        }

        if (json.assignees) {
          el.style.display = 'flex';
          for (let i = 0; i < json.assignees.length; ++i) {
            let user = json.assignees[i];
            let el_a = document.createElement('a');
            el_a.href = user.html_url;
            el_a.target = '_blank';
            el_a.className = 'mg-issue-a';
            el_a.innerHTML = '<img alt="@' + user.login + '" class="avatar ' +
                'mg-issue-avatar" width="20" height="20" src="' +
                user.avatar_url + '">';
            el.appendChild(el_a);
          }
        }
        else {
          el.style.display = 'none';
        }
      },
      'mg-issue-labels': function(el, json) {
        let el_div = el.querySelector('div[id="mg-issue-all-labels"]');
        let el_labels = el_div.getElementsByTagName('label');
        while (el_labels.length > 0) {
          el_div.removeChild(el_labels[0]);
        }

        if (json.labels) {
          el.style.display = 'flex';
          for (let i = 0; i < json.labels.length; ++i) {
            let label = json.labels[i];
            let el_label = document.createElement('label');
            el_label.className = 'mg-issue-label mg-f-normal';
            el_label.style.background = '#' + label.color;

            let index = label.url.indexOf('\/repos\/');
            let url = index > -1 ? label.url.slice(index + 6) : label.url;
            let color = ColorUtils.getLuma(label.color) > 160 ?
                'style="color:black"' : '';
            el_label.innerHTML = '<a href="' + url + '" class="mg-issue-a" ' +
                'target="_blank" ' + color + '>' + label.name + '</a>';
            el_div.appendChild(el_label);
          }
        }
        else {
          el.style.display = 'none';
        }
      },
      'mg-issue-misc-divider': function(el, json) {
        if (json.milestone || json.assignees || json.labels) {
          el.style.display = 'flex';
        }
        else {
          el.style.display = 'none';
        }
      },
      'mg-issue-comments-number': function(el, json) {
        el.innerHTML = json.comments + ' Comments';
      },
      'mg-issue-body': function(el, json) {
        el.innerHTML = json.body || '';
      }
    };
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

    el_loading.style.display = "block";
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
      if (right > view_size.width - 4) {
        right = view_size.width - 4;
      }

      let pos = right - client_r.right + (where.top ? 8 : -16);
      after.position += 'right:' + pos + 'px;';
      el_root.style.right = (view_size.width - right) + 'px';
      el_root.style.left = 'auto';
    }
    else {
      let left = client_r.middle_x - max_dialog_width / 2;
      if (left < 4) {
        left = 4;
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
      after.position += 'bottom:-15px;';
      el_root.style.top = (screen_r.top - 10) + 'px';
      translate.y = '-100%';
    }
    else {
      after.rotate = 'transform:rotate(135deg);'
      after.box_shadow = 'box-shadow:-1px 1px 1px 0 rgba(0, 0, 0, 0.2); ';
      after.position += 'top:1px;';
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
    el_issue.style.display = 'flex';
    this._dockPreviewDialog(el_root, client_r, screen_r, MAX_PREVIEW_WIDTH);

    if (json) {
      let el_ids = el_root.querySelectorAll('*[id^="mg-issue-"]');
      for (let i = 0; i < el_ids.length; ++i) {
        let id = el_ids[i].id;
        if (this.renders[id]) {
          this.renders[id](el_ids[i], json);
        }
      }

      el_root.setAttribute('mg-issue-id', json.id);
    }
  }

  IssuePreviewInjector.prototype._initPreviewDialog = function(el_root) {
    let el_close = el_root.querySelector('i[id="mg-issue-close"]');
    let win_click = function(e) {
      if (e.target != el_root && !el_root.contains(e.target)) {
        el_close.onclick();
      }
    }

    // check if close dialog when click is outside of it
    window.addEventListener("click", win_click, false);
    // click event for close button
    let close_dialog = function() {
      //window.removeEventListener("click", win_click, false);
      el_root.style.display = 'none';
    }
    el_close.onclick = close_dialog;
    el_close.style.cursor = 'pointer';
  }

  IssuePreviewInjector.prototype._createPreviewDialog = function(el_anchor) {
    let el_root = document.createElement('div');
    el_root.className = 'mg-issue-preview';
    el_root.id = 'mg-issue-preview';
    el_root.style.maxWidth = MAX_PREVIEW_WIDTH + 'px';
    this.style_sheet = DomUtils.createStylesheet('mg-style-sheet');

    let self = this;
    let xhr = new XMLHttpRequest();
    xhr.open('GET',
             browser_api.extension.getURL('templates/issue_preview_dialog.html')
             , true);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        el_root.innerHTML = this.responseText;
        document.body.appendChild(el_root);
        self._initPreviewDialog(el_root);
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
              let index = el_links[i].pathname.lastIndexOf('/');
              let issue_id = index ? el_links[i].pathname.slice(index + 1) : '';
              let loaded_id = el_root.getAttribute('mg-issue-id');
              if (loaded_id && issue_id == loaded_id) {
                self._previewIssue(el_root, el_links[i], null);
                return;
              }
              if (el_root.style && el_root.style.display) {
                el_root.style.display = null;
              }
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
