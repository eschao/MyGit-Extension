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

  function LabelsInjector() {
    this.all_colors = { };
  }

  LabelsInjector.prototype.inject = function(url) {
    if (url.search("https:\/\/github.com\/.*\/.*\/labels") > -1) {
      this._getPredefinedColors();
      this._getUsedColors();
      this._appendColorList();
    }
  }

  LabelsInjector.prototype._getUsedColors = function() {
    let el_labels = document.querySelectorAll("a[class='label label-link']");
    if (el_labels != null) {
      let self = this;
      el_labels.forEach(function(l) {
        if (l.style != null & l.style.backgroundColor != null) {
          self.all_colors[l.style.backgroundColor] = true;
        }
      });
    }
  }

  LabelsInjector.prototype._getPredefinedColors = function() {
    let el_all_list = document.querySelectorAll(
                  "div[class='dropdown-menu dropdown-menu-se label-colors']");
    if (el_all_list != null & el_all_list.length > 0) {
      let el_colors = el_all_list[0].getElementsByTagName("span");
      let self = this;
      el_colors.forEach(function(c) {
        let color = c.getAttribute("data-hex-color");
        if (color != null) {
          self.all_colors[color] = false;
        }
      });
    }
  }

  LabelsInjector.prototype._appendColorList = function() {
  }

  return LabelsInjector;
}());
