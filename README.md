# Introduction

The Volcano, made by Storz & Bickel in Tuttlingen, Germany, is a well-known high-quality vaporizer. The Volcano can be controlled using the Bluetooth Web API. 

This project showcases how to use cutting-edge technology to control the Volcano via the Web Bluetooth API.

# Code Ownership

Please note, this project has been developed with utmost care to respect and not infringe upon any rights of Storz & Bickel.

All code in this Repository was written from scratch by me. I used a different programming language and different technologies. 
Any asset used in this project is open source and free to use under their respective licenses. This project does not contain any proprietary or copyrighted material.

If there are any concerns or issues, please contact me before taking any legal action.

# Motivation

The Motivation behind implementing a Volcano WebApp:

- Use cutting edge technology to build a Volcano App.
- Interested in reverse engineering my Volcano with Web Bluetooth API.
- Showcase how a reactive application is the better choice for bidirectional Bluetooth communication.

# Device Support
Currently, this only supports the Volcano as this is the only device I own.   
Venty and Crafty also uses Web Bluetooth API.

# Test my App

Access & Test my WebApp from this [Link](https://firsttris.github.io/reactive-volcano-app/)

# Technology Stack

This project is built upon a solid foundation of cutting-edge technologies to deliver a high-performance:

- **[SolidJS](https://www.solidjs.com/)**: A declarative JavaScript library for building user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)**: A strongly typed superset of JavaScript that adds static types.
- **[Styled-Components](https://styled-components.com/)**: Visual primitives for the component age.
- **[Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)**: An interface that provides the ability to connect and interact with Bluetooth Low Energy peripherals.
- **[p-queue](https://github.com/sindresorhus/p-queue)**: A promise queue with concurrency control, used to optimize Bluetooth communication.

# User Interface Overview

The user interface is responsive and designed to work well on both desktop and mobile devices.

## Click on the Bluetooth icon to initiate Bluetooth discovery.    
![Bluetooth Discovery](/docs/ui-connect2.png)


## Select your device to establish a connection.    
![Device Selection](/docs/ui-connect-2.png)


## Effortlessly control your Volcano.    
![User Interface](/docs/ui.png)

# Features
The application offers a variety of features including:

## Device Features

- Temperature control
- Heat regulation
- Pump control
- Brightness adjustment
- Auto-shutdown time
- Vibration control
- Standby light
- Device runtime
- Reading serial number

## App Features

- Dark mode
- Responsive UI
- Localization for German and English
- PWA (Progressive Web App)

## Adding the PWA to Your Home Screen

Progressive Web Apps can be installed on your device like native apps. Here's how you can add our PWA to your home screen:

### On Android:
1. Open the PWA in your browser (Chrome, Firefox, etc.).
2. Tap on the browser's menu (usually three dots in the top right corner).
3. Tap on "Add to Home screen".

### On iOS:
1. Open the PWA in Safari.
2. Tap the Share button (the box with an arrow pointing upwards).
3. Scroll down and tap "Add to Home Screen".

After these steps, the PWA will appear as an icon on your home screen, and you can use it just like a native app.

## Non-implemented Features
Some features were not implemented:

### Workflows: 

Workflows is not a device feature, its a feature of the WebApp. The WebApp manages the device using JavaScript's `setTimeout()` function to schedule tasks.

My reasons for not implementing Workflows:
- Assumption that Workflows are not commonly used.
- An Application should only do one thing and be good at it.
- JavaScript's single-threaded nature and event loop do not guarantee precise timing.

### Analytics

- Didnt want to mess with the Bootloader.

# Prerequisites for Linux

In Linux there is no official support for Web Bluetooth API in Chrome.  
However you can still enable Web Bluetooth API in Chrome on Linux, follow these steps:

1. Open Chrome and navigate to `chrome://flags/#enable-web-bluetooth`.
2. Enable the flag as shown in the image below.

![Enabling Web Bluetooth API in Chrome](/docs/web-bluetooth-api.png)

# Development and Build

To develop and build this project, follow these steps:

1. Clone the repository: `git clone https://github.com/reactive-volcano-app.git`
2. Navigate into the project directory: `cd reactive-volcano-app`
3. Install the dependencies: `npm install`
5. Start the development server: `npm run dev`
6. To build the project, use: `npm run build`

## Steps to remote debug the App on your Android Device

Follow these steps to develop and test the application on an Android device:

1. **Enable USB Debugging**: Go to your Android device's Developer Settings and enable USB Debugging.

2. **Connect Your Device**: Connect your Android device to your development machine using a USB cable. When prompted, select the "Data Transfer / Android Auto" option.

3. **Enable Bluetooth Web API for HTTP**: By default, the Bluetooth Web API only works for HTTPS. To enable it for HTTP, go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure` in your Chrome browser.

4. **Enter Your Local IP Address**: In the field provided, enter the IP address of your local development machine. Activate the option, then save your changes and reload Chrome.
   ![unsafely-treat-insecure-origin-as-secure](docs/chrome-insecure-origins.png)

5. **Open Your Local Server URL**: In your Android device's Chrome browser, open the URL of your local development server (e.g., `http://192.168.178.134:5174/`). Replace the example IP address with your own.

6. **Enable Remote Debugging**: On your development machine, go to `chrome://inspect/#devices` to connect via remote debugging to Chrome on your Android device.
   ![inspect](docs/inspect.png)

7. **Debug the Application**: After completing the previous steps, a new Chrome DevTools console will open on your development machine. You can use this console to debug the application on your Android device.

# Connection Issues and Pitfalls

- It's important to remember that the volcano can maintain a Bluetooth connection with only one device at a time. To connect it to a different device, you must first disconnect the existing connection.

# Issues

Want to start contributing to this project? 

Please visit our [issues page](https://github.com/firsttris/reactive-volcano-app/issues) for the latest issues and feature requests.

# License

This work is currently licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/).