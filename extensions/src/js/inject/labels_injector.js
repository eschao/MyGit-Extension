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

  let new_colors = [
    "eb6ea6", "e95295", "a25768", "a22041",
    "f7b977", "f39800", "ee7800", "c89932",
    "c3d825", "aacf53", "82ae46", "69821b",
    "0eea16", "98d98e", "68be8d", "3b7960",
    "478384", "00a497", "80989b", "2c4f54",
    "5b7e91", "426579", "4d4c61", "393f4c",
    "706caa", "674598", "985b8a", "7a4171",
    "b4866b", "71686c", "856859", "6f4b3e"
  ];

  function LabelsInjector() {
    this.colors = {};
  }

  LabelsInjector.prototype.inject = function(url) {
    if (url.search("https:\/\/github.com\/.*\/.*\/labels") > -1 ||
        url.search("https:\/\/" + github_api.github_e_token.uri +
            "\/.*\/.*\/labels") > -1) {
      // clear color list
      this.colors = {};

      // get predefined colors
      let el_color_menus = document.querySelectorAll(
                    "div[class='dropdown-menu dropdown-menu-se label-colors']");
      if (!el_color_menus || el_color_menus.length < 1) {
        console.log("Can't get predefined color list");
        return;
      }

      // get all color menus
      let el_colors = el_color_menus[0].getElementsByTagName("span");
      let self = this;
      el_colors.forEach(function(c) {
        let color = c.getAttribute("data-hex-color");
        if (color != null) {
          self.colors[color] = false;
        }
      });

      // add new colors
      new_colors.forEach(function(c) {
        self.colors[c] = false;
      });

      // mark the used color
      this._markUsedColors();
      /*
      let el_labels = document.querySelectorAll("a[class='label label-link']");
      if (el_labels != null) {
        el_labels.forEach(function(l) {
          if (l.style != null & l.style.backgroundColor != null) {
            let color = rgbToHex(l.style.backgroundColor);
            if (self.colors.hasOwnProperty(color)) {
              self.colors[color] = true;
            }
          }
        });
      }*/

      // add new colors to all color menus
      for (let i = 0; i < el_color_menus.length; ++i) {
        this._initColorMenuList(el_color_menus[i]);
      }

      // install event listeners
      this._installColorInputListener();
      this._installColorSaveListener();
    }
  }

  LabelsInjector.prototype._installColorInputListener = function() {
    let el_inputs = document.getElementsByName("label[color]");
    if (!el_inputs) {
      return;
    }

    let self = this;
    //let new_color = this.new_colors[0];
    for (let i = 0; i < el_inputs.length; ++i) {
      let el_input = el_inputs[i];
      el_input.addEventListener("focus", function() {
        let el_existed = el_input.parentNode.querySelector(
          "span[data-hex-color='" + new_colors[0] + "']");
        if (el_existed == null) {
          let el_color_menu = el_input.parentNode.querySelector(
            "div[class*='label-colors']");
          if (!el_color_menu) {
            self._initColorMenuList(el_color_menu);
          }
        }
      }, false);
    }
  }

  LabelsInjector.prototype._initColorMenuList = function(el_menu) {
    // set marked for used predefined color
    let el_spans = el_menu.getElementsByTagName("span");
    for (let j = 0; j < el_spans.length; ++j) {
      let el_span = el_spans[j];
      if (el_span.style != null & el_span.style.backgroundColor != null) {
        let color = rgbToHex(el_span.style.backgroundColor);
        el_span.innerHTML = '<i class="mg-icon-check mg-color-mark"></i>';
        el_span.firstElementChild.style.color =
          this.colors[color] == true ? "white" : ('#' + color);
      }
    }

    // append new colors
    let el_ul = null;
    for (let j = 0; j < new_colors.length; ++j) {
      if (j % 8 == 0) {
        el_ul = document.createElement("ul");
        el_ul.className = "color-chooser";
        el_menu.appendChild(el_ul);
      }

      let color = new_colors[j];
      let el_li = document.createElement("li");
      el_li.innerHTML =
        '<span class="color-cooser-color js-color-chooser-color ' +
        'labelstyle-b60205" style="background-color: #' + color +
        ' !important;" data-hex-color="' + color + '">' +
        '<i class="mg-icon-check mg-color-mark"></i></span>';
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
          self._updateColorsMark(org_color, false);
          self._updateColorsMark(new_color, true);
          self.colors[org_color] = false;
          self.colors[new_color] = true;
        }, false);
      }
    }
  }

  LabelsInjector.prototype._updateColorsMark = function(color, is_mark) {
    let el_colors = document.querySelectorAll("span[data-hex-color='" +
                    color + "']");
    if (el_colors != null) {
      el_colors.forEach(function(el) {
        el.firstElementChild.style.color = is_mark ? "white" : ('#' + color);
      });
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
