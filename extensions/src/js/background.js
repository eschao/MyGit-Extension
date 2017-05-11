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

// When user click 'Sign In GitHub', the new browser tab will be opened for
// GitHub oauth, the tab object will be saved in this global variable and
// used in tab listener later.
var g_oauth_tab = null;

/**
 * Add a listener for browser tab.
 * The browser tab is using to open GitHub oauth page and grant permission to
 * MyGit extension for accessing realted GitHub resources under the spcial
 * user account
 */
browser_api.tabs.onUpdated.addListener(function(id, changeInfo, tab) {
  if (g_oauth_tab && g_oauth_tab.id == id && tab.url) {
    // search the authorized token
    index = tab.url.search(GITHUB_TOKEN_Q);
    if (index > -1) {
        token = tab.url.substr(index + GITHUB_TOKEN_Q.length);

        // save token in browser storage
        if (token) {
          g_oauth_tab = null;
          let data = {};
          data[MYGIT_GITHUB_KEY] =  {"token" : token};
          browser_api.storage.set(data, function(){ });
        }
    }
  }
});

/**
 * Sign in public github
 */
function signInGitHub() {
  let url = "https://github.com/login/oauth/authorize?client_id="
            + CLIENT_ID + "&scope=" + SCOPE + "&redirect_uri=" + REDIRECT_URI;
  browser_api.tabs.create({'url': url}, function(tab) {
    g_oauth_tab = tab;
  });
}

/**
 * Sign out public github
 */
function signOutGitHub() {
  if (g_oauth_tab == null) {
    browser_api.storage.remove(MYGIT_GITHUB_KEY, function(){});
  }
}

/**
 * Sign in github enterprise
 * Save the base uri and token into storage
 *
 * @baseUri Base uri for github enterprise
 * @token Access token for github enterprise
 */
function signInGitHubEnterprise(baseUri, token) {
  let data = {};
  data[MYGIT_GITHUB_E_KEY] = { "uri" : baseUri, "token" : token };
  browser_api.storage.set(data, function(){});
}

/**
 * Sign out github enterprise
 * Remove the base uri and token from storage
 */
function signOutGitHubEnterprise() {
  browser_api.storage.remove(MYGIT_GITHUB_E_KEY, function(){});
}
