#!/usr/bin/python

import os
import sys
import time
import json
import shutil
import getopt

RED = '\033[91m'
BOLD = '\033[1m'
ENDC = '\033[0m'
CYAN = '\033[96m'
YELLOW = '\033[93m'

class BuildExtension:
    'extension builder'
    def __init__(self):
        self.browser = "chrome"
        self.output_dir= ""

    def parseArgs(self, argv):
        try:
            opts, args = getopt.getopt(argv, "hb:o:", ["browser=", "output="])
        except getopt.GetoptError:
            self.usage()
            return False

        for opt, arg in opts:
            if opt == "-h":
                self.usage()
                sys.exit()
            elif opt in ("-b", "--browser"):
                self.browser = arg.lower()
            elif opt in ("-o", "--output"):
                self.output_dir = arg
            else:
                self.usage()
                sys.exit()

        if self.browser != "chrome" and self.browser != "firefox":
            print "Can't support browser: " + RED + BOLD + self.browser + \
                    ENDC + ENDC
            self.usage()
            sys.exit(1)

        if self.output_dir == None:
            self.output_dir = ""
        else:
            self.output_dir = self.output_dir.strip()
            if len(self.output_dir) > 0 and self.output_dir[-1] != '/':
                self.output_dir += '/'

        return True;

    def __genCss(self, css):
        f = open(css, "r")
        data = f.read()
        f.close()

        if self.browser == "chrome":
            data = data.replace("moz-extension", "chrome-extension")
        elif self.browser == "firefox":
            data = data.replace("chrome-extension", "moz-extension")
        else:
            print "Can't support browser: " + RED + BOLD + self.browser + \
                    ENDC + ENDC
            sys.exit(1)

        f = open(css, "w")
        f.write(data)
        f.close()

    def __genManifest(self, manifest):
        f = open(manifest, "r")
        json_data = json.load(f)
        f.close()

        if self.browser == "firefox":
            json_data["applications"] = {"gecko": {"id": "esc.chao@gmail.com"}}
            f = open(manifest, "w")
            f.write(json.dumps(json_data, indent=2))
            f.close()

        return json_data['version']

    def build(self):
        root_path = os.path.realpath(__file__).replace("build/build.py", "")
        dest_dir = self.output_dir
        if dest_dir == "":
            dest_dir = root_path
        dest_dir += "build-" + time.strftime("%Y%m%d%H%M%S") + "/"

        # Copy files
        indicator = "\033[92m\033[1m=>\033[00m\033[00m"
        print indicator + " Copying files to " + CYAN + BOLD + dest_dir + \
                ENDC + ENDC + " ..."
        shutil.copytree(root_path + "extensions/", dest_dir)

        # Replace 'moz-extension' with 'chrome-extension' or vice vers
        print indicator + " Generating CSS files for " + CYAN + BOLD + \
                self.browser + ENDC + ENDC + " ..."
        css_dir = dest_dir + "css/"
        css_files = os.listdir(css_dir)
        for css in css_files:
            self.__genCss(css_dir + css)

        # Generate manifest.json
        print indicator + " Generating manifest.json for " + CYAN + BOLD + \
                self.browser + ENDC + ENDC + " ..."
        manifest_path = dest_dir + "manifest.json"
        version = self.__genManifest(manifest_path)

        # Pack extension to zip
        print indicator + " Packing extension for " + CYAN + BOLD + \
                self.browser + ENDC + ENDC + " ..."
        ext_file = self.output_dir
        if ext_file == "":
            ext_file = root_path
        ext_file += "mygit-" + self.browser + "-v" + version
        shutil.make_archive(ext_file, "zip", dest_dir)

        # Delete tempoary folder
        print indicator + " Cleaning up ..."
        shutil.rmtree(dest_dir)
        return True;

    def usage(self):
        print "Usage: build.py -b <browser type> -o <output directory>"
        print "    -b   browser type, could be: chrome or firefox"
        print "    -o   directory for generated extension"

if __name__ == "__main__":
    build = BuildExtension()
    if build.parseArgs(sys.argv[1:]):
        build.build()
