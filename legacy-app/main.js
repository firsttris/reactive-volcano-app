/*
 STORZ & BICKEL Web App v3.4.0 (https://app.storz-bickel.com)
STORZ & BICKEL ? 2020-2025
Unauthorized copying of this file via any medium is prohibited.
Written by STORZ & BICKEL GmbH
*/
const connectButton = document.getElementById("connectBtn");
const tempPlus = document.getElementById("tempPlus");
const tempMinus = document.getElementById("tempMinus");
const boostPlus = document.getElementById("boostPlus");
const boostMinus = document.getElementById("boostMinus");
const superboostPlus = document.getElementById("superboostPlus");
const superboostMinus = document.getElementById("superboostMinus");
const sollTempLabel = document.getElementById("sollTemp");
const boostTempLabel = document.getElementById("boostTemp");
const superboostTempLabel = document.getElementById("superboostTemp");
const firmwareLabel = document.getElementById("firmware");
const istTempLabel = document.getElementById("istTemp");
const istTempBreak = document.getElementById("istTempBreak");
const serialNumberLabel = document.getElementById("serialNumber");
const logoOnBtn = document.getElementById("logoOnBtn");
const shutoff = document.getElementById("shutoff");
const shutOffLabel = document.getElementById("shutOffLabel");
const timerObject = document.getElementById("timerObject");
const tempUnitChangeBtn = document.getElementById("tempUnitChangeBtn");
const factoryReset = document.getElementById("resetSettings");
const vibrationToggle = document.getElementById("vibration");
const brightness = document.getElementById("brightness");
const useHoursLabel = document.getElementById("useHours");
const battery = document.getElementById("battery");
const firmwareBLEBootloaderText = document.getElementById("firmwareBLEText");
const firmwareBLEBootloader = document.getElementById("firmwareBLE");
const firmwareBLEBootloaderLabel = document.getElementById("firmwareBLE");
const startAnalysisMobile = document.getElementById("startAnalysisMobile");
const boostSuperBoostTimeoutToggle =
  document.getElementById("boostModeTimeout");
let timerMinusButtonMouseDown = null;
let timerPlusButtonMouseDown = null;
let timerMinusBoostButtonMouseDown = null;
let timerPlusBoostButtonMouseDown = null;
let timerPlusSuperBoostButtonMouseDown = null;
let timerMinusSuperBoostButtonMouseDown = null;
var SOLLTEMP = 0;
let BOOSTTEMP = 0;
let SUPERBOOSTTEMP = 0;
const CURRENTTEMP_default = 888;
let CURRENTTEMP = CURRENTTEMP_default;
let isCelsius = true;
let boostModeActive = false;
let superBoostModeActive = false;
let myTimerSetBoostSuperBoostHandlerMobile = null;
let myTimerBLEpendingHandler = null;
let myTimerBoostHandler = null;
let myTimerSuperBoostHandler = null;
let myTimerSetTempHandler = null;
let connectBrowser = false;
let genericAccessSupported = true;
const startUpdate = document.getElementById("startFirmwareUpdate");
const firmwareUpdateLiItem = document.getElementById("firmwareUpdateLiItem");
const firmwareUpdateStartBut = document.getElementById("firmwareUpdateStart");
var bluetoothDevice;
let deviceIsConnected = false;
const devices = {
  Venty: Symbol("Venty"),
  Hybrid: Symbol("Hybrid"),
  Crafty: Symbol("Crafty"),
  Veazy: Symbol("Veazy"),
};
connectButton.addEventListener("click", onButtonClick);
disconnectBtn.addEventListener("click", disconnect);
loadGif.className = "d-none";
if (userAgent_iOS()) {
  tempPlus.addEventListener("touchstart", onPlusButtonMouseDown);
  tempPlus.addEventListener("touchend", onPlusButtonMouseUp);
  tempMinus.addEventListener("touchstart", onMinusButtonMouseDown);
  tempMinus.addEventListener("touchend", onMinusButtonMouseUp);
  boostPlus.addEventListener("touchstart", onPlusButtonBoostMouseDown);
  boostPlus.addEventListener("touchend", onPlusButtonBoostMouseUp);
  boostMinus.addEventListener("touchstart", onMinusButtonBoostMouseDown);
  boostMinus.addEventListener("touchend", onMinusButtonBoostMouseUp);
  superboostPlus.addEventListener(
    "touchstart",
    onPlusButtonSuperBoostMouseDown
  );
  superboostPlus.addEventListener("touchend", onPlusButtonSuperBoostMouseUp);
  superboostMinus.addEventListener(
    "touchstart",
    onMinusButtonSuperBoostMouseDown
  );
  superboostMinus.addEventListener("touchend", onMinusButtonSuperBoostMouseUp);
  let infoCrafty = document.getElementById("informationCrafty");
  let infoVenty = document.getElementById("informationVenty");
  let infoVolcano = document.getElementById("informationVolcano");
  if (
    window.navigator.userAgent.includes("WebBLE/1") ||
    window.navigator.userAgent.includes("ConnectBrowser/15")
  ) {
    infoCrafty.removeAttribute("target");
    infoVenty.removeAttribute("target");
    infoVolcano.removeAttribute("target");
  }
} else {
  tempPlus.addEventListener("mousedown", onPlusButtonMouseDown);
  tempPlus.addEventListener("mouseup", onPlusButtonMouseUp);
  tempMinus.addEventListener("mousedown", onMinusButtonMouseDown);
  tempMinus.addEventListener("mouseup", onMinusButtonMouseUp);
  boostPlus.addEventListener("mousedown", onPlusButtonBoostMouseDown);
  boostPlus.addEventListener("mouseup", onPlusButtonBoostMouseUp);
  boostMinus.addEventListener("mousedown", onMinusButtonBoostMouseDown);
  boostMinus.addEventListener("mouseup", onMinusButtonBoostMouseUp);
  superboostPlus.addEventListener("mousedown", onPlusButtonSuperBoostMouseDown);
  superboostPlus.addEventListener("mouseup", onPlusButtonSuperBoostMouseUp);
  superboostMinus.addEventListener(
    "mousedown",
    onMinusButtonSuperBoostMouseDown
  );
  superboostMinus.addEventListener("mouseup", onMinusButtonSuperBoostMouseUp);
}
logoOnBtn.addEventListener("click", onHeatClick);
shutoff.addEventListener("change", writeAutoOffCountdown);
tempUnitChangeBtn.addEventListener("click", clickOnTempLabel);
factoryReset.addEventListener("click", startFactoryResetFunc);
vibrationToggle.addEventListener("click", vibrationToggleHandler);
brightness.addEventListener("change", writeBrightness);
startUpdate.addEventListener("click", startUpdateFunc);
firmwareUpdateStartBut.addEventListener("click", startUpdateFunc);
startAnalysisMobile.addEventListener("click", startAnalysisMobileFunc);
boostSuperBoostTimeoutToggle.addEventListener(
  "click",
  boostSuperBoostModeTimeoutToggleHandler
);
const serviceUuidCrafty1 = "00000001-4c45-4b43-4942-265a524f5453";
const serviceUuidCrafty2 = "00000002-4c45-4b43-4942-265a524f5453";
const serviceUuidCrafty3 = "00000003-4c45-4b43-4942-265a524f5453";
const serviceUuidVolcano1 = "00000001-1989-0108-1234-123456789abc";
const serviceUuidVolcano2 = "01000002-1989-0108-1234-123456789abc";
const serviceUuidVolcano3 = "10100000-5354-4f52-5a26-4249434b454c";
const serviceUuidVolcano4 = "10110000-5354-4f52-5a26-4249434b454c";
const serviceUuidVolcano5 = "10130000-5354-4f52-5a26-4249434b454c";
const serviceUuidQvap = "00000000-5354-4f52-5a26-4249434b454c";
const serviceUuidQvap1 = "00001800-0000-1000-8000-00805f9b34fb";
const timeInMilliSeconds = 2e3;
let bleInProcess = false;
function isCelsiusActive() {
  return isCelsius;
}
function setSerialNumber(str) {
  serialNumberLabel.innerText = str;
}
function setMaximumAutomaticShutoff(val) {
  shutoff.max = val;
}
function getSerialNumber() {
  return serialNumberLabel.innerText;
}
function setCelsiusActive(state) {
  if (state == true) isCelsius = true;
  else isCelsius = false;
}
function startAnalysisMobileFunc() {
  startAnalysisCRAFTYFunc();
  startAnalysisQvapFunc();
}
function updateTemperatureLabelsMobile() {
  if (
    whichDeviceConnected() == devices.Crafty ||
    isDeviceConnectedVeazyVenty()
  ) {
    setShowBoostTempMobile(BOOSTTEMP);
    setShowSuperBoostTempMobile(SUPERBOOSTTEMP);
    setShowSollTempMobile(SOLLTEMP);
    updateCurrTemperatureMobile(CURRENTTEMP);
  }
}
function writeBrightness() {
  writeBrightnessCrafty();
  writeBrightnessQvap();
}
function startFactoryResetFunc() {
  startFactoryResetFuncCrafty();
  startFactoryResetFuncQVap();
}
function setUsedTimeOfDevice(useHoursValue, useMinutes) {
  if (useMinutes != 0)
    useHoursLabel.innerText = useHoursValue + "h " + useMinutes + "min";
  else useHoursLabel.innerText = useHoursValue + "h";
}
function clickOnTempLabel() {
  if (
    whichDeviceConnected() == devices.Crafty ||
    isDeviceConnectedVeazyVenty()
  ) {
    if (whichDeviceConnected() == devices.Crafty)
      if (isCelsius == true) isCelsius = false;
      else isCelsius = true;
    updateTemperatureLabelsMobile();
    changeTemperatureUnitQVap();
  } else clickOnTempLabelClickVolcano();
}
function sleep(time) {
  return new Promise((resolve) => {
    return setTimeout(resolve, time);
  });
}
function limitValueToRange(val, minVal, maxVal) {
  if (val < minVal) return minVal;
  else if (val > maxVal) return maxVal;
  return val;
}
function easingTimeout(delay, fn) {
  var id = 0;
  var invoker = function () {
    fn();
    if (delay > 100) delay = Math.floor(delay / 1.2);
    else delay = delay;
    if (delay) id = setTimeout(invoker, delay);
    else id = null;
  };
  id = setTimeout(invoker, delay);
  return {
    clear: function () {
      if (id) {
        clearTimeout(id);
        id = null;
      }
    },
  };
}
function writeAutoOffCountdown() {
  writeAutoOffCountdownCrafty();
  writeAutoOffCountdownQVap();
}
function restoreBrightnessSliderSettings() {
  brightness.max = 100;
  brightness.min = 0;
  brightness.step = 10;
}
function onHeatClick() {
  onHeatClickCrafty();
  onHeatClickQvap();
}
function boostSuperBoostModeTimeoutToggleHandler() {
  boostSuperboostTimeoutFuncQvap();
}
function vibrationToggleHandler() {
  vibrationToggleHandlerCrafty();
  vibrationToggleHandlerQvap();
}
function startUpdateFunc() {
  startUpdateFuncHybrid();
  startUpdateFuncQvap();
}
function onPlusButtonMouseDown() {
  window.addEventListener("mouseup", onPlusButtonMouseUp);
  onPlusButtonMouseDownVolcano();
  if (
    whichDeviceConnected() == devices.Crafty ||
    isDeviceConnectedVeazyVenty()
  ) {
    if (myTimerSetTempHandler !== 0) window.clearTimeout(myTimerSetTempHandler);
    myTimerSetTempHandler = window.setTimeout(myTimerSet, timeInMilliSeconds);
    if (isCelsius == true) setShowSollTempMobile(SOLLTEMP + 1);
    else setShowSollTempMobile(SOLLTEMP + 1 / 1.8);
    setTemperatureWillChange = true;
    timerPlusButtonMouseDown = easingTimeout(1e3, function () {
      if (myTimerSetTempHandler !== 0)
        window.clearTimeout(myTimerSetTempHandler);
      myTimerSetTempHandler = window.setTimeout(myTimerSet, timeInMilliSeconds);
      if (isCelsius == true) setShowSollTempMobile(SOLLTEMP + 1);
      else setShowSollTempMobile(SOLLTEMP + 1 / 1.8);
    });
  }
}
function onPlusButtonMouseUp() {
  onPlusButtonMouseUpVolcano();
  if (whichDeviceConnected() == devices.Crafty || isDeviceConnectedVeazyVenty())
    if (timerPlusButtonMouseDown != null) timerPlusButtonMouseDown.clear();
  window.removeEventListener("mouseup", onPlusButtonMouseUp);
}
function onMinusButtonMouseDown() {
  window.addEventListener("mouseup", onMinusButtonMouseUp);
  onMinusButtonMouseDownVolcano();
  if (
    whichDeviceConnected() == devices.Crafty ||
    isDeviceConnectedVeazyVenty()
  ) {
    if (myTimerSetTempHandler !== 0) window.clearTimeout(myTimerSetTempHandler);
    myTimerSetTempHandler = window.setTimeout(myTimerSet, timeInMilliSeconds);
    if (isCelsius == true) setShowSollTempMobile(SOLLTEMP - 1);
    else setShowSollTempMobile(SOLLTEMP - 1 / 1.8);
    setTemperatureWillChange = true;
    timerMinusButtonMouseDown = easingTimeout(1e3, function () {
      if (myTimerSetTempHandler !== 0)
        window.clearTimeout(myTimerSetTempHandler);
      myTimerSetTempHandler = window.setTimeout(myTimerSet, timeInMilliSeconds);
      if (isCelsius == true) setShowSollTempMobile(SOLLTEMP - 1);
      else setShowSollTempMobile(SOLLTEMP - 1 / 1.8);
    });
  }
}
function onMinusButtonMouseUp() {
  onMinusButtonMouseUpVolcano();
  if (whichDeviceConnected() == devices.Crafty || isDeviceConnectedVeazyVenty())
    if (timerMinusButtonMouseDown != null) timerMinusButtonMouseDown.clear();
  window.removeEventListener("mouseup", onMinusButtonMouseUp);
}
let boostWillChange = false;
let superboostWillChange = false;
function boostWillChangeViaBLE() {
  return boostWillChange;
}
function superboostWillChangeViaBLE() {
  return superboostWillChange;
}
function boostWillChangeViaBLE_RESET() {
  boostWillChange = false;
}
function superboostWillChangeViaBLE_RESET() {
  superboostWillChange = false;
}
let setTemperatureWillChange = false;
function setTemperatureWillChangeViaBLE() {
  return setTemperatureWillChange;
}
function setTemperatureWillChangeViaBLE_RESET() {
  setTemperatureWillChange = false;
}
function onMinusButtonBoostMouseDown() {
  window.addEventListener("mouseup", onMinusButtonBoostMouseUp);
  if (myTimerBoostHandler !== 0) window.clearTimeout(myTimerBoostHandler);
  myTimerBoostHandler = window.setTimeout(myTimerBoost, timeInMilliSeconds);
  if (
    whichDeviceConnected() == devices.Crafty ||
    isDeviceConnectedVeazyVenty()
  ) {
    if (myTimerBoostHandler !== 0) window.clearTimeout(myTimerBoostHandler);
    myTimerBoostHandler = window.setTimeout(myTimerBoost, timeInMilliSeconds);
    if (isCelsius == true) setShowBoostTempMobile(BOOSTTEMP - 1);
    else setShowBoostTempMobile(BOOSTTEMP - 1 / 1.8);
    boostWillChange = true;
    timerMinusBoostButtonMouseDown = easingTimeout(1e3, function () {
      if (myTimerBoostHandler !== 0) window.clearTimeout(myTimerBoostHandler);
      myTimerBoostHandler = window.setTimeout(myTimerBoost, timeInMilliSeconds);
      if (isCelsius == true) setShowBoostTempMobile(BOOSTTEMP - 1);
      else setShowBoostTempMobile(BOOSTTEMP - 1 / 1.8);
    });
  }
}
function onMinusButtonSuperBoostMouseDown() {
  window.addEventListener("mouseup", onMinusButtonSuperBoostMouseUp);
  if (myTimerSuperBoostHandler !== 0)
    window.clearTimeout(myTimerSuperBoostHandler);
  myTimerSuperBoostHandler = window.setTimeout(
    myTimerSuperBoost,
    timeInMilliSeconds
  );
  if (isDeviceConnectedVeazyVenty()) {
    if (myTimerSuperBoostHandler !== 0)
      window.clearTimeout(myTimerSuperBoostHandler);
    myTimerSuperBoostHandler = window.setTimeout(
      myTimerSuperBoost,
      timeInMilliSeconds
    );
    if (isCelsius == true) setShowSuperBoostTempMobile(SUPERBOOSTTEMP - 1);
    else setShowSuperBoostTempMobile(SUPERBOOSTTEMP - 1 / 1.8);
    superboostWillChange = true;
    timerMinusSuperBoostButtonMouseDown = easingTimeout(1e3, function () {
      if (myTimerSuperBoostHandler !== 0)
        window.clearTimeout(myTimerSuperBoostHandler);
      myTimerSuperBoostHandler = window.setTimeout(
        myTimerSuperBoost,
        timeInMilliSeconds
      );
      if (isCelsius == true) setShowSuperBoostTempMobile(SUPERBOOSTTEMP - 1);
      else setShowSuperBoostTempMobile(SUPERBOOSTTEMP - 1 / 1.8);
    });
  }
}
function onMinusButtonBoostMouseUp() {
  if (whichDeviceConnected() == devices.Crafty || isDeviceConnectedVeazyVenty())
    if (timerMinusBoostButtonMouseDown != null)
      timerMinusBoostButtonMouseDown.clear();
  window.removeEventListener("mouseup", onMinusButtonBoostMouseUp);
}
function onMinusButtonSuperBoostMouseUp() {
  if (isDeviceConnectedVeazyVenty())
    if (timerMinusSuperBoostButtonMouseDown != null)
      timerMinusSuperBoostButtonMouseDown.clear();
  window.removeEventListener("mouseup", onMinusButtonSuperBoostMouseUp);
}
function onPlusButtonBoostMouseDown() {
  window.addEventListener("mouseup", onPlusButtonBoostMouseUp);
  if (myTimerBoostHandler !== 0) window.clearTimeout(myTimerBoostHandler);
  if (
    whichDeviceConnected() == devices.Crafty ||
    isDeviceConnectedVeazyVenty()
  ) {
    if (myTimerBoostHandler !== 0) window.clearTimeout(myTimerBoostHandler);
    myTimerBoostHandler = window.setTimeout(myTimerBoost, timeInMilliSeconds);
    if (isCelsius == true) setShowBoostTempMobile(BOOSTTEMP + 1);
    else setShowBoostTempMobile(BOOSTTEMP + 1 / 1.8);
    boostWillChange = true;
    timerPlusBoostButtonMouseDown = easingTimeout(1e3, function () {
      if (myTimerBoostHandler !== 0) window.clearTimeout(myTimerBoostHandler);
      myTimerBoostHandler = window.setTimeout(myTimerBoost, timeInMilliSeconds);
      if (isCelsius == true) setShowBoostTempMobile(BOOSTTEMP + 1);
      else setShowBoostTempMobile(BOOSTTEMP + 1 / 1.8);
    });
  }
}
function onPlusButtonSuperBoostMouseDown() {
  window.addEventListener("mouseup", onPlusButtonSuperBoostMouseUp);
  if (myTimerSuperBoostHandler !== 0)
    window.clearTimeout(myTimerSuperBoostHandler);
  if (isDeviceConnectedVeazyVenty()) {
    if (myTimerSuperBoostHandler !== 0)
      window.clearTimeout(myTimerSuperBoostHandler);
    myTimerSuperBoostHandler = window.setTimeout(
      myTimerSuperBoost,
      timeInMilliSeconds
    );
    if (isCelsius == true) setShowSuperBoostTempMobile(SUPERBOOSTTEMP + 1);
    else setShowSuperBoostTempMobile(SUPERBOOSTTEMP + 1 / 1.8);
    superboostWillChange = true;
    timerPlusSuperBoostButtonMouseDown = easingTimeout(1e3, function () {
      if (myTimerSuperBoostHandler !== 0)
        window.clearTimeout(myTimerSuperBoostHandler);
      myTimerSuperBoostHandler = window.setTimeout(
        myTimerSuperBoost,
        timeInMilliSeconds
      );
      if (isCelsius == true) setShowSuperBoostTempMobile(SUPERBOOSTTEMP + 1);
      else setShowSuperBoostTempMobile(SUPERBOOSTTEMP + 1 / 1.8);
    });
  }
}
function onPlusButtonBoostMouseUp() {
  if (whichDeviceConnected() == devices.Crafty || isDeviceConnectedVeazyVenty())
    if (timerPlusBoostButtonMouseDown != null) {
      timerPlusBoostButtonMouseDown.clear();
      window.removeEventListener("mouseup", onPlusButtonBoostMouseUp);
    }
}
function onPlusButtonSuperBoostMouseUp() {
  if (isDeviceConnectedVeazyVenty())
    if (timerPlusSuperBoostButtonMouseDown != null) {
      timerPlusSuperBoostButtonMouseDown.clear();
      window.removeEventListener("mouseup", onPlusButtonSuperBoostMouseUp);
    }
}
function myTimerSet() {
  writeSollTemperatureCrafty(SOLLTEMP);
  writeSollTemperatureHybrid(SOLLTEMP);
  writeSollTemperatureQVap(SOLLTEMP);
  myTimerSetTempHandler = null;
}
function myTimerBoost() {
  writeBoostTemperatureCrafty(BOOSTTEMP);
  writeBoostTemperatureQVap(BOOSTTEMP);
  myTimerBoostHandler = null;
}
function myTimerSuperBoost() {
  writeSuperBoostTemperatureQVap(SUPERBOOSTTEMP);
  myTimerSuperBoostHandler = null;
}
function updateCurrTemperatureMobile(temperature) {
  CURRENTTEMP = temperature;
  if (isCelsius == true)
    istTempLabel.innerText = temperature.toString() + "\u00b0C";
  else if (temperature == CURRENTTEMP_default)
    istTempLabel.innerText = CURRENTTEMP_default.toString() + "\u00b0F";
  else
    istTempLabel.innerText =
      convertToFahrenheitFromCelsius(temperature).toString() + "\u00b0F";
}
function hideCurrTemperature(state) {
  if (state) {
    istTempLabel.style.display = "none";
    istTempBreak.style.display = "none";
  } else {
    istTempLabel.style.display = "inline";
    istTempBreak.style.display = "inline";
  }
}
function setBatteryValue(usePower) {
  battery.style.width = usePower + "%";
}
function getShowBoostTempMobile() {
  return BOOSTTEMP;
}
function setShowBoostTempMobile(boostTemperature) {
  BOOSTTEMP = limitValueToRange(boostTemperature, 1, 99);
  if (isDeviceConnectedVeazyVenty());
  else if (SOLLTEMP + BOOSTTEMP > 210) BOOSTTEMP = 210 - SOLLTEMP;
  if (isCelsius == true)
    boostTempLabel.innerText = Math.round(BOOSTTEMP).toString() + "\u00b0C";
  else {
    var val = convertToFahrenheitFromCelsius(BOOSTTEMP) - 32;
    boostTempLabel.innerText = Math.round(val).toString() + "\u00b0F";
  }
}
function getShowSuperBoostTempMobile() {
  return SUPERBOOSTTEMP;
}
function setShowSuperBoostTempMobile(superboostTemperature) {
  SUPERBOOSTTEMP = limitValueToRange(superboostTemperature, 1, 99);
  if (isDeviceConnectedVeazyVenty());
  if (isCelsius == true)
    superboostTempLabel.innerText =
      Math.round(SUPERBOOSTTEMP).toString() + "\u00b0C";
  else {
    var val = convertToFahrenheitFromCelsius(SUPERBOOSTTEMP) - 32;
    superboostTempLabel.innerText = Math.round(val).toString() + "\u00b0F";
  }
}
function myTimerSetBoostSuperBoostMobile() {
  if (myTimerSetBoostSuperBoostHandlerMobile !== 0)
    window.clearTimeout(myTimerSetBoostSuperBoostHandlerMobile);
  if (window.getComputedStyle(sollTempLabel).visibility === "hidden")
    sollTempLabel.style.visibility = "visible";
  else sollTempLabel.style.visibility = "hidden";
  animateBoostSuperBoostMobile();
}
function animateBoostSuperBoostMobile() {
  if (whichDeviceConnected() == devices.Crafty || isDeviceConnectedVeazyVenty())
    if (superBoostModeActive)
      myTimerSetBoostSuperBoostHandlerMobile = window.setTimeout(
        myTimerSetBoostSuperBoostMobile,
        500
      );
    else if (boostModeActive)
      myTimerSetBoostSuperBoostHandlerMobile = window.setTimeout(
        myTimerSetBoostSuperBoostMobile,
        1e3
      );
    else if (myTimerSetBoostSuperBoostHandlerMobile !== 0) {
      window.clearTimeout(myTimerSetBoostSuperBoostHandlerMobile);
      sollTempLabel.style.visibility = "visible";
    }
}
function getBoostModeMobile() {
  return boostModeActive;
}
function setBoostModeMobile(status) {
  if (status == true) boostModeActive = true;
  else boostModeActive = false;
  animateBoostSuperBoostMobile();
}
function getSuperBoostModeMobile() {
  return superBoostModeActive;
}
function setSuperBoostModeMobile(status) {
  if (status == true) superBoostModeActive = true;
  else superBoostModeActive = false;
  animateBoostSuperBoostMobile();
}
function setShowSollTempMobile(temperature) {
  let superBoostVal = 15;
  SOLLTEMP = limitValueToRange(temperature, 40, 210);
  var tempSOLLTEMP = SOLLTEMP;
  if (isDeviceConnectedVeazyVenty());
  else if (superBoostModeActive)
    tempSOLLTEMP = limitValueToRange(
      SOLLTEMP + BOOSTTEMP + superBoostVal,
      40,
      210
    );
  else if (boostModeActive)
    tempSOLLTEMP = limitValueToRange(SOLLTEMP + BOOSTTEMP, 40, 210);
  if (isCelsius == true)
    sollTempLabel.innerText = Math.round(tempSOLLTEMP).toString() + "\u00b0C";
  else
    sollTempLabel.innerText =
      convertToFahrenheitFromCelsius(tempSOLLTEMP).toString() + "\u00b0F";
  setShowBoostTempMobile(BOOSTTEMP);
}
function myTimerBLEpendingTimeoutFunc() {
  bleInProcess = false;
}
function setBleProcessPending(status) {
  if (status === true)
    myTimerBLEpendingHandler = window.setTimeout(
      myTimerBLEpendingTimeoutFunc,
      2e3
    );
  else if (myTimerBLEpendingHandler !== 0)
    window.clearTimeout(myTimerBLEpendingHandler);
  bleInProcess = status;
}
function isBleProcessPending() {
  if (bleInProcess == true) {
    alert("Bluetooth command is in process.");
    return true;
  } else return false;
}
function isBleProcessPendingWithoutAlert() {
  if (bleInProcess == true) return true;
  else return false;
}
function isBleProcessPendingWithoutAlert_Repeat() {
  if (bleInProcess == true) {
    const callerFunctionName = new Error().stack
      .split("\n")[2]
      .trim()
      .split(" ")[1];
    switch (arguments.length) {
      case 0:
        window.setTimeout(window[callerFunctionName], 100);
        break;
      case 1:
        window.setTimeout(window[callerFunctionName], 100, arguments[0]);
        break;
      case 2:
        window.setTimeout(
          window[callerFunctionName],
          100,
          arguments[0],
          arguments[1]
        );
        break;
      default:
        console.error("To many input arguments: " + arguments.length);
    }
    return true;
  } else return false;
}
function changeActualTemperatureColor(col) {
  var label = istTempLabel;
  if (isDeviceConnectedVeazyVenty()) label = sollTempLabel;
  if (col == "green") {
    label.classList.add("text-success");
    label.classList.remove("color-orange");
    label.classList.remove("color-grey");
    label.classList.remove("color-blue");
  } else if (col == "blue") {
    label.classList.add("color-blue");
    label.classList.remove("color-grey");
    label.classList.remove("color-orange");
    label.classList.remove("text-success");
  } else if (col == "grey" || col == "gray") {
    label.classList.add("color-grey");
    label.classList.remove("color-orange");
    label.classList.remove("color-blue");
    label.classList.remove("text-success");
  } else {
    label.classList.add("color-orange");
    label.classList.remove("color-grey");
    label.classList.remove("color-blue");
    label.classList.remove("text-success");
  }
}
function onButtonClick() {
  timerObject.classList.add("d-none");
  if (navigator.bluetooth) {
    var pieces = navigator.userAgent.match(
      /Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/
    );
    if (pieces != null) {
      pieces = pieces.map((piece) => {
        return parseInt(piece, 10);
      });
      if (pieces.length > 0 && pieces[0] < 79)
        alert("Chrome version outdated: please update your browser.");
    }
    let filters = [];
    let filterNamePrefixCrafty = "STORZ&BICKEL";
    let filterNamePrefixCraftyNew = "Storz&Bickel";
    let filterNamePrefixVolcano = "S&B";
    filters.push({
      namePrefix: filterNamePrefixCrafty,
    });
    filters.push({
      namePrefix: filterNamePrefixCraftyNew,
    });
    filters.push({
      namePrefix: filterNamePrefixVolcano,
    });
    let options = {};
    console.log("window.navigator " + window.navigator.userAgent);
    if (userAgent_iOS()) {
      options.filters = filters;
      options.acceptAllDevices = false;
    } else if (
      window.navigator.userAgent.toLowerCase().indexOf("android") > -1
    ) {
      filters.push({
        services: [serviceUuidCrafty1, serviceUuidCrafty2, serviceUuidCrafty3],
      });
      filters.push({
        services: [
          serviceUuidVolcano1,
          serviceUuidVolcano2,
          serviceUuidVolcano3,
          serviceUuidVolcano4,
          serviceUuidVolcano5,
        ],
      });
      filters.push({
        services: [serviceUuidQvap],
      });
      options.filters = filters;
      options.acceptAllDevices = false;
      options.optionalServices = ["generic_access", serviceUuidQvap1];
    } else {
      filters.push({
        services: [serviceUuidCrafty1, serviceUuidCrafty2, serviceUuidCrafty3],
      });
      filters.push({
        services: [
          serviceUuidVolcano1,
          serviceUuidVolcano2,
          serviceUuidVolcano3,
          serviceUuidVolcano4,
          serviceUuidVolcano5,
        ],
      });
      filters.push({
        services: [serviceUuidQvap],
      });
      options.filters = filters;
      options.acceptAllDevices = false;
      options.optionalServices = ["generic_access", serviceUuidQvap1];
    }
    try {
      navigator.bluetooth
        .requestDevice(options)
        .then((device) => {
          bluetoothDevice = device;
          currentThenValue = 1;
          bluetoothDevice.addEventListener(
            "gattserverdisconnected",
            onDisconnected
          );
          loadGif.classList.remove("d-none");
          if (whichDeviceConnected() == devices.Hybrid) volcanoConnect();
          else if (isDeviceConnectedVeazyVenty()) {
            if (!isConnectBrowser())
              setSerialNumber(bluetoothDevice.name.split(" ")[1]);
            else setSerialNumber(bluetoothDevice.deviceName.split(" ")[1]);
            QvapConnect();
          } else craftyConnect();
          deviceIsConnected = true;
        })
        .catch((error) => {
          deviceIsConnected = false;
          if (error.toString().includes("User cancelled") || error == 2);
          else
            alert(
              "Bluetooth connection error GENERAL: please reload and retry.\n" +
                error.toString() +
                "\n" +
                error.stack +
                "\n" +
                currentThenValue
            );
        });
    } catch (error) {
      showError(error);
    }
  } else {
    if (iOS_BLEnotWorking())
      alert(
        "Web Bluetooth is not supported by Safari. Please use Bluefy or Web BLE browser."
      );
    else
      alert(
        "Web Bluetooth is not supported by this browser. Please use another browser."
      );
    return 0;
  }
}
function iOS_BLEnotWorking() {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}
function userAgent_iOS() {
  if (
    window.navigator.userAgent.includes("iPhone") ||
    window.navigator.userAgent.includes("iPad") ||
    window.navigator.userAgent.includes("WebBLE/1")
  )
    return true;
  else return false;
}
function isConnectBrowser() {
  return connectBrowser;
}
function browserSupportsGenericAccess() {
  return genericAccessSupported;
}
function whichDeviceConnected() {
  if (typeof bluetoothDevice.deviceName != "undefined") connectBrowser = true;
  if (
    (typeof bluetoothDevice.name != "undefined" &&
      bluetoothDevice.name.includes("S&B VOLCANO")) ||
    (typeof bluetoothDevice.deviceName != "undefined" &&
      bluetoothDevice.deviceName.includes("S&B VOLCANO"))
  )
    return devices.Hybrid;
  else if (
    (typeof bluetoothDevice.name != "undefined" &&
      bluetoothDevice.name.includes("S&B VY")) ||
    (typeof bluetoothDevice.deviceName != "undefined" &&
      bluetoothDevice.deviceName.includes("S&B VY"))
  )
    return devices.Venty;
  else if (
    (typeof bluetoothDevice.name != "undefined" &&
      bluetoothDevice.name.includes("S&B VZ")) ||
    (typeof bluetoothDevice.deviceName != "undefined" &&
      bluetoothDevice.deviceName.includes("S&B VZ"))
  )
    return devices.Veazy;
  else return devices.Crafty;
}
function isDeviceConnectedVeazyVenty() {
  if (
    whichDeviceConnected() == devices.Venty ||
    whichDeviceConnected() == devices.Veazy
  )
    return true;
  else return false;
}
function onDisconnected(event) {
  return sleep(1e3).then((val) => {
    deviceIsConnected = false;
    restoreBrightnessSliderSettings();
    location.reload();
  });
}
function disconnect() {
  disconnectCrafty();
  disconnectHybrid();
  disconnectQvap();
  loadGif.classList.add("d-none");
  aside.classList.remove("d-none");
  deviceIsConnected = false;
  bluetoothDevice.gatt.disconnect();
}
function showError(err) {
  console.trace();
  const callerFunctionName = new Error().stack
    .split("\n")[2]
    .trim()
    .split(" ")[1];
  console.log(" caller is " + callerFunctionName);
  alert(
    "\n" +
      "Unexpected error (1): please reload and retry.\n" +
      err.toString() +
      "\n" +
      err.stack +
      "\n" +
      currentThenValue
  );
}
function convertToUInt8BLE(val) {
  var buffer = new ArrayBuffer(1);
  var dataView = new DataView(buffer);
  dataView.setUint8(0, val % 256);
  return buffer;
}
function convertToUInt16BLE(val) {
  var buffer = new ArrayBuffer(2);
  var dataView = new DataView(buffer);
  dataView.setUint8(0, val % 256);
  dataView.setUint8(1, Math.floor(val / 256));
  return buffer;
}
function convertToUInt32BLE(val) {
  var buffer = new ArrayBuffer(4);
  var dataView = new DataView(buffer);
  dataView.setUint8(0, val & 255);
  var tempVal = val >> 8;
  dataView.setUint8(1, tempVal & 255);
  tempVal = tempVal >> 8;
  dataView.setUint8(2, tempVal & 255);
  tempVal = tempVal >> 8;
  dataView.setUint8(3, tempVal & 255);
  return buffer;
}
function convertBLEtoUint16(bleBuf) {
  return bleBuf.getUint8(0) + bleBuf.getUint8(1) * 256;
}
function convertBLEtoUint24(bleBuf) {
  return (
    bleBuf.getUint8(0) +
    bleBuf.getUint8(1) * 256 +
    bleBuf.getUint8(2) * 256 * 256
  );
}
function convertBLEtoUint32(bleBuf) {
  return (
    bleBuf.getUint8(0) +
    bleBuf.getUint8(1) * 256 +
    bleBuf.getUint8(2) * 256 * 256 +
    bleBuf.getUint8(3) * 256 * 256 * 256
  );
}
function convertToFahrenheitFromCelsius(celsius) {
  return Math.round(celsius * 1.8 + 32);
}
function convertFromFahrenheitToCelsius(fahrenheit) {
  let val = (fahrenheit - 32) / 1.8;
  return Math.round(val);
}
function numHex(s, nbDigits) {
  var a = parseInt(s).toString(16);
  if (a.length % 2 > 0) a = "0" + a;
  let diff = nbDigits - a.length;
  var i = 0;
  for (; i < diff; i = i + 1) a = "0" + a;
  return a;
}
function hexToBytes(hex) {
  let bytes = [];
  for (let c = 0; c < hex.length; c = c + 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}
function buf2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((x) => {
      return x.toString(16).padStart(2, "0");
    })
    .join("");
}
function isDeviceIsConnected() {
  return deviceIsConnected;
}
function preventScreenDimming(state) {
  if (typeof bluetooth != "undefined")
    if (typeof bluetooth.setScreenDimEnabled === "function")
      bluetooth.setScreenDimEnabled(state);
}
function generateErrorMsg(errMsg, verbose) {
  let postStr =
    "serialNumber=" +
    getSerialNumber() +
    "&error=" +
    currentThenValue +
    "&textMsg=" +
    errMsg;
  fetch("error", {
    method: "post",
    body: new URLSearchParams(postStr),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (verbose) alert(errMsg + "\n value:" + currentThenValue);
      else alert(errMsg);
    })
    .catch((error) => {
      if (verbose) console.log(errMsg + "\n" + currentThenValue);
      else console.log(errMsg);
    });
}
function checkVersionIsGreater(serverVersion, deviceVersion) {
  if (serverVersion > deviceVersion) return true;
  else return false;
}
