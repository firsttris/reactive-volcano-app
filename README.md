

Please note, this project has been developed with utmost care to respect and not infringe upon any rights of Storz & Bickel.   

# Introduction

The Volcano, made by Storz & Bickel in Tuttlingen, Germany, is a well-known high-quality vaporizer. The Volcano can be controlled using the Bluetooth Web API. 

This project showcases how to use cutting-edge technology to control the Volcano via the Web Bluetooth API.

# Motivation

- The current WebApp of Storz & Bickel does not match the quality of their vaporizers.
- Use cutting edge technology to build a Volcano App.
- Interested in reverse engineering the Volcano with Web Bluetooth API.
- Show how a reactive application is the better choice for Bluetooth communication.
- Showcase how to write clean intuitive Frontend API in TypeScript.

# Device Support
Currently, this only supports the Volcano as this is the only device I own.   
Venty and Crafty use the same Web Bluetooth API.

# Test my App

You can directly access and use the WebApp from this [link](https://firsttris.github.io/reactive-volcano-app/), allowing you to connect your Volcano with ease.

# Technology Stack

This project is built upon a solid foundation of cutting-edge technologies to deliver a high-performance:

- **[SolidJS](https://www.solidjs.com/)**: A declarative JavaScript library for building user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)**: A strongly typed superset of JavaScript that adds static types.
- **[Styled-Components](https://styled-components.com/)**: Visual primitives for the component age.
- **[Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)**: An interface that provides the ability to connect and interact with Bluetooth Low Energy peripherals.

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

## Step to develop & Test on Android

1. Enable USB-Debugging in Developer Settings in Adnroid.
2. When connecting the USB-Cabel select "Data Transfer / Android Auto".
3. Go to chrome://flags/#unsafely-treat-insecure-origin-as-secure to enable Bluetooth Web API for HTTP.
4. Open the URL of your local development server e.g. http://192.168.178.134:5174/ (replace with your ip)
3. Go to chrome://inspect/#devices on your Desktop to Remote Debug Chrome on your Android Device.

# Issues

Want to start contributing to this project? 

Please visit our [issues page](https://github.com/firsttris/reactive-volcano-app/issues) for the latest issues and feature requests.

# User Interface Overview

The user interface is responsive and designed to work well on both desktop and mobile devices.

## Click on the Bluetooth icon to initiate Bluetooth discovery.    
![Bluetooth Discovery](/docs/ui-connect.png)


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

## Non-implemented Features
Some features were not implemented:

### Workflows: 

Workflows are a feature of the application, not inherent to the device. The WebApp manages the device using JavaScript's `setTimeout()` function to schedule tasks.

Reasons for not implementing Workflows:
- Assumption that Workflows are not commonly used.
- An Application should do one thing and be good at it.
- JavaScript's single-threaded nature and event loop do not guarantee precise timing.

### Analytics

- Didnt want to mess with the Bootloader.