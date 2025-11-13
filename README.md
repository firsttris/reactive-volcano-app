# Reactive Vaporizer App (fork)

# Introduction

This fork is made for personal use.

# Code Ownership

Please note, this project has been developed with utmost care to respect and not infringe upon any rights of Storz & Bickel.

All code in this Repository was written from scratch by https://github.com/firsttris and edit by me.

If there are any concerns or issues, please contact me before taking any legal action.

# Prerequisites for Linux

In Linux there is no official support for Web Bluetooth API in Chrome.  
However you can still enable Web Bluetooth API in Chrome on Linux, follow these steps:

1. Open Chrome and navigate to `chrome://flags/#enable-web-bluetooth`.
2. Enable the flag as shown in the image below.

![Enabling Web Bluetooth API in Chrome](/docs/web-bluetooth-api.png)

# Development and Build

To develop and build this project, follow these steps:

1. Clone the repository: `git clone https://github.com/firsttris/reactive-volcano-app.git`
2. Navigate into the project directory: `cd reactive-volcano-app`
3. Install the dependencies: `npm install`
4. Start the development server: `npm run dev`
5. To build the project, use: `npm run build:root`
6. Copy the contents from the dist/ directory to the webserver location.
7. Copy the file bg-volcano.png to the webserver location.

# Connection Issues and Pitfalls

- It's important to remember that the volcano can maintain a Bluetooth connection with only one device at a time. To connect it to a different device, you must first disconnect the existing connection.

# License

This work is currently licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/).
