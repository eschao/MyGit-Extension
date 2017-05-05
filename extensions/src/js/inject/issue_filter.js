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

  function IssueFilter() {
  }

  IssuFilter.prototype.inject = function() {
    var el_save_filter = document.getElementById("mg-save-issue-filter");

    if (el_save_filter == null) {
      var el_filter_input = document.getElementById("js-issues-search");
      el_filter_input.style.paddingRight = "30px";

      el_save_filter = document.createElement("i");
      el_save_filter.className = "octicon octicon-search subnav-search-icon " +
        "mg-save-issue-filter";
      el_save_filter.id = "mg-save-issue-filter";
      el_filter_input.parentNode.appendChild(el_save_filter);
    }

  }

  return IssueFilter;
}());

