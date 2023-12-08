

Everything is Open Source if you can reverse engineer it!

# Introduction

The Volcano, made by Storz & Bickel in Tuttlingen, Germany, is a well-known high-quality vaporizer. The Volcano can be controlled using the Bluetooth Web API. 

This project showcases how to use cutting-edge WebApp Technology to control the Volcano via the Web Bluetooth API.

# Motivation

- Use cutting edge technology to build a Volcano App.
- Interested in reverse engineering Web Bluetooth API with the Volcano. 
- Show how a reactive application is the better choice for Bluetooth communication.
- Showcase a clean intuitive Frontend API written in TypeScript.

# Device Support
Currently, we only support the Volcano device as this is the only device I own. But the same is possible to Venty and Crafty as the use the same API.

# Features
The application offers a variety of features including:

- Temperature control
- Heat regulation
- Pump control
- Brightness adjustment
- Auto-shutdown time
- Dark mode
- Vibration control
- Standby light
- Device runtime
- Reading serial number

## Non-implemented Features
Some features were not implemented:

- Workflows: Its an App feature, rather than a device feature. The WebApp controls the device using `setTimeout()`.
- Analytics: Didnt see any benefit in reverse engineering this part yet.

# Get Started

You can test & use the WebApp directly using this Link and connect your Volcano

https://firsttris.github.io/reactive-volcano-app/

# Technology Stack

This project utilizes a number of cutting-edge technologies to deliver a high-performance, user-friendly application:

- **[SolidJS](https://www.solidjs.com/)**: A declarative JavaScript library for building user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)**: A strongly typed superset of JavaScript that adds static types.
- **[Styled-Components](https://styled-components.com/)**: Visual primitives for the component age.
- **[Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)**: An interface that provides the ability to connect and interact with Bluetooth Low Energy peripherals.

# Prerequisites

To enable the Web Bluetooth API in Chrome on Linux, follow these steps:

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

# Issues

Want to start contributing to this project? 

Please visit our [issues page](https://github.com/firsttris/reactive-volcano-app/issues) for the latest issues and feature requests.

# User Interface Overview

todo