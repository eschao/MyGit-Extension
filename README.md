## MyGit-Extension

> A browser extension for GitHub

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

The aim of **MyGit-Extension** project is to extend GitHub functions by injecting html/javascript codes into GitHub page through browser extension. 
Initially, we plan to provides the below functions for convenient user:
 - **Export issues as CSV**
 
   Injects an **```Export```** button next to **```Milestones```** in issue page. User can launch the **```Export```** wizard dialog by it and customize the the following export settings to generate CSV format file:
   - Enable/disable exporting issue fields
   - Adjust issue fields order
   - Customize CSV delimiter
   - Enable/disable expanding issue labels
   
 - **Save customized issue filter**
 
   Injects a **Save** button in issue filter input box. User can save a customized filter for later using.
   
 - **Favorite repositories**
 
   Injects a **Favorite Repos** in GitHub top banner. User can save the current repository as favorite one or quickly jump to favorite repository by it.
   
 - **More colors for label creation**
 
   Injects a rich color list to pick up when creating label.
   
## Installation

  * Install from Chrome/Firefox store
  
    - For **Chrome**: 
    - For **Firefox**:
    
  * Install from release
  
    - Download the latest relase from release page
    - For **Chrome**: Open chrome extension page by clicking **```Settings -> Extensions```**, drag the downloaded crx file into this page, Chrome will ask you and click **```Yes```** to install.
    - For **Firefox**: &lt;TBD&gt;
 
## Usage

The extension can support public GitHub and enterpise GitHub. Due to the limitation from browser extension, there is only one enterprise GitHub -**IBM**- to be available now. If a new GitHub enterpise need to be supported, please tell me to add.

The extension only needs **```repo```** and **```user:email```** permission. More details about GitHub permission, please see

  * **Signin public GitHub**
  
    Click **```Signin GitHub```**, it will jump to GitHub authroization page to let you assign special permissions for extenstion to access your repository.
  
  * **Signin GitHub enterprise**
  
    Before signing in GitHub enterpise, you need to follow the below steps to generate a **```Personal access tokens```**
    - Login GitHub and goto **```Settings```** page
    - Click **```Personal access tokens```** to open it
    - Click **```Generate new token```** 
    - Input **```Token description```** as you like, for example: MyGit Extension
    - Select the below **```Scopes```**
      * All scopes of **```repo```**
      * Scope: **```user:email```**
    - Click **```Generate token```** button at the bottom of the page
    
    And now, you can get a token for our extension, copy and paste it in token input box, click **```Sign In GitHub Enterprise```** to login.


