## MyGit-Extension

> A browser extension for GitHub

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Introduction

The aim of **MyGit-Extension** project is to extend GitHub functions by injecting html/javascript codes into GitHub page through browser extension. 

The below functions for convenient user are planned to provide in the extension:
 - **Export issues as CSV**
 
   ![export](https://cloud.githubusercontent.com/assets/20178358/25611688/9a133744-2f5a-11e7-93de-7ac651b8d9d6.png)
   
   Injects an **```Export```** button next to **```Milestones```** in issue page. User can launch the **```Export```** wizard dialog by it and customize the the below settings to generate CSV format file:
   - Enable/disable exporting issue fields
   - Adjust issue fields order
   - Customize CSV delimiter
   - Enable/disable expanding issue labels
   
 - **Save customized issue filter**
 
   Injects a **Save** button in issue filter input box. User can save a customized filter for later using.
   
 - **Favorite repositories**
 
   ![fr](https://cloud.githubusercontent.com/assets/20178358/25611698/9fce49ee-2f5a-11e7-8b86-c7c76893a8e7.png)
   
   Injects a **Favorite Repos** in GitHub top banner. User can save the current repository as favorite one or quickly jump to favorite repository by it.
   
 - **More colors for label creation**
 
   Injects a rich color list to pick up when creating label.
   
## Installation

  * Install from Chrome/Firefox store
  
    - For **Chrome**: 
    - For **Firefox**:
    
  * Install from [release](https://github.com/eschao/MyGit-Extension/releases)
  
    - Download the latest relase from release page
    - For **Chrome**: Open chrome extension page by clicking **```Settings -> Extensions```**, drag the downloaded crx file into this page, Chrome will ask you and click **```Yes```** to install.
    - For **Firefox**: &lt;TBD&gt;
 
## Usage

The extension can support public GitHub and enterpise GitHub. Due to the limitation of browser extension, there is only one enterprise GitHub -**IBM**- to be available now. If a new GitHub enterpise need to support, please tell me the name and uri to add.

The extension only needs **```repo```** and **```user:email```** scopse. More details about GitHub scopes, please see **[here](https://developer.github.com/enterprise/2.8/v3/oauth/#scopes)**

  ![mygit](https://cloud.githubusercontent.com/assets/20178358/25611701/a4e7464c-2f5a-11e7-87b9-000c98adc2c1.png)

  * **Sign in public GitHub**
  
    Click **```Signin GitHub```**, it will jump to GitHub authroization page to let you assign special permissions for extenstion to access your repository.
  
  * **Sign in GitHub enterprise**
  
    Before signning in GitHub enterpise, you need to follow the below steps to generate a **[```Personal access tokens```](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)** 
    - Login GitHub and goto **```Settings```** page
    - Click **```Personal access tokens```** to open it
    - Click **```Generate new token```** 
    - Input **```Token description```** as you like, for example: MyGit Extension
    - Select the below **```Scopes```**
      * All scopes of **```repo```**
      * Scope: **```user:email```**
    - Click **```Generate token```** button at the bottom of the page
    
    And now, you have a token for our extension, copy and paste it into token input box, click **```Sign In GitHub Enterprise```** to login.

## License

This project is licensed under the Apache License Version 2.0.

