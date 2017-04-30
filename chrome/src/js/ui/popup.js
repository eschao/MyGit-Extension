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
 * GitHub UI component which is responsible render public github UI part of
 * popup view
 */
var GitHubComp = (function() {
  "use strict";

  function GitHubComp() {
  }

  /**
   * Init component
   */
  GitHubComp.prototype.init = function() {
    // sign in button event handler
    var signin_btn = document.getElementById("mg-signin-btn");
    signin_btn.onclick = function () {
      signin_btn.disabled = true;
      chrome.extension.getBackgroundPage().signInGitHub();
    }

    // sign out button event handler
    var self = this;
    var signout_btn = document.getElementById("mg-signout-btn");
    signout_btn.onclick = function() {
      signout_btn.disabled = true;
      chrome.storage.sync.remove(MYGIT_GITHUB_KEY, function() {
        signout_btn.disabled = false;
        self.render();
      });
    }

    // render UI
    this.render();
  };

  /**
   * Render UI component
   */
  GitHubComp.prototype.render = function() {
    var signin_div = document.getElementById("mg-github-signin-div");
    var signout_div = document.getElementById("mg-github-signout-div");

    // read configurations from chome storage and render UI according to
    // configurations
    chrome.storage.sync.get(MYGIT_GITHUB_KEY, function(item) {
      if (item[MYGIT_GITHUB_KEY] != null &&
          item[MYGIT_GITHUB_KEY].token != null) {
        signout_div.style.display = "block";
        signin_div.style.display = "none";
      }
      else {
        signout_div.style.display = "none";
        signin_div.style.display = "block";
      }
    });
  }

  return GitHubComp;
}());

/**
 * GitHub Enterprise UI component which is responsible render github enterprise
 * UI part of popup view
 */
var GitHubEnterpriseComp = (function() {
  "use strict";

  function GitHubEnterpriseComp() {
    this.signed_in_token = {};

    // all supported github enterprises
    this.all_github_e = [
      { name : "ibm", // enterpise unique name
        icon : "mg-logo-ibm", // enterpise logo, should be web font
        uri : "github.ibm.com" // enterpise uri
      }
    ];
  }

  /**
   * Init UI component
   */
  GitHubEnterpriseComp.prototype.init = function() {
    var token_input = document.getElementById("mg-github-e-token");
    var message_span = document.getElementById("mg-message");

    // clean message when inputting token
    token_input.oninput = function() {
      message_span.textContent = "";
    }

    var self = this;
    var signin_btn = document.getElementById("mg-e-signin-btn");
    var select_btn = document.getElementById("mg-select-github-e");

    // sign in click event handler
    signin_btn.onclick = function() {
      var uri = document.getElementById("mg-github-e-uri").innerText;
      if (uri == null || uri.trim().length < 1) {
        message_span.textContent = "Please choose a GitHub Enterprise!";
        return;
      }

      var token = token_input.value;
      if (token == null || token.trim().length < 1) {
        message_span.textContent = "Please input oauthroized token!";
        return;
      }

      var data = {};
      data[MYGIT_GITHUB_E_KEY] = {
        "name" : select_btn.getAttribute("ghe"),
        "uri" : uri,
        "token" : token
      };

      // save github enterprise configs in chrome storage
      signin_btn.disabled = true;
      chrome.storage.sync.set(data, function() {
        signin_btn.disabled = false;
        self.render();
      });
    }

    // sign out click event handler
    var signout_btn = document.getElementById("mg-e-signout-btn");
    signout_btn.onclick = function() {
      signout_btn.disabled = true;
      chrome.storage.sync.remove(MYGIT_GITHUB_E_KEY, function() {
        signout_btn.disabled = false;
        self.render();
      });
    }

    this.initMenuModal();
    this.render();
  }

  /**
   * Init GitHub Enterprise menu modal
   */
  GitHubEnterpriseComp.prototype.initMenuModal = function() {
    var menu_modal = document.getElementById("mg-select-menu-modal");
    var select_btn = document.getElementById("mg-select-github-e");
    var menu_list_div = document.getElementById("mg-menu-list");

    // install all supported github enterprise
    var menu_items = "";
    this.all_github_e.forEach(function(item) {
      menu_items += '<div class="mg-select-menu-item" ghe="' + item.name + '">\n'
        + '<a href="#" ghe="' + item.name + '">\n' +
        '<i class="' + item.icon + ' mg-menu-logo"/></i>\n' +
        '<span class="mg-select-menu-heading">' +
        item.uri + '</span>\n' +
        '<i class="mg-icon-check mg-menu-check hidden"></i>' +
        '</a>\n</div>\n';
    });
    menu_list_div.innerHTML = menu_items;

    // set onclick event of menu item
    var self = this;
    menu_list_div.getElementsByClassName("mg-select-menu-item")
                 .forEach(function(ele) {
      ele.onclick = function() {
        menu_modal.style.display = "none";
        var name = ele.getAttribute("ghe");
        var oldName = select_btn.getAttribute("ghe");
        self.all_github_e.forEach(function(item) {
          if (name == item.name && oldName != item.name) {
            select_btn.setAttribute("ghe", item.name);
            select_btn.innerHTML =
                '<i class="' + item.icon + ' mg-menu-logo"/></i>\n' +
                '<span id="mg-github-e-uri">' + item.uri + '</span>\n' +
                '<i class="mg-icon-caret-down mg-select-i-show-menu"></i>\n';
            return;
          }
        });
      };
    });

    // show menu modal
    select_btn.onclick = function(event) {
      var show_menu_btn = document.querySelector("i[class^='mg-icon-caret-down']");
      if (show_menu_btn.style != null &&
          show_menu_btn.style.display != "none") {
        menu_modal.style.display = "block";
        var name = select_btn.getAttribute("ghe");
        menu_list_div.getElementsByTagName("a").forEach(function(ele) {
          var ele_check = ele.querySelector("i[class^='mg-icon-check']");
          if (ele.getAttribute("ghe") == name) {
            ele_check.style.display = "block";
          }
          else {
            ele_check.style = null;
          }
        });
        event.stopPropagation();
      }
    };

    // close menu modal
    document.getElementById("mg-select-menu-close").onclick = function() {
      menu_modal.style.display = "none";
    }

    // global click event handler
    document.onclick = function(event) {
      // close menu modal if it is showed
      if (menu_modal.style != null && menu_modal.style.display == "block" &&
          !menu_modal.contains(event.target)) {
        menu_modal.style.display = "none";
        return;
      }
    }
  }

  /**
   * Render UI component
   */
  GitHubEnterpriseComp.prototype.render = function () {
    var self = this;
    var signin_div = document.getElementById("mg-github-e-signin-div");
    var signout_div = document.getElementById("mg-github-e-signout-div");
    var token_input = document.getElementById("mg-github-e-token");
    var select_btn = document.getElementById("mg-select-github-e");

    chrome.storage.sync.get(MYGIT_GITHUB_E_KEY, function(item) {
      var ghe = self.all_github_e[0];
      if (item[MYGIT_GITHUB_E_KEY] != null &&
          item[MYGIT_GITHUB_E_KEY].token != null &&
          item[MYGIT_GITHUB_E_KEY].uri != null) {
        signout_div.style.display = "block";
        signin_div.style.display = "none";
        select_btn.cursor = "default";
        token_input.value = item[MYGIT_GITHUB_E_KEY].token;
        token_input.disabled = true;
        ghe.token = token_input.value;

        self.all_github_e.forEach(function(t) {
          if (t.name == item[MYGIT_GITHUB_E_KEY].name) {
            ghe = t;
            return;
          }
        });
      }
      else {
        signout_div.style.display = "none";
        signin_div.style.display = "block";
        select_btn.cursor = "pointer";
        token_input.value = "";
        token_input.disabled = false;
      }

      var style = "";
      if (ghe.token != null) {
        style = ' style="display:none"';
      }
      select_btn.setAttribute("ghe", ghe.name);
      select_btn.innerHTML =
          '<i class="' + ghe.icon + ' mg-menu-logo"/></i>\n' +
          '<span id="mg-github-e-uri">' + ghe.uri + '</span>\n' +
          '<i class="mg-icon-caret-down mg-select-i-show-menu"' + style +
          '></i>\n';
    });
  }

  return GitHubEnterpriseComp;
}());

var github_comp = new GitHubComp();
var github_e_comp = new GitHubEnterpriseComp();
github_comp.init();
github_e_comp.init();

