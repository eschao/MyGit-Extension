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
 * Injector for labels page
 */
var LabelsInjector = (function() {
  "use strict";

  // constants
  let MAX_INTERVAL_COUNT = 100;
  let INTERVAL_TIME = 100;
  let NEW_COLORS = [
    "a25768", "d0576b", "e95295", "e198b4",
    "f7b977", "f39800", "ee7800", "c89932",
    "c3d825", "aacf53", "82ae46", "69821b",
    "0eea16", "98d98e", "68be8d", "3b7960",
    "2c4f54", "00a497", "80989b", "a0d8ef",
    "5b7e91", "426579", "164a84", "393f4c",
    "706caa", "884898", "985b8a", "7a4171",
    "b4866b", "71686c", "856859", "6f4b3e"
  ];

  function LabelsInjector() {
    // init colors with empty
    this.colors = {};
  }

  /**
   * Inject color list for label creation/edit
   */
  LabelsInjector.prototype.inject = function(url) {
    if (url.search("https:\/\/github.com\/.*\/.*\/labels") > -1 ||
       (github_api.github_e_token != null &&
        github_api.github_e_token.uri != null &&
        url.search("https:\/\/" + github_api.github_e_token.uri +
            "\/.*\/.*\/labels") > -1)) {
      // clear color list
      this.colors = {};

      let self = this;
      var count = 0;
      var interval = setInterval(function() {
        if (self._tryInjectColorList() || ++count > MAX_INTERVAL_COUNT) {
          clearInterval(interval);
        }
      }, INTERVAL_TIME);
  }

  /**
   * Try to inject color list
   *
   * @return True if inject sucessfully
   */
  LabelsInjector.prototype._tryInjectColorList = function() {
      // get predefined colors
      let el_color_menu = document.querySelector(
          "div[class='dropdown-menu dropdown-menu-se label-colors']");
      if (!el_color_menu || el_color_menu.childElementCount < 1) {
        console.log("Can't get predefined color list");
        return false;
      }

      console.log("Labels injecting...");

      // get all color menus
      let el_colors = el_color_menu.getElementsByTagName("span");
      let self = this;
      el_colors.forEach(function(c) {
        let color = c.getAttribute("data-hex-color");
        if (color != null) {
          self.colors[color] = false;
        }
      });

      // add new colors
      NEW_COLORS.forEach(function(c) {
        self.colors[c] = false;
      });

      // mark the used color
      this._markUsedColors();

      // add listeners to all color menus
      let el_lis = document.querySelectorAll("ul[class='table-list " +
          "table-list-bordered'] li");
      for (let i = 0; i < el_lis.length; ++i) {
        let el_input = el_lis[i].querySelector("input[name='label[color]']");
        let el_save = el_lis[i].querySelector("div[class='new-label-actions']" +
            " button[type='submit']");
        let el_delete = el_lis[i].querySelector("div[class='label-delete'] " +
            "button[type='submit']");
        this._addListeners(el_input, el_save, el_delete);
      }

      // install event listeners
      this._installListenersForCreateLabel();
      this._installLabelListObserver();
      return true;
    }
  }

  LabelsInjector.prototype._installListenersForCreateLabel = function() {
    let el_form = document.querySelector("form[id='new_label']");
    if (el_form) {
      let el_input = el_form.querySelector("input[name='label[color]']");
      let el_create = el_form.querySelector("button[type='submit']");
      this._addListeners(el_input, el_create);
    }
  }

  LabelsInjector.prototype._installLabelListObserver = function() {
    let self = this;
    let MObserver = window.MutationObserver || window.WebKitMutationObserver;
    let observer = new MObserver(function(mutations, observer) {
      mutations.forEach(function(m, i) {
        if (m.type == "childList" &&
            m.addedNodes != null &&
            m.addedNodes.length > 0) {
          m.addedNodes.forEach(function(el) {
            if (el.tagName == "LI") {
              let el_input = el.querySelector("input[name='label[color]']");
              let el_save = el.querySelector("div[class='new-label-actions'] " +
                  "button[type='submit']");
              let el_delete = el.querySelector("div[class='label-delete'] " +
                  "button[type='submit']");
              self._addListeners(el_input, el_save, el_delete);
            }
          });
        }
      });
    });

    let el_ul = document.querySelector("ul[class='table-list " +
                                       "table-list-bordered']");
    observer.observe(el_ul, { childList:true });
  }

  LabelsInjector.prototype._addListeners = function(el_input, el_save,
    el_delete) {
    let self = this;

    // add focus listener for color input
    if (el_input) {
      var handler = function() {
        let el_existed = el_input.parentNode.querySelector(
            "i[name='" + NEW_COLORS[0] + "']");
        if (el_existed == null) {
          let el_color_menu = el_input.parentNode.querySelector(
                              "div[class*='label-colors']");
          if (el_color_menu) {
            self._initColorMenuList(el_color_menu);
            el_input.removeEventListener("focus", handler, false);
          }
        }
      };
      el_input.addEventListener("focus", handler, false);
    }

    // add click listener for save button
    if (el_save) {
      el_save.addEventListener("click", function() {
        let old_color = (el_input.defaultValue || "").replace("#", "");
        let new_color = (el_input.value || "").replace("#", "");
        self.colors[old_color] = false;
        self.colors[new_color] = true;

        // hide all old colors' mark
        let el_old_colors = document.querySelectorAll("i[name='" + old_color +
            "']");
        for (let i = 0; i < el_old_colors.length; ++i) {
          if (el_old_colors[i].style) {
            el_old_colors[i].style.color = '#' + old_color;
          }
        }

        // show all new colors' mark
        let el_new_colors = document.querySelectorAll("i[name='" + new_color +
            "']");
        for (let i = 0; i < el_new_colors.length; ++i) {
          if (el_new_colors[i].style) {
            el_new_colors[i].style.color = "white";
          }
        }
      }, false);
    }

    // add click listener for delete button
    if (el_delete) {
      el_delete.addEventListener("click", function() {
        let color = (el_input.defaultValue || "").replace("#", "");
        let el_colors = document.querySelectorAll("i[name='" + color + "']");
        for (let i = 0; i < el_colors.length; ++i) {
          if (el_colors[i].style) {
            el_colors[i].style.color = '#' + color;
          }
        }
      }, false);
    }
  }

  /*
  LabelsInjector.prototype._addInputFocusListener = function(el) {
    let self = this;
    var handler = function() {
      let el_existed = el.parentNode.querySelector("span[data-hex-color='" +
                        NEW_COLORS[0] + "']");
      if (el_existed == null) {
        let el_color_menu = el.parentNode.querySelector(
          "div[class*='label-colors']");
        if (el_color_menu != null) {
          self._initColorMenuList(el_color_menu);
          el.removeEventListener("focus", handler, false);
        }
      }
    };
    el.addEventListener("focus", handler, false);
  }*/

  LabelsInjector.prototype._initColorMenuList = function(el_menu) {
    // set marked for used predefined color
    let el_spans = el_menu.getElementsByTagName("span");
    for (let j = 0; j < el_spans.length; ++j) {
      let el_span = el_spans[j];
      if (el_span.style && el_span.style.backgroundColor) {
        let color = rgbToHex(el_span.style.backgroundColor);
        el_span.innerHTML = '<i class="mg-icon-check mg-color-mark" name="' +
            color + '"></i>';
        el_span.firstElementChild.style.color =
          this.colors[color] == true ? "white" : ('#' + color);
      }
    }

    // append new colors
    let el_ul = null;
    for (let j = 0; j < NEW_COLORS.length; ++j) {
      if (j % 8 == 0) {
        el_ul = document.createElement("ul");
        el_ul.className = "color-chooser";
        el_menu.appendChild(el_ul);
      }

      let color = NEW_COLORS[j];
      let el_li = document.createElement("li");
      el_li.innerHTML =
        '<span class="color-cooser-color js-color-chooser-color ' +
        'labelstyle-b60205" style="background-color: #' + color +
        ' !important;" data-hex-color="' + color + '">' +
        '<i class="mg-icon-check mg-color-mark" name="' + color +
        '"></i></span>';
      el_ul.appendChild(el_li);
      let el_color = el_li.firstElementChild.firstElementChild;
      el_color.style.color =
        this.colors[color] == true ? "white" : ('#' + color);
    }
  }

  LabelsInjector.prototype._installColorSaveListener = function() {
    let el_divs = document.getElementsByClassName("new-label-actions");
    if (!el_divs) {
      return;
    }

    let self = this;
    for (let i = 0; i < el_divs.length; ++i) {
      let el_save = el_divs[i].querySelector("button[type='submit']");
      if (el_save != null) {
        el_save.addEventListener("click", function() {
          let el_input = el_divs[i].parentNode.querySelector(
                          "input[name='label[color]']");
          let org_color = el_input.defaultValue;
          if (org_color != null) {
            org_color = org_color.replace("#", "");
          }
          else {
            org_color = "";
          }

          let new_color = el_input.value;
          if (new_color == null || new_color.length < 1) {
            return;
          }
          new_color = new_color.replace("#", "");
          self.colors[org_color] = false;
          self.colors[new_color] = true;
        }, false);
      }
    }
  }

  /**
   * Mark labels used color with true
   */
  LabelsInjector.prototype._markUsedColors = function() {
    let el_labels = document.querySelectorAll("a[class='label label-link']");
    if (el_labels != null) {
      let self = this;
      el_labels.forEach(function(l) {
        if (l.style != null & l.style.backgroundColor != null) {
          let color = rgbToHex(l.style.backgroundColor);
          if (self.colors.hasOwnProperty(color)) {
            self.colors[color] = true;
          }
        }
      });
    }
  }

  return LabelsInjector;
}());
