<p align="center">
<img src="https://cloud.githubusercontent.com/assets/20178358/25707981/bf9d977a-3117-11e7-9ad4-1580be79ff13.png"/>
</p>

## MyGit-Extension

> A Chrome/Firefox extension for GitHub

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Introduction

**MyGit-Extension** aims to provide extra functions for convenient GitHub user through injecting html/javascript codes into GitHub website. 

The following functions are planned to provide:
 - **Export Issues As CSV**
 
   <p align="center">
   <img src="https://cloud.githubusercontent.com/assets/20178358/25611688/9a133744-2f5a-11e7-93de-7ac651b8d9d6.png"/>
   </p>
   
   Injects an **```Export```** button next to **```Milestones```** in issue page. You can launch the **```Export```** wizard dialog by it and customize the the below settings to generate CSV format file:
   - Enable/disable exporting issue fields
   - Adjust issue fields order
   - Customize CSV delimiter
   - Enable/disable expanding issue labels
   
 - **Save Issue Filter**
   
   <p align="center">
   <img src="https://cloud.githubusercontent.com/assets/20178358/25797286/183d4d18-340f-11e7-908a-f0c5af3d5dc8.png"/>
   </p>
   
   Injects a **Save** button in issue filter input box. You can
   - Save filter with a customized name
   - Overwrite an existing filter
   - Get them in **Filters** dropdown list
   - Remove them from the **Filters** dropdown list
   
 - **Favorite Rpository**
 
   <p align="center">
   <img src="https://cloud.githubusercontent.com/assets/20178358/25611698/9fce49ee-2f5a-11e7-8b86-c7c76893a8e7.png"/>
   </p>
   
   Injects a **Favorite Repos** in GitHub top banner. You can save the current repository as favorite one or quickly jump to a favorite repository by it.
   
 - **More Colors For Label Creation**
 
   Injects a rich color list for picking when you create/edit a label.
   
## Installation

  * Install from Chrome/Firefox store
  
    - For **Chrome**: &lt;TBD&gt;
    - For **Firefox**: &lt;TBD&gt;
    
  * Install from [release](https://github.com/eschao/MyGit-Extension/releases)
  
    - Download the latest relase from release page
    - For **Chrome**: Open chrome extension page by clicking **```Settings -> Extensions```**, drag the downloaded crx file into this page, Chrome will ask you and click **```Yes```** to install.
 
## Usage

**MyGit** extension supports public GitHub and GitHub Enterprise. Due to the limitation of browser extension, there is only one GitHub enterprise -**IBM**- to be available now. If you need to support a new one, please tell me its name and uri to add.

The extension only needs **```repo```** and **```user:email```** scopse. More details about GitHub scopes, please see **[here](https://developer.github.com/enterprise/2.8/v3/oauth/#scopes)**

  <p align="center">
  <img src="https://cloud.githubusercontent.com/assets/20178358/25709862/1e39e8e2-311d-11e7-92bd-af22931d6f22.png"/>
  </p>

  * **Sign In Public GitHub**
  
    Click **```Sign In GitHub```**, it will open GitHub authroization page into a new browser tab and ask you grant neccessary scopes for extenstion to access your repository.
  
  * **Sign In GitHub Enterprise**
  
    Before signning in GitHub enterpise, you need to follow the below steps to generate a **[```Personal access tokens```](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)** 
    - Login GitHub and goto **```Settings```** page
    - Click **```Personal access tokens```** to open it
    - Click **```Generate new token```** 
    - Input **```Token description```** as you like, for example: MyGit Extension
    - Select the below **```Scopes```**
      * All scopes of **```repo```**
      * Scope: **```user:email```**
    - Click **```Generate token```** button at the bottom of the page
    
    And now, you have an access token for MyGit extension, copy and paste it into token input box, click **```Sign In GitHub Enterprise```** to login.

## License

This project is licensed under the Apache License Version 2.0.

