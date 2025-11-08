/*
 STORZ & BICKEL Web App v3.4.0 (https://app.storz-bickel.com)
STORZ & BICKEL ? 2020-2025
Unauthorized copying of this file via any medium is prohibited.
Written by STORZ & BICKEL GmbH
*/
const bluetoothToggle = document.getElementById("bluetooth");
const indicatorToggle = document.getElementById("indicator");
const border = document.getElementById("border");
const craftySchriftzug = document.getElementById("craftySchriftzug");
const craftyPlusSchriftzug = document.getElementById("craftyPlusSchriftzug");
const disconnectBtn = document.getElementById("disconnectBtn");
const findCrafty = document.getElementById("findCrafty");
const logoCrafty = document.getElementById("img-cy1");
const logoCraftyPlus = document.getElementById("img-cp1");
let characteristicHeaterOff;
let characteristicWriteTemp;
let characteristicHeaterOn;
let prjStatusReg = 0;
let prjStatusReg2 = 0;
let systemStatusReg = 0;
let akkuStatusReg = 0;
let akkuStatusReg2 = 0;
let akkuStatusCharacteristic = 0;
let akkuStatusCharacteristic2 = 0;
let systemStatusCharacteristic = 0;
let factoryResetCharacteristic = 0;
const MASK_PRJSTAT2_ENABLE_AUTOBLESHUTDOWN = 1 << 12;
const MASK_PRJSTAT2_SIGNALGEBER_FIND_DEVICE_ENABLE = 1 << 3;
const MASK_PRJSTAT2_SET_TEMP_REACHED = 1 << 2;
const MASK_PRJSTAT2_DISABLE_CHARGELED = 1 << 1;
const MASK_PRJSTAT2_DISABLE_VIBRATION = 1 << 0;
const MASK_PRJSTAT_CRAFTY_ACTIVE = 1 << 4;
const MASK_PRJSTAT_BOOST_MODE_ENABLED = 1 << 5;
const MASK_PRJSTAT_SUPERBOOST_MODE_ENABLED = 1 << 6;
let characteristicWriteBoostTemp;
let handleProjectRegister;
let useHoursCharacteristic;
let useMinutesCharacteristic;
let useHoursValue;
let firmwareVersion;
let ledBrightness;
let firmwareBLEVersion;
let statusRegister2;
let characteristicIsCraftyOn = false;
let characteristicledBrightness;
let characteristicautoOffCountdown;
let characteristicautoOffCurrentValue;
let characteristicSicherheitscode;
let characteristicPowerChanged;
let charactersiticCurrTemperatureChanged;
let currentAutoOffValue = -1;
let currentThenValue = -1;
let deviceHasErrors = false;
let oldCraftyFirmware = false;
let primaryServiceCraftyUuid1;
let primaryServiceCraftyUuid2;
let primaryServiceCraftyUuid3;
let bleServer;
function eventsCrafty(state) {
  if (state == true) {
    changeActualTemperatureColor("orange");
    bluetoothToggle.addEventListener("click", bluetoothToggleHandler);
    indicatorToggle.addEventListener("click", indicatorToggleHandler);
    tempMinus.classList.add("crafty");
    findCrafty.addEventListener("click", findMyCrafty);
  } else {
    bluetoothToggle.removeEventListener("click", bluetoothToggleHandler);
    indicatorToggle.removeEventListener("click", indicatorToggleHandler);
    findCrafty.removeEventListener("click", findMyCrafty);
    document.getElementById("logoOnBtn").classList.remove("d-none");
    document.getElementById("automaticShutOff").classList.remove("d-none");
    document.getElementById("shutOffLabel").classList.remove("d-none");
    tempMinus.classList.remove("crafty");
    shutoff.classList.remove("d-none");
    timerObject.classList.add("d-none");
    craftySchriftzug.classList.add("d-none");
    craftyPlusSchriftzug.classList.add("d-none");
    logoCrafty.classList.add("d-none");
    logoCraftyPlus.classList.add("d-none");
  }
}
function startFactoryResetFuncCrafty() {
  if (whichDeviceConnected() == devices.Crafty)
    if (oldCraftyFirmware == false) {
      currentThenValue = 98;
      setBleProcessPending(true);
      var bufferCode = convertToUInt16BLE(1e3);
      characteristicSicherheitscode
        .writeValue(bufferCode)
        .then((service) => {
          currentThenValue = 99;
          let buffer = convertToUInt8BLE(0);
          return factoryResetCharacteristic.writeValue(buffer);
        })
        .then((service) => {
          return characteristicWriteTemp.readValue();
        })
        .then((value) => {
          let targetTemp = convertBLEtoUint16(value) / 10;
          targetTemp = Math.round(targetTemp);
          if (targetTemp > 210)
            targetTemp = convertFromFahrenheitToCelsius(targetTemp);
          SOLLTEMP = targetTemp;
          sollTempLabel.innerText = targetTemp.toString() + "\u00b0C";
          return characteristicWriteBoostTemp.readValue();
        })
        .then((value) => {
          let boostTemp = convertBLEtoUint16(value) / 10;
          boostTemp = Math.round(boostTemp);
          boostTempLabel.innerText = boostTemp.toString() + "\u00b0C";
          BOOSTTEMP = boostTemp;
          return characteristicledBrightness.readValue();
        })
        .then((value) => {
          brightness.value = ledBrightness;
          ledBrightness = convertBLEtoUint16(value);
          if (oldCraftyFirmware == false)
            return characteristicautoOffCountdown.readValue();
        })
        .then((value) => {
          console.log("hi");
          if (oldCraftyFirmware == false) {
            shutoff.value = convertBLEtoUint16(value);
            shutOffLabel.innerText = convertBLEtoUint16(value) + "s";
          }
          return sleep(1e3);
        })
        .then((_) => {
          return statusRegister2.readValue();
        })
        .then((value) => {
          prjStatusReg2 = convertBLEtoUint16(value);
          craftyEvalPrjStatusReg2();
          setBleProcessPending(false);
        })
        .catch((error) => {
          setBleProcessPending(false);
          showError(error);
        });
    }
}
function startAnalysisCRAFTYFunc() {
  if (whichDeviceConnected() == devices.Crafty)
    if (oldCraftyFirmware == false) {
      if (!isBleProcessPendingWithoutAlert_Repeat()) {
        setBleProcessPending(true);
        akkuStatusCharacteristic
          .readValue()
          .then((value) => {
            akkuStatusReg = convertBLEtoUint16(value);
            return akkuStatusCharacteristic2.readValue();
          })
          .then((value) => {
            akkuStatusReg2 = convertBLEtoUint16(value);
            return systemStatusCharacteristic.readValue();
          })
          .then((value) => {
            systemStatusReg = convertBLEtoUint16(value);
            return characteristicledBrightness.readValue();
          })
          .then((value) => {
            setBleProcessPending(false);
            let brightnessLED = convertBLEtoUint16(value);
            if (
              akkuStatusReg & 1536 ||
              systemStatusReg & 512 ||
              prjStatusReg & 8200
            ) {
              let str =
                "Please contact STORZ & BICKEL with the following information: \n\n" +
                "SN   :   " +
                getSerialNumber() +
                "\n" +
                "date : 0x" +
                numHex(Math.floor(Date.now() / 1e3), 8) +
                "\n" +
                "val_1: 0x" +
                numHex(prjStatusReg, 4) +
                "\n" +
                "val_2: 0x" +
                numHex(prjStatusReg2, 4) +
                "\n" +
                "val_3: 0x" +
                numHex(akkuStatusReg, 4) +
                "\n" +
                "val_4: 0x" +
                numHex(akkuStatusReg2, 4) +
                "\n" +
                "val_5: 0x" +
                numHex(systemStatusReg, 4);
              alert(str);
            } else {
              var str = "";
              if (akkuStatusReg & 16640)
                str = str + "- Please let the device cool down.\n\n";
              else if (akkuStatusReg & 3)
                str = str + "- Please charge the device.\n\n";
              else if (akkuStatusReg2 & 32768)
                str = str + "- Please use a different charger or cable.\n\n";
              if (prjStatusReg2 & 1)
                str =
                  str +
                  "- Vibration disabled. Activate function if required.\n";
              if (prjStatusReg2 & 2)
                str =
                  str +
                  "- LED signalization disabled. Activate function if required.\n";
              if (prjStatusReg2 & 4096)
                str =
                  str +
                  "- Automatic shutdown disabled: Bluetooth is active at all time causing faster battery drain.\n";
              if (prjStatusReg & 32768)
                str =
                  str +
                  "- Please perform factory reset by pressing the power button for 10s.\n";
              if (brightnessLED < 10)
                str =
                  str +
                  "- LED brightness set to low value. Change brightness if required.\n";
              if (str.length > 1) alert(str);
              else alert("Device analysis successful and without any issues.");
            }
          })
          .catch((error) => {
            setBleProcessPending(false);
            showError(error);
          });
      }
    } else alert("This device does not support this functionality.");
}
function disconnectCrafty() {
  if (whichDeviceConnected() == devices.Crafty) {
    eventsCrafty(false);
    handleProjectRegister.removeEventListener(
      "characteristicvaluechanged",
      handleProjectRegisterValChanged
    );
    let elemente = document.getElementsByClassName("crafty");
    var i = 0;
    for (; i < elemente.length; i++) elemente[i].classList.add("d-none");
  }
}
function craftyConnect() {
  eventsCrafty(true);
  setMaximumAutomaticShutoff(300);
  bluetoothDevice.gatt
    .connect()
    .then((server) => {
      $("#waitModal").modal("show");
      currentThenValue = 2;
      bleServer = server;
      return server.getPrimaryService(serviceUuidCrafty1);
    })
    .then((service) => {
      currentThenValue = 3;
      primaryServiceCraftyUuid1 = service;
      return primaryServiceCraftyUuid1.getCharacteristic(
        "00000021-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 4;
      characteristicWriteTemp = characteristic;
      return characteristicWriteTemp.readValue();
    })
    .then((value) => {
      currentThenValue = 5;
      let targetTemp = convertBLEtoUint16(value) / 10;
      targetTemp = Math.round(targetTemp);
      if (targetTemp > 210)
        targetTemp = convertFromFahrenheitToCelsius(targetTemp);
      SOLLTEMP = targetTemp;
      sollTempLabel.innerText = targetTemp.toString() + "\u00b0C";
      var elemente = document.getElementsByClassName("crafty");
      var i = 0;
      for (; i < elemente.length; i++) elemente[i].classList.remove("d-none");
      logoCrafty.classList.add("d-none");
      logoCraftyPlus.classList.add("d-none");
      craftySchriftzug.classList.add("d-none");
      craftyPlusSchriftzug.classList.add("d-none");
      aside.classList.add("d-none");
    })
    .then((server) => {
      currentThenValue = 6;
      return bleServer.getPrimaryService(serviceUuidCrafty2);
    })
    .then((service) => {
      primaryServiceCraftyUuid2 = service;
      currentThenValue = 10;
      return primaryServiceCraftyUuid2.getCharacteristic(
        "00000052-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 11;
      return characteristic.readValue();
    })
    .then((value) => {
      currentThenValue = 11;
      let decoder = new TextDecoder("utf-8");
      setSerialNumber(decoder.decode(value).substring(0, 8));
      currentThenValue = 12;
      return primaryServiceCraftyUuid1.getCharacteristic(
        "00000011-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 13;
      charactersiticCurrTemperatureChanged = characteristic;
      return charactersiticCurrTemperatureChanged
        .startNotifications()
        .then((_) => {
          charactersiticCurrTemperatureChanged.addEventListener(
            "characteristicvaluechanged",
            handleCurrTemperatureChanged
          );
        });
    })
    .then((_) => {
      currentThenValue = 131;
      return charactersiticCurrTemperatureChanged.readValue();
    })
    .then((value) => {
      updateCurrTemperatureMobile(Math.round(convertBLEtoUint16(value) / 10));
      currentThenValue = 14;
      return primaryServiceCraftyUuid1.getCharacteristic(
        "00000031-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 15;
      characteristicWriteBoostTemp = characteristic;
      return characteristicWriteBoostTemp.readValue();
    })
    .then((value) => {
      currentThenValue = 16;
      let boostTemp = convertBLEtoUint16(value) / 10;
      boostTemp = Math.round(boostTemp);
      boostTempLabel.innerText = boostTemp.toString() + "\u00b0C";
      BOOSTTEMP = boostTemp;
    })
    .then((service) => {
      currentThenValue = 17;
      return primaryServiceCraftyUuid2.getCharacteristic(
        "00000032-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 18;
      let decoder = new TextDecoder("utf-16");
      firmwareVersion = characteristic;
      return firmwareVersion.readValue();
    })
    .then((value) => {
      currentThenValue = 19;
      let decoder = new TextDecoder("utf-8");
      let firmwareVersion = decoder.decode(value);
      firmwareLabel.innerText = firmwareVersion;
      let minorFirmwareVersion = parseInt(firmwareVersion.slice(-2));
      let majorFirmwareVersion = parseInt(firmwareVersion.substring(1, 3));
      if (minorFirmwareVersion < 51 && majorFirmwareVersion <= 2) {
        alert("Settings Tab is not available with your firmware version.");
        oldCraftyFirmware = true;
        shutOffLabel.classList.add("d-none");
        shutoff.classList.add("d-none");
        document.getElementById("bluetoothLabel").classList.add("d-none");
        document.getElementById("bluetooth").classList.add("d-none");
        document.getElementById("firmwareBLEItem").classList.add("d-none");
        document.getElementById("logoOnBtn").classList.add("d-none");
        document.getElementById("automaticShutOff").classList.add("d-none");
        document.getElementById("BLEAnalysisItem").classList.add("d-none");
        logoCrafty.classList.remove("d-none");
        logoCraftyPlus.classList.add("d-none");
        craftySchriftzug.classList.remove("d-none");
        craftyPlusSchriftzug.classList.add("d-none");
        document.getElementById("factoryReset").classList.add("d-none");
        document.getElementById("BLEFindMyItem").classList.add("d-none");
      } else {
        shutOffLabel.classList.remove("d-none");
        shutoff.classList.remove("d-none");
        document.getElementById("bluetoothLabel").classList.remove("d-none");
        document.getElementById("bluetooth").classList.remove("d-none");
        document.getElementById("firmwareBLEItem").classList.remove("d-none");
        document.getElementById("logoOnBtn").classList.remove("d-none");
        document.getElementById("automaticShutOff").classList.remove("d-none");
        document.getElementById("BLEAnalysisItem").classList.remove("d-none");
        oldCraftyFirmware = false;
        if (majorFirmwareVersion >= 3) {
          logoCrafty.classList.add("d-none");
          logoCraftyPlus.classList.remove("d-none");
          craftySchriftzug.classList.add("d-none");
          craftyPlusSchriftzug.classList.remove("d-none");
          document.getElementById("factoryReset").classList.remove("d-none");
          document.getElementById("BLEFindMyItem").classList.remove("d-none");
        } else {
          logoCrafty.classList.remove("d-none");
          logoCraftyPlus.classList.add("d-none");
          craftySchriftzug.classList.remove("d-none");
          craftyPlusSchriftzug.classList.add("d-none");
          document.getElementById("factoryReset").classList.add("d-none");
          document.getElementById("BLEFindMyItem").classList.add("d-none");
        }
      }
    })
    .then((server) => {
      currentThenValue = 20;
      return bleServer.getPrimaryService(serviceUuidCrafty3);
    })
    .then((service) => {
      currentThenValue = 21;
      primaryServiceCraftyUuid3 = service;
      return primaryServiceCraftyUuid3.getCharacteristic(
        "000001c3-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 22;
      statusRegister2 = characteristic;
      return statusRegister2.startNotifications().then((_) => {
        statusRegister2.addEventListener(
          "characteristicvaluechanged",
          handlePrjstatusRegister2
        );
      });
    })
    .then((_) => {
      return statusRegister2.readValue();
    })
    .then((value) => {
      currentThenValue = 23;
      prjStatusReg2 = convertBLEtoUint16(value);
      craftyEvalPrjStatusReg2();
    })
    .then((service) => {
      currentThenValue = 230;
      return primaryServiceCraftyUuid3.getCharacteristic(
        "00000023-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 231;
      useHoursCharacteristic = characteristic;
      return useHoursCharacteristic.readValue();
    })
    .then((value) => {
      currentThenValue = 232;
      useHoursValue = convertBLEtoUint16(value);
    })
    .then((service) => {
      currentThenValue = 233;
      if (oldCraftyFirmware == false)
        return primaryServiceCraftyUuid3.getCharacteristic(
          "000001e3-4c45-4b43-4942-265a524f5453"
        );
    })
    .then((characteristic) => {
      currentThenValue = 234;
      if (oldCraftyFirmware == false) {
        useMinutesCharacteristic = characteristic;
        return useMinutesCharacteristic.readValue();
      }
    })
    .then((value) => {
      currentThenValue = 235;
      if (oldCraftyFirmware == false) {
        let useMinutes = convertBLEtoUint16(value);
        setUsedTimeOfDevice(useHoursValue, useMinutes);
      } else setUsedTimeOfDevice(useHoursValue, 0);
    })
    .then((service) => {
      currentThenValue = 24;
      if (oldCraftyFirmware == false)
        return primaryServiceCraftyUuid2.getCharacteristic(
          "00000072-4c45-4b43-4942-265a524f5453"
        );
    })
    .then((characteristic) => {
      currentThenValue = 25;
      if (oldCraftyFirmware == false) {
        firmwareBLEVersion = characteristic;
        return firmwareBLEVersion.readValue();
      }
    })
    .then((value) => {
      currentThenValue = 26;
      if (oldCraftyFirmware == false) {
        firmwareBLEVersion =
          "V" +
          value.getUint8(0).toString() +
          "." +
          value.getUint8(1).toString() +
          "." +
          value.getUint8(2).toString();
        firmwareBLEBootloaderLabel.innerText = firmwareBLEVersion;
      }
    })
    .then((service) => {
      currentThenValue = 27;
      return primaryServiceCraftyUuid1.getCharacteristic(
        "00000051-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 28;
      characteristicledBrightness = characteristic;
      return characteristicledBrightness.readValue();
    })
    .then((value) => {
      currentThenValue = 29;
      ledBrightness = convertBLEtoUint16(value);
      brightness.value = ledBrightness;
    })
    .then((service) => {
      currentThenValue = 30;
      if (oldCraftyFirmware == false)
        return primaryServiceCraftyUuid1.getCharacteristic(
          "00000061-4c45-4b43-4942-265a524f5453"
        );
    })
    .then((characteristic) => {
      currentThenValue = 31;
      if (oldCraftyFirmware == false) {
        characteristicautoOffCountdown = characteristic;
        return characteristicautoOffCountdown.readValue();
      }
    })
    .then((value) => {
      currentThenValue = 32;
      if (oldCraftyFirmware == false) {
        shutoff.value = convertBLEtoUint16(value);
        shutOffLabel.innerText = convertBLEtoUint16(value) + "s";
      }
    })
    .then((service) => {
      currentThenValue = 33;
      if (oldCraftyFirmware == false)
        return primaryServiceCraftyUuid1.getCharacteristic(
          "00000071-4c45-4b43-4942-265a524f5453"
        );
    })
    .then((characteristic) => {
      currentThenValue = 34;
      if (oldCraftyFirmware == false) {
        characteristicautoOffCurrentValue = characteristic;
        return characteristicautoOffCurrentValue
          .startNotifications()
          .then((_) => {
            characteristicautoOffCurrentValue.addEventListener(
              "characteristicvaluechanged",
              handleCurrentAutoValue
            );
          });
      }
    })
    .then((_) => {
      return characteristicautoOffCurrentValue.readValue();
    })
    .then((value) => {
      currentThenValue = 35;
      if (oldCraftyFirmware == false)
        currentAutoOffValue = convertBLEtoUint16(value);
    })
    .then((service) => {
      currentThenValue = 36;
      return primaryServiceCraftyUuid1.getCharacteristic(
        "00000041-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 37;
      characteristicPowerChanged = characteristic;
      return characteristicPowerChanged.startNotifications().then((_) => {
        characteristicPowerChanged.addEventListener(
          "characteristicvaluechanged",
          handlePowerChanged
        );
      });
    })
    .then((_) => {
      return characteristicPowerChanged.readValue();
    })
    .then((value) => {
      currentThenValue = 38;
      setBatteryValue(convertBLEtoUint16(value));
    })
    .then((service) => {
      currentThenValue = 39;
      if (oldCraftyFirmware == false)
        return primaryServiceCraftyUuid1.getCharacteristic(
          "00000081-4c45-4b43-4942-265a524f5453"
        );
    })
    .then((characteristic) => {
      currentThenValue = 40;
      if (oldCraftyFirmware == false) characteristicHeaterOn = characteristic;
    })
    .then((service) => {
      currentThenValue = 41;
      if (oldCraftyFirmware == false)
        return primaryServiceCraftyUuid1.getCharacteristic(
          "00000091-4c45-4b43-4942-265a524f5453"
        );
    })
    .then((characteristic) => {
      currentThenValue = 42;
      if (oldCraftyFirmware == false) characteristicHeaterOff = characteristic;
    })
    .then((service) => {
      currentThenValue = 43;
      return primaryServiceCraftyUuid3.getCharacteristic(
        "00000093-4c45-4b43-4942-265a524f5453"
      );
    })
    .then((characteristic) => {
      currentThenValue = 44;
      handleProjectRegister = characteristic;
      if (oldCraftyFirmware == false)
        return handleProjectRegister.startNotifications().then((_) => {
          handleProjectRegister.addEventListener(
            "characteristicvaluechanged",
            handleProjectRegisterValChanged
          );
        });
    })
    .then((_) => {
      return handleProjectRegister.readValue();
    })
    .then((value) => {
      currentThenValue = 45;
      setBoostModeMobile(false);
      setSuperBoostModeMobile(false);
      prjStatusReg = convertBLEtoUint16(value);
      if (prjStatusReg & MASK_PRJSTAT_SUPERBOOST_MODE_ENABLED)
        setSuperBoostModeMobile(true);
      else if (prjStatusReg & MASK_PRJSTAT_BOOST_MODE_ENABLED)
        setBoostModeMobile(true);
      if (prjStatusReg & 8200) deviceHasErrors = true;
      setShowSollTempMobile(SOLLTEMP);
    })
    .then((service) => {
      currentThenValue = 46;
      if (oldCraftyFirmware == false)
        return primaryServiceCraftyUuid3.getCharacteristic(
          "000001b3-4c45-4b43-4942-265a524f5453"
        );
    })
    .then((characteristic) => {
      currentThenValue = 47;
      if (oldCraftyFirmware == false)
        characteristicSicherheitscode = characteristic;
    })
    .then((service) => {
      if (oldCraftyFirmware == false)
        return primaryServiceCraftyUuid3.getCharacteristic(
          "00000083-4c45-4b43-4942-265a524f5453"
        );
    })
    .then((characteristic) => {
      currentThenValue = 48;
      if (oldCraftyFirmware == false) {
        systemStatusCharacteristic = characteristic;
        return systemStatusCharacteristic.readValue();
      }
    })
    .then((value) => {
      if (oldCraftyFirmware == false) {
        systemStatusReg = convertBLEtoUint16(value);
        if (systemStatusReg & 640) deviceHasErrors = true;
        return primaryServiceCraftyUuid3.getCharacteristic(
          "00000063-4c45-4b43-4942-265a524f5453"
        );
      }
    })
    .then((characteristic) => {
      currentThenValue = 49;
      if (oldCraftyFirmware == false) {
        akkuStatusCharacteristic = characteristic;
        return akkuStatusCharacteristic.readValue();
      }
    })
    .then((value) => {
      if (oldCraftyFirmware == false) {
        akkuStatusReg = convertBLEtoUint16(value);
        if (akkuStatusReg & 512) deviceHasErrors = true;
        return primaryServiceCraftyUuid3.getCharacteristic(
          "00000073-4c45-4b43-4942-265a524f5453"
        );
      }
    })
    .then((characteristic) => {
      currentThenValue = 50;
      if (oldCraftyFirmware == false) {
        akkuStatusCharacteristic2 = characteristic;
        return primaryServiceCraftyUuid3.getCharacteristic(
          "000001d3-4c45-4b43-4942-265a524f5453"
        );
      }
    })
    .then((characteristic) => {
      currentThenValue = 51;
      if (oldCraftyFirmware == false)
        factoryResetCharacteristic = characteristic;
      $("#waitModal").modal("hide");
      if (deviceHasErrors == true) startAnalysisCRAFTYFunc();
    })
    .catch((error) => {
      eventsCrafty(false);
      if (error.toString().includes("User cancelled"))
        $("#waitModal").modal("hide");
      else {
        $("#waitModal").modal("hide");
        alert(
          "Bluetooth connection error CRAFTY: please reload and retry.\n" +
            error.toString() +
            "\n" +
            error.stack +
            "\n" +
            currentThenValue
        );
      }
    });
}
function craftyEvalPrjStatusReg2() {
  if (prjStatusReg2 & MASK_PRJSTAT2_SET_TEMP_REACHED) {
    changeActualTemperatureColor("green");
    if (!oldCraftyFirmware) timerObject.classList.remove("d-none");
  } else changeActualTemperatureColor("orange");
  if ((prjStatusReg2 & MASK_PRJSTAT2_ENABLE_AUTOBLESHUTDOWN) == 0)
    bluetoothToggle.checked = false;
  else bluetoothToggle.checked = true;
  if ((prjStatusReg2 & MASK_PRJSTAT2_DISABLE_CHARGELED) == 0)
    indicatorToggle.checked = true;
  else indicatorToggle.checked = false;
  if ((prjStatusReg2 & MASK_PRJSTAT2_DISABLE_VIBRATION) == 0)
    vibrationToggle.checked = true;
  else vibrationToggle.checked = false;
}
function writeAutoOffCountdownCrafty() {
  if (
    !isBleProcessPendingWithoutAlert_Repeat() &&
    whichDeviceConnected() == devices.Crafty
  ) {
    shutOffLabel.innerText = shutoff.value + "s";
    let buffer = convertToUInt16BLE(shutoff.value);
    var bufferCode = convertToUInt16BLE(815);
    setBleProcessPending(true);
    characteristicSicherheitscode
      .writeValue(bufferCode)
      .then((service) => {
        currentThenValue = 151;
        setBleProcessPending(false);
        characteristicautoOffCountdown
          .writeValue(buffer)
          .then((service) => {
            currentThenValue = 152;
            setBleProcessPending(false);
          })
          .catch((error) => {
            setBleProcessPending(false);
            showError(error);
          });
      })
      .catch((error) => {
        setBleProcessPending(false);
        showError(error);
      });
  }
}
function findMyCrafty() {
  if (prjStatusReg2 & MASK_PRJSTAT2_SIGNALGEBER_FIND_DEVICE_ENABLE)
    alert("Find My CRAFTY mode is active. It deactivates in 30 seconds.");
  else
    projectRegister2ChangeBitC(
      MASK_PRJSTAT2_SIGNALGEBER_FIND_DEVICE_ENABLE,
      true
    );
}
function onHeatClickCrafty() {
  if (oldCraftyFirmware == false && whichDeviceConnected() == devices.Crafty)
    if (!isBleProcessPendingWithoutAlert_Repeat()) {
      var buffer = new ArrayBuffer(2);
      var dataView = new DataView(buffer);
      dataView.setInt16(0, 0);
      setBleProcessPending(true);
      if (characteristicIsCraftyOn == false) {
        characteristicIsCraftyOn = true;
        showCraftyActive(characteristicIsCraftyOn);
        characteristicHeaterOn
          .writeValue(buffer)
          .then((service) => {
            currentThenValue = 153;
            setBleProcessPending(false);
          })
          .catch((error) => {
            showCraftyActive(false);
            showError(error);
            setBleProcessPending(false);
          });
      } else {
        characteristicIsCraftyOn = false;
        showCraftyActive(characteristicIsCraftyOn);
        characteristicHeaterOff
          .writeValue(buffer)
          .then((service) => {
            currentThenValue = 154;
            setBleProcessPending(false);
          })
          .catch((error) => {
            setBleProcessPending(false);
            showError(error);
          });
      }
    }
}
function projectRegister2ChangeBitC(bitmask, val) {
  if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0], arguments[1])) {
    var statusRegisterValModified = prjStatusReg2 & ~bitmask;
    if (val == true)
      statusRegisterValModified = statusRegisterValModified | bitmask;
    else;
    let buffer = convertToUInt16BLE(statusRegisterValModified);
    setBleProcessPending(false);
    statusRegister2
      .writeValue(buffer)
      .then((service) => {
        return statusRegister2.readValue();
      })
      .then((value) => {
        setBleProcessPending(false);
        prjStatusReg2 = convertBLEtoUint16(value);
      })
      .catch((error) => {
        setBleProcessPending(false);
        showError(error);
      });
  }
}
function writeSollTemperatureCrafty(val) {
  if (whichDeviceConnected() == devices.Crafty) {
    let buffer = convertToUInt16BLE(val * 10);
    if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
      setBleProcessPending(true);
      characteristicWriteTemp
        .writeValue(buffer)
        .then((service) => {
          currentThenValue = 148;
          let buffer = convertToUInt16BLE(BOOSTTEMP * 10);
          setTemperatureWillChangeViaBLE_RESET();
          characteristicWriteBoostTemp
            .writeValue(buffer)
            .then((service) => {
              setBleProcessPending(false);
              currentThenValue = 149;
            })
            .catch((error) => {
              setBleProcessPending(false);
              showError(error);
            });
        })
        .catch((error) => {
          setBleProcessPending(false);
          showError(error);
          setTemperatureWillChangeViaBLE_RESET();
        });
    }
  }
}
function writeBoostTemperatureCrafty(val) {
  if (whichDeviceConnected() == devices.Crafty) {
    let buffer = convertToUInt16BLE(val * 10);
    setBleProcessPending(true);
    characteristicWriteBoostTemp
      .writeValue(buffer)
      .then((service) => {
        currentThenValue = 150;
        setBleProcessPending(false);
        boostWillChangeViaBLE_RESET();
      })
      .catch((error) => {
        showError(error);
        setBleProcessPending(false);
        boostWillChangeViaBLE_RESET();
      });
  }
}
function writeBrightnessCrafty() {
  if (whichDeviceConnected() == devices.Crafty)
    if (!isBleProcessPendingWithoutAlert_Repeat()) {
      let buffer = convertToUInt16BLE(brightness.value);
      setBleProcessPending(true);
      characteristicledBrightness
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          showError(error);
          setBleProcessPending(false);
        });
    }
}
function showCraftyActive(ena) {
  if (ena) {
    border.style.borderTopColor = "#ff6600";
    craftySchriftzug.src = "img/cy-logo-power-1.svg";
    craftyPlusSchriftzug.src = "img/cp-logo-power-1.svg";
    if (prjStatusReg2 & MASK_PRJSTAT2_SET_TEMP_REACHED)
      changeActualTemperatureColor("green");
    else changeActualTemperatureColor("orange");
  } else {
    border.style.borderTopColor = " #373737";
    craftySchriftzug.src = "img/cy-logo-power-0.svg";
    craftyPlusSchriftzug.src = "img/cp-logo-power-0.svg";
    timerObject.classList.add("d-none");
    changeActualTemperatureColor("grey");
  }
}
function handlePrjstatusRegister2(event) {
  let currentVal = convertBLEtoUint16(event.target.value);
  prjStatusReg2 = currentVal;
  if (prjStatusReg2 & MASK_PRJSTAT2_SET_TEMP_REACHED) {
    changeActualTemperatureColor("green");
    if (!oldCraftyFirmware) timerObject.classList.remove("d-none");
  } else changeActualTemperatureColor("orange");
}
function handleProjectRegisterValChanged(event) {
  let currentVal = convertBLEtoUint16(event.target.value);
  prjStatusReg = currentVal;
  if (currentVal & MASK_PRJSTAT_CRAFTY_ACTIVE) showCraftyActive(true);
  else showCraftyActive(false);
  setBoostModeMobile(false);
  setSuperBoostModeMobile(false);
  if (currentVal & MASK_PRJSTAT_SUPERBOOST_MODE_ENABLED)
    setSuperBoostModeMobile(true);
  else if (currentVal & MASK_PRJSTAT_BOOST_MODE_ENABLED)
    setBoostModeMobile(true);
  setShowSollTempMobile(SOLLTEMP);
}
function handleCurrTemperatureChanged(event) {
  updateCurrTemperatureMobile(
    Math.round(convertBLEtoUint16(event.target.value) / 10)
  );
}
function handlePowerChanged(event) {
  setBatteryValue(convertBLEtoUint16(event.target.value));
}
function handleCurrentAutoValue(event) {
  if (oldCraftyFirmware == false) {
    let tempVal = convertBLEtoUint16(event.target.value);
    if (currentAutoOffValue != tempVal) {
      currentAutoOffValue = tempVal;
      let val = Math.round((currentAutoOffValue / shutoff.value) * 100);
      document.getElementById("timerInSec").innerText =
        currentAutoOffValue + " sec";
      document.getElementById("timer").style.width = val + "%";
    }
  }
}
function bluetoothToggleHandler() {
  if (!isBleProcessPendingWithoutAlert_Repeat())
    if (bluetoothToggle.checked)
      projectRegister2ChangeBitC(MASK_PRJSTAT2_ENABLE_AUTOBLESHUTDOWN, true);
    else
      projectRegister2ChangeBitC(MASK_PRJSTAT2_ENABLE_AUTOBLESHUTDOWN, false);
}
function vibrationToggleHandlerCrafty() {
  if (whichDeviceConnected() == devices.Crafty)
    if (!isBleProcessPendingWithoutAlert_Repeat())
      if (!vibrationToggle.checked)
        projectRegister2ChangeBitC(MASK_PRJSTAT2_DISABLE_VIBRATION, true);
      else projectRegister2ChangeBitC(MASK_PRJSTAT2_DISABLE_VIBRATION, false);
}
function indicatorToggleHandler() {
  if (!isBleProcessPendingWithoutAlert_Repeat())
    if (!indicatorToggle.checked)
      projectRegister2ChangeBitC(MASK_PRJSTAT2_DISABLE_CHARGELED, true);
    else projectRegister2ChangeBitC(MASK_PRJSTAT2_DISABLE_CHARGELED, false);
}
