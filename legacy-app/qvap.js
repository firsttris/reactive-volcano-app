/*
 STORZ & BICKEL Web App v3.4.0 (https://app.storz-bickel.com)
STORZ & BICKEL ? 2020-2025
Unauthorized copying of this file via any medium is prohibited.
Written by STORZ & BICKEL GmbH
*/
let primaryServiceQvapUuid;
let characteristicQvap;
let periodicInterval;
let heaterModusPrev = -1;
let firstReadCMD1 = true;
let browserSupportsWriteWithResponse = true;
let applicationFirmwareQvap = 0;
const applicationFirmwareMask_application = 1;
const applicationFirmwareMask_invalidApplication = 16;
const applicationFirmwareMask_invalidBootloader = 32;
let maskSetTemperatureWrite = 1 << 1;
let maskSetBoostWrite = 1 << 2;
let maskSetSuperboostWrite = 1 << 3;
let maskHeaterWrite = 1 << 5;
let maskSettingsWrite = 1 << 7;
const ventySchriftzug = document.getElementById("ventySchriftzug");
const veazySchriftzug = document.getElementById("veazySchriftzug");
const findVenty = document.getElementById("findVenty");
const findVenty2 = document.getElementById("findVenty2");
const findVeazy = document.getElementById("findVeazy");
const findVeazy2 = document.getElementById("findVeazy2");
const chargeOptimizationToggle = document.getElementById("chargeOptimization");
const chargeLimitToggle = document.getElementById("chargeLimit");
const boostVisualizationToggle = document.getElementById("boostVisualization");
const bluetoothToggleVeazyVenty = document.getElementById(
  "bluetoothVeazyVenty"
);
let shouldUpdateBootloader = false;
let updateBootloader = false;
let firmwareFileMajorQvap = -1;
let firmwareFileMinorQvap = -1;
let bootloaderFileMajorQvap = -1;
let bootloaderFileMinorQvap = -1;
let firmwareValueArrayConnectedQvap = [];
let pkaSend = 0;
let errCategory = 0;
const pageSizeQvap = 2048;
const dataSizeFirmwarePerPacket = 128;
let pageIdxQvap = 0;
let dataIdxQvap = 0;
let repeatPageData = 0;
let timeoutBLEresponseQvap;
let binaryContent = 0;
let binaryContentIV = 0;
let binaryNumberOfPages = 0;
let BLEServer;
let nbRetriesValidation = 0;
let findMyDeviceModeActivated = false;
const BIT_SETTINGS_UNIT = 1 << 0;
const BIT_SETTINGS_SETPOINT_REACHED = 1 << 1;
const BIT_SETTINGS_FACTORY_RESET = 1 << 2;
const BIT_SETTINGS_ECOMODE_CHARGE = 1 << 3;
const BIT_SETTINGS_BUTTON_CHANGED_FILLING_CHAMBER = 1 << 4;
const BIT_SETTINGS_ECOMODE_VOLTAGE = 1 << 5;
const BIT_SETTINGS_BOOST_VISUALIZATION = 1 << 6;
const BIT_SETTINGS2_BLE_PERMANENT = 1 << 0;
function debugFirmwareUpdate(str) {}
function getVeazyVentyDeviceName() {
  var devName = "Venty";
  if (whichDeviceConnected() == devices.Veazy) devName = "Veazy";
  return devName;
}
function handleTimeoutBLEResponseMissingQvap() {
  debugFirmwareUpdate(
    "handleTimeoutBLEResponseMissingQvap repeat: " + repeatPageData
  );
  setBleProcessPending(false);
  const numberMaxRepetion = 14;
  if (repeatPageData < numberMaxRepetion) {
    repeatPageData = repeatPageData + 1;
    if (pageIdxQvap < binaryNumberOfPages) writePageDataSequenceQvap();
    else if (repeatPageData < 2) startQvapApplication(true);
    else startQvapApplication(false);
  } else {
    preventScreenDimming(false);
    generateErrorMsg("Firmware update error: please reload and retry.\n");
  }
}
function writePageDataSequenceQvap() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    debugFirmwareUpdate(
      " writePageDataSequenceQvap dataIdxQvap: " +
        dataIdxQvap +
        " page: " +
        pageIdxQvap
    );
    preventScreenDimming(true);
    if (dataIdxQvap >= pageSizeQvap / dataSizeFirmwarePerPacket) {
      debugFirmwareUpdate("page write start request 2");
      var buffer = new ArrayBuffer(4 + 32);
      var dataView = new DataView(buffer);
      var uint8Buf = new Uint8Array(buffer);
      if (updateBootloader) dataView.setUint8(0, 48);
      else dataView.setUint8(0, 1);
      dataView.setUint8(1, 8);
      dataView.setUint8(2, pageIdxQvap);
      dataView.setUint8(3, 0);
      uint8Buf.set(binaryContentIV, 4);
      setBleProcessPending(true);
      timeoutBLEresponseQvap = setTimeout(
        handleTimeoutBLEResponseMissingQvap,
        750
      );
      characteristicQvap
        .writeValue(buffer)
        .then((value) => {
          debugFirmwareUpdate("sent write page");
          setBleProcessPending(false);
        })
        .catch((error) => {
          console.log(error);
          generateErrorMsg("error: sent write page " + error.toString(), true);
          setBleProcessPending(false);
        });
    } else {
      debugFirmwareUpdate("page data write 2");
      let startIdx =
        dataIdxQvap * dataSizeFirmwarePerPacket + pageIdxQvap * pageSizeQvap;
      let remainingDataLength = binaryContent.length - startIdx;
      var dataLen = dataSizeFirmwarePerPacket;
      if (remainingDataLength < dataSizeFirmwarePerPacket)
        dataLen = remainingDataLength;
      var data = new Uint8Array(dataSizeFirmwarePerPacket);
      data.set(binaryContent.slice(startIdx, startIdx + dataLen), 0);
      var newprogress = Math.round((pageIdxQvap * 100) / binaryNumberOfPages);
      $("#progressFirmwareUpdate")
        .width(newprogress + "%")
        .attr("aria-valuenow", newprogress);
      buffer = new ArrayBuffer(dataSizeFirmwarePerPacket + 4);
      dataView = new DataView(buffer);
      uint8Buf = new Uint8Array(buffer);
      if (updateBootloader) dataView.setUint8(0, 48);
      else dataView.setUint8(0, 1);
      dataView.setUint8(1, 1);
      dataView.setUint8(2, pageIdxQvap);
      dataView.setUint8(3, dataIdxQvap);
      uint8Buf.set(data, 4);
      setBleProcessPending(true);
      timeoutBLEresponseQvap = setTimeout(
        handleTimeoutBLEResponseMissingQvap,
        750
      );
      characteristicQvap
        .writeValue(buffer)
        .then((value) => {
          debugFirmwareUpdate("sent writePageDataSequenceQvap");
          setBleProcessPending(false);
        })
        .catch((error) => {
          generateErrorMsg(
            "error: sent writePageDataSequenceQvap " + error.toString(),
            true
          );
          console.log(error);
          setBleProcessPending(false);
        });
    }
  }
}
function QVapSwitchToBootloader() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(6);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 12);
    dataView.setUint8(1, 102);
    dataView.setUint8(2, 51);
    setBleProcessPending(true);
    characteristicQvap
      .writeValue(buffer)
      .then((val) => {
        return sleep(100);
      })
      .then((val) => {
        setBleProcessPending(false);
        disconnect();
      });
  }
}
function QVapSetChunkSize() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(6);
    var dataView = new DataView(buffer);
    if (updateBootloader) dataView.setUint8(0, 48);
    else dataView.setUint8(0, 1);
    dataView.setUint8(1, 5);
    dataView.setUint8(2, dataSizeFirmwarePerPacket);
    setBleProcessPending(true);
    characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
        writePageDataSequenceQvap();
      })
      .catch((error) => {
        console.log("error: sent writeChunkSize " + error);
        setBleProcessPending(false);
      });
  }
}
function startUpdateFuncQvap() {
  debugFirmwareUpdate("startUpdateFuncQvap ");
  if (isDeviceConnectedVeazyVenty())
    if (!isBleProcessPendingWithoutAlert_Repeat()) {
      if (shouldUpdateBootloader) updateBootloader = true;
      clearInterval(periodicInterval);
      $("#firmwareUpdateModal").modal("hide");
      $("#device").modal("hide");
      var pleaseWait = $("#pleaseWaitDialog");
      pleaseWait.modal("show");
      $("#progressFirmwareUpdate").width("0%").attr("aria-valuenow", 0);
      let postStr =
        "device=" +
        getVeazyVentyDeviceName() +
        "&action=firmwareBootloader&serial=" +
        getSerialNumber() +
        "&signKeyID=" +
        keyID_sign;
      if (!shouldUpdateBootloader) {
        let sn = getSerialNumber();
        if (!(applicationFirmwareQvap & applicationFirmwareMask_application))
          sn =
            "VY" +
            document.getElementById("firstdigit").value +
            document.getElementById("seconddigit").value +
            document.getElementById("thirddigit").value +
            document.getElementById("fourthdigit").value +
            document.getElementById("fifthdigit").value +
            document.getElementById("sixthdigit").value;
        postStr =
          "device=" +
          getVeazyVentyDeviceName() +
          "&action=firmwareApplication&serial=" +
          sn +
          "&signKeyID=" +
          keyID_sign;
      }
      return fetch("firmware", {
        method: "post",
        body: new URLSearchParams(postStr),
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (parseInt(data[0].valid) === 1) {
            binaryContent = hexToBytes(data[0].firmware);
            binaryContentIV = hexToBytes(data[0].iv);
            binaryNumberOfPages = Math.ceil(
              binaryContent.length / pageSizeQvap
            );
            debugFirmwareUpdate("binaryNumberOfPages: " + binaryNumberOfPages);
            if (
              applicationFirmwareQvap & applicationFirmwareMask_application &&
              (applicationFirmwareQvap &
                applicationFirmwareMask_invalidBootloader) ==
                0 &&
              updateBootloader == false
            )
              QVapSwitchToBootloader();
            else {
              pageIdxQvap = 0;
              dataIdxQvap = 0;
              QVapSetChunkSize();
            }
          } else {
            alert("no valid response received; please retry!");
            location.reload();
          }
        })
        .then((value) => {
          if (applicationFirmwareQvap & applicationFirmwareMask_application);
        })
        .catch((error) => {
          generateErrorMsg(error.toString(), true);
          setBleProcessPending(false);
        });
    }
}
function eventsQvap(state) {
  if (state == true) {
    firmwareBLEBootloaderText.innerText = "Firmware Bootloader";
    hideCurrTemperature(true);
    changeActualTemperatureColor("orange");
    chargeOptimizationToggle.addEventListener("click", chargeOptimizationFunc);
    chargeLimitToggle.addEventListener("click", chargeLimitFunc);
    findVenty.addEventListener("click", findMyQvap);
    findVenty2.addEventListener("click", findMyQvap);
    findVeazy.addEventListener("click", findMyQvap);
    findVeazy2.addEventListener("click", findMyQvap);
    boostVisualizationToggle.addEventListener("click", boostVisualizationFunc);
    tempMinus.classList.add("venty");
    tempMinus.classList.add("veazy");
    bluetoothToggleVeazyVenty.addEventListener(
      "click",
      bluetoothToggleHandlerVeazyVenty
    );
    brightness.max = 9;
    brightness.min = 1;
    brightness.step = 1;
  } else {
    try {
      characteristicQvap.removeEventListener(
        "characteristicvaluechanged",
        handleBLEQvapChanged
      );
    } catch (error) {
      console.log(error);
    }
    firmwareBLEBootloaderText.innerText = "Firmware BLE";
    clearInterval(periodicInterval);
    chargeOptimizationToggle.removeEventListener(
      "click",
      chargeOptimizationFunc
    );
    chargeLimitToggle.removeEventListener("click", chargeLimitFunc);
    boostVisualizationToggle.removeEventListener(
      "click",
      boostVisualizationFunc
    );
    findVenty.removeEventListener("click", findMyQvap);
    findVenty2.removeEventListener("click", findMyQvap);
    findVeazy.removeEventListener("click", findMyQvap);
    findVeazy2.removeEventListener("click", findMyQvap);
    hideCurrTemperature(false);
    tempMinus.classList.remove("venty");
    tempMinus.classList.remove("veazy");
    ventySchriftzug.classList.add("d-none");
    veazySchriftzug.classList.add("d-none");
    bluetoothToggleVeazyVenty.removeEventListener(
      "click",
      bluetoothToggleHandlerVeazyVenty
    );
    if (whichDeviceConnected() == devices.Veazy) {
      let elementeColor = document.getElementsByClassName("veazyDevColor");
      var i = 0;
      for (; i < elementeColor.length; i++)
        elementeColor[i].classList.add("d-none");
    }
  }
}
function bluetoothToggleHandlerVeazyVenty() {
  if (whichDeviceConnected() == devices.Veazy)
    if (!isBleProcessPendingWithoutAlert_Repeat()) {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 1);
      dataView.setUint8(1, maskSettingsWrite);
      if (bluetoothToggleVeazyVenty.checked) {
        dataView.setUint8(16, BIT_SETTINGS2_BLE_PERMANENT);
        dataView.setUint8(17, BIT_SETTINGS2_BLE_PERMANENT);
      } else {
        dataView.setUint8(16, 0);
        dataView.setUint8(17, BIT_SETTINGS2_BLE_PERMANENT);
      }
      setBleProcessPending(true);
      return characteristicQvap
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
function boostSuperboostTimeoutFuncQvap() {
  if (isDeviceConnectedVeazyVenty())
    if (!isBleProcessPendingWithoutAlert_Repeat()) {
      var buffer = new ArrayBuffer(7);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 6);
      dataView.setUint8(1, 1 << 4);
      if (boostSuperBoostTimeoutToggle.checked) dataView.setUint8(6, 1);
      else dataView.setUint8(6, 0);
      setBleProcessPending(true);
      return characteristicQvap
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
function vibrationToggleHandlerQvap() {
  if (isDeviceConnectedVeazyVenty())
    if (!isBleProcessPendingWithoutAlert_Repeat()) {
      var buffer = new ArrayBuffer(7);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 6);
      dataView.setUint8(1, 1 << 3);
      if (!vibrationToggle.checked) dataView.setUint8(5, 0);
      else dataView.setUint8(5, 1);
      setBleProcessPending(true);
      return characteristicQvap
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          generateErrorMsg(error.toString(), true);
          setBleProcessPending(false);
        });
    }
}
function chargeOptimizationFunc() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 1);
    dataView.setUint8(1, maskSettingsWrite);
    if (chargeOptimizationToggle.checked) {
      dataView.setUint8(14, BIT_SETTINGS_ECOMODE_CHARGE);
      dataView.setUint8(15, BIT_SETTINGS_ECOMODE_CHARGE);
    } else {
      dataView.setUint8(14, 0);
      dataView.setUint8(15, BIT_SETTINGS_ECOMODE_CHARGE);
    }
    setBleProcessPending(true);
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function writeBrightnessQvap(val) {
  if (isDeviceConnectedVeazyVenty())
    if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
      var buffer = new ArrayBuffer(7);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 6);
      dataView.setUint8(1, 1 << 0);
      val = limitValueToRange(Math.round(brightness.value), 1, 9);
      dataView.setUint8(2, val);
      setBleProcessPending(true);
      return characteristicQvap
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          generateErrorMsg(error.toString(), true);
          setBleProcessPending(false);
        });
    }
}
function boostVisualizationFunc() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 1);
    dataView.setUint8(1, maskSettingsWrite);
    if (
      (!boostVisualizationToggle.checked &&
        whichDeviceConnected() == devices.Veazy) ||
      (boostVisualizationToggle.checked &&
        whichDeviceConnected() != devices.Veazy)
    )
      dataView.setUint8(14, BIT_SETTINGS_BOOST_VISUALIZATION);
    else dataView.setUint8(14, 0);
    dataView.setUint8(15, BIT_SETTINGS_BOOST_VISUALIZATION);
    setBleProcessPending(true);
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function chargeLimitFunc() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 1);
    dataView.setUint8(1, maskSettingsWrite);
    if (chargeLimitToggle.checked) {
      dataView.setUint8(14, BIT_SETTINGS_ECOMODE_VOLTAGE);
      dataView.setUint8(15, BIT_SETTINGS_ECOMODE_VOLTAGE);
    } else {
      dataView.setUint8(14, 0);
      dataView.setUint8(15, BIT_SETTINGS_ECOMODE_VOLTAGE);
    }
    setBleProcessPending(true);
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function findMyQvap() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 13);
    dataView.setUint8(1, 1);
    setBleProcessPending(true);
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function startAnalysisQvapFunc() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 3);
    setBleProcessPending(true);
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function readDeviceData() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 5);
    setBleProcessPending(true);
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function startAnalysisQvapFuncSandB() {
  if (
    !isBleProcessPendingWithoutAlert_Repeat() &&
    isDeviceConnectedVeazyVenty()
  ) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 0);
    if (pkaSend === 0) dataView.setUint8(1, 3);
    else dataView.setUint8(1, 8);
    setBleProcessPending(true);
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function disconnectQvap() {
  if (isDeviceConnectedVeazyVenty()) {
    eventsQvap(false);
    let elemente = document.getElementsByClassName(
      getVeazyVentyDeviceName().toLowerCase()
    );
    var i = 0;
    for (; i < elemente.length; i++) elemente[i].classList.add("d-none");
  }
}
function showFindMyDevice(ena) {
  let elementeEna = document.getElementsByClassName("findMyDeviceEna");
  let elementeDis = document.getElementsByClassName("findMyDeviceDis");
  if (ena) {
    findMyDeviceModeActivated = true;
    elementeEna = document.getElementsByClassName("findMyDeviceDis");
    elementeDis = document.getElementsByClassName("findMyDeviceEna");
  } else findMyDeviceModeActivated = false;
  var i = 0;
  for (; i < elementeEna.length; i++) elementeEna[i].classList.add("d-none");
  i = 0;
  for (; i < elementeDis.length; i++) elementeDis[i].classList.remove("d-none");
}
function QvapResetVariablesAtConnect() {
  firstReadCMD1 = true;
  applicationFirmwareQvap = 0;
  var pleaseWait = $("#pleaseWaitDialog");
  pleaseWait.modal("hide");
  updateBootloader = false;
  shouldUpdateBootloader = false;
}
function requestServerFirmwareVersion() {
  let postStr =
    "device=" + getVeazyVentyDeviceName() + "&action=version&serial=";
  return fetch("firmware", {
    method: "post",
    body: new URLSearchParams(postStr),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (parseInt(data[0].valid) === 1) {
        firmwareFileMajorQvap = parseInt(data[0].majorApplication);
        firmwareFileMinorQvap = parseInt(data[0].minorApplication);
        bootloaderFileMajorQvap = parseInt(data[0].majorBootloader);
        bootloaderFileMinorQvap = parseInt(data[0].minorBootloader);
      } else {
        alert("please retry; reading version failed!");
        location.reload();
      }
    })
    .catch((error) => {
      console.log(error.toString() + "\n" + error.stack);
    });
}
function QvapConnect() {
  eventsQvap(true);
  bluetoothDevice.gatt
    .connect()
    .then((server) => {
      nbRetriesValidation = 0;
      BLEServer = server;
      $("#waitModal").modal("show");
      currentThenValue = 2;
      console.log(server);
      return server.getPrimaryService(serviceUuidQvap);
    })
    .then((service) => {
      aside.classList.add("d-none");
      currentThenValue = 3;
      primaryServiceQvapUuid = service;
      return primaryServiceQvapUuid.getCharacteristic(
        "00000001-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      currentThenValue = 4;
      characteristicQvap = characteristic;
      return characteristicQvap.startNotifications().then((_) => {
        characteristicQvap.addEventListener(
          "characteristicvaluechanged",
          handleBLEQvapChanged
        );
      });
    })
    .then((characteristic) => {
      currentThenValue = 5;
      return QvapConnect2();
    })
    .catch((error) => {
      eventsQvap(false);
      if (error.toString().includes("User cancelled"))
        $("#waitModal").modal("hide");
      else {
        $("#waitModal").modal("hide");
        alert(
          "Bluetooth connection error QVAP: please reload and retry.\n" +
            error.toString() +
            "\n" +
            error.stack +
            "\n" +
            currentThenValue
        );
      }
    });
}
function QvapConnect2() {
  return BLEServer.getPrimaryService(serviceUuidQvap1)
    .then((service) => {
      currentThenValue = 6;
      genericAccessSupported = true;
      return service.getCharacteristic("00002a00-0000-1000-8000-00805f9b34fb");
    })
    .then((characteristics) => {
      currentThenValue = 7;
      return characteristics.readValue();
    })
    .then((value) => {
      currentThenValue = 8;
      setSerialNumber(new TextDecoder().decode(value).split(" ")[1]);
    })
    .catch((error) => {
      console.log(error);
      genericAccessSupported = false;
    })
    .finally(() => {
      QvapConnect3();
    });
}
function QvapConnect3() {
  return requestServerFirmwareVersion()
    .then((val) => {
      currentThenValue = 9;
      $("#waitModal").modal("hide");
      if (typeof characteristicQvap.writeValueWithResponse === "function")
        browserSupportsWriteWithResponse = true;
      else browserSupportsWriteWithResponse = false;
      var elemente = document.getElementsByClassName(
        getVeazyVentyDeviceName().toLowerCase()
      );
      var i = 0;
      for (; i < elemente.length; i++) elemente[i].classList.remove("d-none");
      document.getElementById("boostModeTimeoutGroup").classList.add("d-none");
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 2);
      QvapResetVariablesAtConnect();
      console.log("cmd 0x02");
      if (browserSupportsWriteWithResponse)
        return characteristicQvap.writeValueWithResponse(buffer);
      else return characteristicQvap.writeValue(buffer);
    })
    .then((val) => {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      console.log("cmd 0x1D");
      dataView.setUint8(0, 29);
      return characteristicQvap.writeValue(buffer);
    })
    .then((val) => {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      console.log("cmd 0x01");
      dataView.setUint8(0, 1);
      return characteristicQvap.writeValue(buffer);
    })
    .then((val) => {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      console.log("cmd 0x04");
      dataView.setUint8(0, 4);
      return characteristicQvap.writeValue(buffer);
    })
    .then((val) => {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      let cmdByte = 35;
      if (applicationFirmwareQvap & applicationFirmwareMask_application)
        cmdByte = 35;
      else cmdByte = 3;
      console.log("cmd " + cmdByte);
      dataView.setUint8(0, cmdByte);
      return characteristicQvap.writeValue(buffer);
    })
    .then((val) => {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 5);
      return characteristicQvap.writeValue(buffer);
    })
    .then((val) => {
      var buffer = new ArrayBuffer(7);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 6);
      return characteristicQvap.writeValue(buffer);
    })
    .then((val) => {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      dataView.setUint8(1, 6);
      if (applicationFirmwareQvap & applicationFirmwareMask_application) {
        periodicInterval = setInterval(periodicIntervalFunc, 500);
        dataView.setUint8(0, 48);
      } else dataView.setUint8(0, 1);
      return characteristicQvap.writeValue(buffer);
    })
    .catch((error) => {
      eventsQvap(false);
      if (error.toString().includes("User cancelled"))
        $("#waitModal").modal("hide");
      else {
        $("#waitModal").modal("hide");
        alert(
          "Bluetooth connection error QVAP: please reload and retry.\n" +
            error.toString() +
            "\n" +
            error.stack +
            "\n" +
            currentThenValue
        );
      }
    });
}
function readConnectionIntervall() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(1, 6);
    if (applicationFirmwareQvap & applicationFirmwareMask_application)
      dataView.setUint8(0, 48);
    else dataView.setUint8(0, 1);
    setBleProcessPending(true);
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function handleBLEQvapChanged(event) {
  parseBLEResponse(event.target.value);
}
function startQvapApplication(repeat) {
  debugFirmwareUpdate("__startQvapApplication");
  let dev = getVeazyVentyDeviceName();
  let postStr =
    "device=" + dev + "&action=firmwarePreconfirm&serial=" + getSerialNumber();
  if (updateBootloader)
    postStr =
      "device=" +
      dev +
      "&action=firmwarePreconfirmApp&serial=" +
      getSerialNumber();
  fetch("firmware", {
    method: "post",
    body: new URLSearchParams(postStr),
  }).catch((error) => {
    console.log(error);
  });
  var buffer = new ArrayBuffer(5);
  var dataView = new DataView(buffer);
  postStr =
    "device=" + dev + "&action=firmwareConfirm&serial=" + getSerialNumber();
  if (updateBootloader) dataView.setUint8(0, 48);
  else dataView.setUint8(0, 1);
  dataView.setUint8(1, 3);
  preventScreenDimming(false);
  setBleProcessPending(true);
  if (repeat != false)
    timeoutBLEresponseQvap = setTimeout(
      handleTimeoutBLEResponseMissingQvap,
      750
    );
  characteristicQvap
    .writeValue(buffer)
    .then((value) => {
      setBleProcessPending(false);
      clearTimeout(timeoutBLEresponseQvap);
      return fetch("firmware", {
        method: "post",
        body: new URLSearchParams(postStr),
      }).catch((error) => {
        console.log(error);
      });
    })
    .catch((error) => {
      setBleProcessPending(false);
      console.log(error);
      return fetch("firmware", {
        method: "post",
        body: new URLSearchParams(postStr),
      }).catch((error) => {
        console.log(error);
      });
    });
}
var arrayAnalysis = new Uint8Array(256);
var arrayAnalysis1 = new Uint8Array(256);
let pkaIdx = 0;
let keyID_crypt = -1;
let keyID_sign = -1;
var connectionIntervallCounter = 0;
function parseBLEResponse(arrayBufferVal) {
  console.log("----parseBLEResponse addr: " + arrayBufferVal.getUint8(0));
  switch (arrayBufferVal.getUint8(0)) {
    case 0: {
      if (
        arrayBufferVal.byteLength === 20 &&
        arrayBufferVal.getUint8(1) === 3
      ) {
        if (keyID_crypt === -1) keyID_crypt = arrayBufferVal.getUint8(19);
        if (pkaSend === 1) {
          pkaIdx = arrayBufferVal.getUint8(2);
          for (let j = 0; j < 16; j++)
            arrayAnalysis1[j + pkaIdx * 16] = arrayBufferVal.getUint8(3 + j);
        }
        if (pkaSend === 0) {
          pkaIdx = arrayBufferVal.getUint8(2);
          for (let i = 0; i < 16; i++)
            arrayAnalysis[i + pkaIdx * 16] = arrayBufferVal.getUint8(3 + i);
          if (
            pkaIdx === 15 &&
            pkaSend === 0 &&
            firmwareValueArrayConnectedQvap[2] < 8
          ) {
            for (let i = 0; i < 16; i++) arrayAnalysis1[i + pkaIdx * 16] = 0;
            pkaSend = 1;
          }
          if (pkaIdx === 15 && firmwareValueArrayConnectedQvap[2] >= 8) {
            pkaSend = 1;
            pkaIdx = 0;
            startAnalysisQvapFuncSandB();
          }
        }
        if (pkaIdx === 15 && pkaSend === 1)
          fetch("analysis", {
            method: "post",
            body: new URLSearchParams(
              "data=" +
                buf2hex(arrayAnalysis) +
                "&data1=" +
                buf2hex(arrayAnalysis1) +
                "&keyID=" +
                keyID_crypt +
                "&device=" +
                getVeazyVentyDeviceName() +
                "&serialNumber=" +
                getSerialNumber()
            ),
          })
            .then(function (response) {
              return response.json();
            })
            .then(function (data) {
              try {
                if (data[0].valid === 1)
                  if (errCategory === 4)
                    alert(
                      "Please initiate an RMA through www.storz-bickel.com and use analysis identifier " +
                        data[0].id +
                        " in the error description."
                    );
                  else
                    alert(
                      "The analysis identifier is " +
                        data[0].id +
                        " (only required if we specifically requested it)."
                    );
                else alert("Analysis data transmission failed");
              } catch (e) {
                alert(e);
                console.log(data);
              }
            })
            .catch((error) => {
              alert(error);
            })
            .finally(() => {
              pkaSend = 0;
              pkaIdx = 0;
              keyID_crypt = -1;
            });
      } else console.log("resp 0 - invalid");
      break;
    }
    case 1:
    case 48: {
      if (
        applicationFirmwareQvap & applicationFirmwareMask_application &&
        updateBootloader == false &&
        arrayBufferVal.getUint8(0) != 48
      ) {
        if (arrayBufferVal.byteLength >= 15) {
          if (firstReadCMD1 == true && findMyDeviceModeActivated) {
            showFindMyDevice(false);
            readDeviceData();
            QVapReadBrightnessAndVibration();
          }
          updateCurrTemperatureMobile(
            Math.round(
              (arrayBufferVal.getUint8(2) + arrayBufferVal.getUint8(3) * 256) /
                10
            )
          );
          if (firstReadCMD1 || !boostWillChangeViaBLE())
            setShowBoostTempMobile(arrayBufferVal.getUint8(6));
          if (firstReadCMD1 || !superboostWillChangeViaBLE())
            setShowSuperBoostTempMobile(arrayBufferVal.getUint8(7));
          setBatteryValue(arrayBufferVal.getUint8(8));
          const tempCntAutoShutoff =
            arrayBufferVal.getUint8(9) + arrayBufferVal.getUint8(10);
          document.getElementById("timerInSec").innerText =
            tempCntAutoShutoff + " sec";
          var val = Math.round((100 * tempCntAutoShutoff) / 120);
          document.getElementById("timer").style.width = val + "%";
          const tempHeaterModus = arrayBufferVal.getUint8(11);
          if (tempHeaterModus > 0) showVeazyVentyActive(true);
          else showVeazyVentyActive(false);
          const tempChargerConnected = arrayBufferVal.getUint8(13);
          const tempSettings = arrayBufferVal.getUint8(14);
          if (tempSettings & BIT_SETTINGS_UNIT) setCelsiusActive(false);
          else setCelsiusActive(true);
          updateTemperatureLabelsMobile();
          if (tempSettings & BIT_SETTINGS_ECOMODE_CHARGE)
            chargeOptimizationToggle.checked = true;
          else chargeOptimizationToggle.checked = false;
          if (
            (tempSettings & BIT_SETTINGS_BUTTON_CHANGED_FILLING_CHAMBER &&
              !setTemperatureWillChangeViaBLE()) ||
            firstReadCMD1
          )
            setShowSollTempMobile(
              (arrayBufferVal.getUint8(4) + arrayBufferVal.getUint8(5) * 256) /
                10
            );
          let visualizationTemp = false;
          if (tempSettings & BIT_SETTINGS_BOOST_VISUALIZATION)
            visualizationTemp = true;
          else visualizationTemp = false;
          if (whichDeviceConnected() == devices.Veazy)
            visualizationTemp = !visualizationTemp;
          boostVisualizationToggle.checked = visualizationTemp;
          if (tempSettings & BIT_SETTINGS_ECOMODE_VOLTAGE)
            chargeLimitToggle.checked = true;
          else chargeLimitToggle.checked = false;
          if (tempHeaterModus > 0) {
            if (tempHeaterModus != heaterModusPrev)
              if (tempHeaterModus == 1) {
                setBoostModeMobile(false);
                setSuperBoostModeMobile(false);
              } else if (tempHeaterModus == 2) {
                setBoostModeMobile(true);
                setSuperBoostModeMobile(false);
              } else if (tempHeaterModus == 3) {
                setBoostModeMobile(true);
                setSuperBoostModeMobile(true);
              }
            if (tempSettings & BIT_SETTINGS_SETPOINT_REACHED)
              changeActualTemperatureColor("green");
            else changeActualTemperatureColor("orange");
          } else {
            setBoostModeMobile(false);
            setSuperBoostModeMobile(false);
            changeActualTemperatureColor("grey");
          }
          if (arrayBufferVal.byteLength >= 17) {
            const tempSettings2 = arrayBufferVal.getUint8(16);
            if (tempSettings2 & BIT_SETTINGS2_BLE_PERMANENT)
              bluetoothToggleVeazyVenty.checked = true;
            else bluetoothToggleVeazyVenty.checked = false;
          }
          heaterModusPrev = tempHeaterModus;
          firstReadCMD1 = false;
        }
      } else {
        debugFirmwareUpdate(
          "_______cmd0x" +
            arrayBufferVal.getUint8(0).toString(16).padStart(2, "0") +
            " - bootloader"
        );
        repeatPageData = 0;
        clearTimeout(timeoutBLEresponseQvap);
        debugFirmwareUpdate(
          " status: 0x" + arrayBufferVal.getUint8(1).toString(16)
        );
        if (arrayBufferVal.byteLength > 2) {
          debugFirmwareUpdate(
            " status: 0x" + arrayBufferVal.getUint8(1).toString(16)
          );
          if (arrayBufferVal.getUint8(1) == 1) {
            dataIdxQvap = dataIdxQvap + 1;
            if (dataIdxQvap >= pageSizeQvap / dataSizeFirmwarePerPacket)
              debugFirmwareUpdate("page write start request");
            else debugFirmwareUpdate("page data write request");
            writePageDataSequenceQvap();
          } else if (arrayBufferVal.getUint8(1) == 2) {
            pageIdxQvap = pageIdxQvap + 1;
            dataIdxQvap = 0;
            debugFirmwareUpdate("page " + pageIdxQvap + " write done");
            if (pageIdxQvap < binaryNumberOfPages) writePageDataSequenceQvap();
            else
              return sleep(200).then((val) => {
                startQvapApplication(true);
              });
          } else if (arrayBufferVal.getUint8(1) == 3);
          else if (arrayBufferVal.getUint8(1) == 4);
          else if (arrayBufferVal.getUint8(1) == 5);
          else if (arrayBufferVal.getUint8(1) == 6) {
            debugFirmwareUpdate(
              "   connection interval " +
                arrayBufferVal.getUint8(2) +
                " cnt: " +
                connectionIntervallCounter
            );
            if (arrayBufferVal.getUint8(2) < 25 && !startUpdate.disabled)
              if (connectionIntervallCounter < 10) {
                connectionIntervallCounter = connectionIntervallCounter + 1;
                return sleep(200)
                  .then(() => {
                    debugFirmwareUpdate("   connection interval ");
                    readConnectionIntervall();
                  })
                  .catch((error) => {
                    generateErrorMsg(error.toString(), true);
                    setBleProcessPending(false);
                  });
              } else
                generateErrorMsg(
                  "BLE connection interval is to small; Firmware upgrade will fail; please use different hardware; sorry.",
                  true
                );
          } else if (arrayBufferVal.getUint8(1) == 8) {
            debugFirmwareUpdate("  decrypt data done");
            var buffer = new ArrayBuffer(3);
            var dataView = new DataView(buffer);
            if (updateBootloader) dataView.setUint8(0, 48);
            else dataView.setUint8(0, 1);
            dataView.setUint8(1, 2);
            dataView.setUint8(2, pageIdxQvap);
            timeoutBLEresponseQvap = setTimeout(
              handleTimeoutBLEResponseMissingQvap,
              750
            );
            characteristicQvap.writeValue(buffer);
          } else if (arrayBufferVal.getUint8(1) == 34)
            generateErrorMsg("Erase failed: please reload and retry.\n", true);
          else if (arrayBufferVal.getUint8(1) == 19) {
            generateErrorMsg(
              "Validation failed : please reload and retry.\n",
              true
            );
            if (nbRetriesValidation < 1) {
              startQvapApplication(true);
              nbRetriesValidation = nbRetriesValidation + 1;
            }
          } else if (arrayBufferVal.getUint8(1) == 51)
            generateErrorMsg(
              "Validation failed (mode): please reload and retry.\n",
              true
            );
          else if (arrayBufferVal.getUint8(1) == 35)
            generateErrorMsg(
              "Validation failed: please reload and retry.\n",
              true
            );
          else if (arrayBufferVal.getUint8(1) == 82)
            generateErrorMsg(
              "VersionMajor failed: please reload and retry.\n",
              true
            );
          else if (arrayBufferVal.getUint8(1) == 98)
            generateErrorMsg(
              "VersionMinor failed: please reload and retry.\n",
              true
            );
          else
            console.log(
              "   undefined status " +
                arrayBufferVal.getUint8(1) +
                " - " +
                arrayBufferVal.getUint8(2),
              false
            );
        }
      }
      break;
    }
    case 2: {
      if (arrayBufferVal.byteLength >= 19) {
        applicationFirmwareQvap = arrayBufferVal.getUint8(1);
        var tmp = arrayBufferVal.buffer.slice(2, 8);
        let decoder = new TextDecoder("utf-8");
        let firmwareVersion = decoder.decode(tmp);
        firmwareLabel.innerText = firmwareVersion;
        tmp = arrayBufferVal.buffer.slice(11, 11 + 6);
        let bootloaderVersion = decoder.decode(tmp);
        firmwareBLEBootloaderLabel.innerText = bootloaderVersion;
        var regex = /(\d+)\.?(\d+)$/;
        firmwareValueArrayConnectedQvap = regex.exec(firmwareVersion);
        var resultBootloader = regex.exec(bootloaderVersion);
        firmwareUpdateIgnore.style.visibility = "visible";
        firmwareUpdateStart.style.visibility = "visible";
        document.getElementById("firmwareUpdateSNInput").style.display = "none";
        let tempDev = getVeazyVentyDeviceName().toUpperCase();
        if (!(applicationFirmwareQvap & applicationFirmwareMask_application)) {
          clearInterval(periodicInterval);
          if (getSerialNumber().charAt(2) != "_") {
            document.getElementById("firstdigit").value =
              getSerialNumber().charAt(2);
            document.getElementById("seconddigit").value =
              getSerialNumber().charAt(3);
            document.getElementById("thirddigit").value =
              getSerialNumber().charAt(4);
          }
          document.getElementById("fourthdigit").value =
            getSerialNumber().charAt(5);
          document.getElementById("fifthdigit").value =
            getSerialNumber().charAt(6);
          document.getElementById("sixthdigit").value =
            getSerialNumber().charAt(7);
          var element = document.getElementById("firmwareUpdateText");
          firmwareUpdateLiItem.classList.remove("d-none");
          startUpdate.disabled = false;
          $("#firmwareUpdateModal").removeData("bs.modal").modal({
            backdrop: "static",
          });
          if (
            applicationFirmwareQvap &
              applicationFirmwareMask_invalidApplication ||
            (firmwareValueArrayConnectedQvap.length >= 3 &&
              firmwareFileMajorQvap == firmwareValueArrayConnectedQvap[1] &&
              checkVersionIsGreater(
                firmwareFileMinorQvap,
                firmwareValueArrayConnectedQvap[2]
              ))
          ) {
            element.innerHTML =
              "Please enter the correct serial number to successfully complete the update.";
            document.getElementById("firmwareUpdateSNInput").style.display =
              "block";
            firmwareUpdateIgnore.style.visibility = "hidden";
          } else {
            element.innerHTML =
              "Your " +
              tempDev +
              " is in firmware update mode: please press power button to start application.";
            $("#firmwareUpdateModal").removeData("bs.modal").modal({
              backdrop: true,
            });
            firmwareUpdateStart.style.visibility = "hidden";
          }
          $("#firmwareUpdateModal").modal("show");
        } else if (
          applicationFirmwareQvap & applicationFirmwareMask_invalidBootloader ||
          (resultBootloader.length >= 3 &&
            bootloaderFileMajorQvap == resultBootloader[1] &&
            bootloaderFileMinorQvap > resultBootloader[2] &&
            firmwareValueArrayConnectedQvap[2] >= 9)
        ) {
          shouldUpdateBootloader = true;
          element = document.getElementById("firmwareUpdateText");
          element.innerHTML =
            "<b>Your " +
            tempDev +
            " is ready for an update!</b><br>The update consists of 2 parts and will only take a few minutes.<br>Please click 'Update' to complete part 1.";
          firmwareUpdateLiItem.classList.remove("d-none");
          startUpdate.disabled = false;
          firmwareUpdateIgnore.style.visibility = "hidden";
          $("#firmwareUpdateModal").removeData("bs.modal").modal({
            backdrop: true,
          });
          $("#firmwareUpdateModal").modal("show");
        } else if (
          firmwareValueArrayConnectedQvap.length >= 3 &&
          firmwareValueArrayConnectedQvap[1] == 0
        ) {
          startUpdate.disabled = true;
          firmwareUpdateLiItem.classList.add("d-none");
          alert("Please contact S&B for firmware update (development only)");
        } else if (
          firmwareValueArrayConnectedQvap.length < 3 ||
          firmwareFileMajorQvap != firmwareValueArrayConnectedQvap[1] ||
          !checkVersionIsGreater(
            firmwareFileMinorQvap,
            firmwareValueArrayConnectedQvap[2]
          )
        ) {
          startUpdate.disabled = true;
          firmwareUpdateLiItem.classList.add("d-none");
        } else {
          startUpdate.disabled = false;
          firmwareUpdateLiItem.classList.remove("d-none");
          element = document.getElementById("firmwareUpdateText");
          firmwareUpdateIgnore.style.visibility = "visible";
          $("#firmwareUpdateModal").removeData("bs.modal").modal({
            backdrop: true,
          });
          element.innerHTML =
            "<b>Your " +
            tempDev +
            " is ready for an update!</b><br>The update will restart your " +
            tempDev +
            ".<br>Afterwards, please reconnect to complete the update.";
          $("#firmwareUpdateModal").modal("show");
        }
      }
      break;
    }
    case 3:
    case 35: {
      if (
        applicationFirmwareQvap & applicationFirmwareMask_application &&
        arrayBufferVal.getUint8(0) == 3 &&
        arrayBufferVal.byteLength >= 3
      ) {
        var errCode = arrayBufferVal.getUint8(1);
        errCategory = arrayBufferVal.getUint8(2);
        if (errCategory == 4) {
          val = confirm(
            "Device analysis successful. An issue was detected.\nShare my analysis with S&B?"
          );
          if (val === true) startAnalysisQvapFuncSandB();
        } else {
          var strPre =
            "The following settings were adjusted by user and deviate from default settings. If desired, adjust accordingly.\n";
          var str = "";
          if (brightness.value < 9)
            str = str + "- Display brightness reduced.\n";
          if (chargeLimitToggle.checked)
            str =
              str +
              "- Charge limit activated: Improves battery life but reduces capacity.\n";
          if (!boostVisualizationToggle.checked)
            str = str + "- Boost & Superboost visualization disabled.\n";
          if (boostSuperBoostTimeoutToggle.checked)
            str = str + "- Boost & Superboost timeout disabled.\n";
          if (chargeOptimizationToggle.checked)
            str =
              str +
              "- Charge optimization activated: Improves battery life but reduces charging speed.\n";
          if (!vibrationToggle.checked) str = str + "- Vibration disabled.\n";
          if (str.length > 1) alert(strPre + str);
          else
            alert(
              "Device analysis successful. Your device is working properly."
            );
          val = confirm(
            "Your analysis data helps us enhance your experience with future updates. We are grateful for your support!\nShare my analysis with S&B?"
          );
          if (val === true) startAnalysisQvapFuncSandB();
        }
      } else if (arrayBufferVal.byteLength >= 10) {
        keyID_sign = arrayBufferVal.getUint8(2);
        console.log("keyID_sign " + keyID_sign);
      }
      break;
    }
    case 4: {
      if (arrayBufferVal.byteLength >= 20) {
        var HeaterRuntimeMinutes = convertBLEtoUint24(
          new DataView(arrayBufferVal.buffer.slice(1, 4))
        );
        var BatteryChargingTimeMinutes = convertBLEtoUint24(
          new DataView(arrayBufferVal.buffer.slice(4, 7))
        );
        var hours = Math.floor(HeaterRuntimeMinutes / 60);
        var minutes = HeaterRuntimeMinutes - hours * 60;
        setUsedTimeOfDevice(hours, minutes);
      }
      break;
    }
    case 5: {
      if (arrayBufferVal.byteLength > 17) {
        let decoder = new TextDecoder("utf-8");
        let tmpPrefix = arrayBufferVal.buffer.slice(15, 17);
        let tmpName = arrayBufferVal.buffer.slice(9, 15);
        setSerialNumber(decoder.decode(tmpPrefix) + decoder.decode(tmpName));
        if (whichDeviceConnected() == devices.Veazy) {
          let elementeColor = document.getElementsByClassName("veazyDevColor");
          var i = 0;
          for (; i < elementeColor.length; i++)
            elementeColor[i].classList.add("d-none");
          if (arrayBufferVal.byteLength > 18) {
            let idxColor = arrayBufferVal.getUint8(18);
            switch (idxColor) {
              case 2:
                {
                  elementeColor = document.getElementsByClassName("veazy-blue");
                }
                break;
              case 3:
                {
                  elementeColor = document.getElementsByClassName("veazy-pink");
                }
                break;
              case 4:
                {
                  elementeColor =
                    document.getElementsByClassName("veazy-orange");
                }
                break;
              default:
                {
                  elementeColor =
                    document.getElementsByClassName("veazy-black");
                }
                break;
            }
          }
          i = 0;
          for (; i < elementeColor.length; i++)
            elementeColor[i].classList.remove("d-none");
        }
      }
      break;
    }
    case 6: {
      if (arrayBufferVal.byteLength > 5) {
        brightness.value = arrayBufferVal.getUint8(2);
        if (arrayBufferVal.getUint8(5) == 0) vibrationToggle.checked = false;
        else vibrationToggle.checked = true;
        if (
          (firmwareValueArrayConnectedQvap[2] >= 8 &&
            whichDeviceConnected() == devices.Venty) ||
          whichDeviceConnected() == devices.Veazy
        ) {
          document
            .getElementById("boostModeTimeoutGroup")
            .classList.remove("d-none");
          if (arrayBufferVal.getUint8(6) == 0)
            boostSuperBoostTimeoutToggle.checked = false;
          else boostSuperBoostTimeoutToggle.checked = true;
        }
      }
      break;
    }
    case 29: {
      console.log("t_advertisingInfo cmd " + arrayBufferVal.getUint8(1));
      if (
        arrayBufferVal.byteLength > 1 &&
        arrayBufferVal.getUint8(1) & (1 << 4)
      )
        showFindMyDevice(true);
      break;
    }
    default: {
      console.log("default cmd " + arrayBufferVal.getUint8(0));
      break;
    }
  }
}
var k = 0;
function periodicIntervalFunc() {
  if (!isBleProcessPendingWithoutAlert()) {
    setBleProcessPending(true);
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    if (k > 30) {
      k = 0;
      dataView.setUint8(0, 4);
    } else {
      dataView.setUint8(0, 1);
      dataView.setUint8(1, 0);
    }
    return characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
        k = k + 1;
      })
      .catch((error) => {
        if (isDeviceIsConnected()) generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function onHeatClickQvap() {
  if (isDeviceConnectedVeazyVenty())
    if (!isBleProcessPendingWithoutAlert_Repeat()) {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 1);
      dataView.setUint8(1, maskHeaterWrite);
      if (heaterModusPrev == 0) dataView.setUint8(11, 1);
      else dataView.setUint8(11, 0);
      setBleProcessPending(true);
      characteristicQvap
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          generateErrorMsg(error.toString(), true);
          setBleProcessPending(false);
        });
    }
}
function showVeazyVentyActive(ena) {
  if (ena) {
    border.style.borderTopColor = "#ff6600";
    if (whichDeviceConnected() == devices.Veazy)
      veazySchriftzug.src = "img/vz-logo-power-1.svg";
    else ventySchriftzug.src = "img/vy-logo-power-1.svg";
  } else {
    border.style.borderTopColor = " #373737";
    if (whichDeviceConnected() == devices.Veazy)
      veazySchriftzug.src = "img/vz-logo-power-0.svg";
    else ventySchriftzug.src = "img/vy-logo-power-0.svg";
    timerObject.classList.add("d-none");
  }
}
function writeAutoOffCountdownQVap() {
  if (
    !isBleProcessPendingWithoutAlert_Repeat() &&
    isDeviceConnectedVeazyVenty()
  )
    console.log("writeAutoOffCountdownQVap");
}
function startFactoryResetFuncQVap() {
  if (
    !isBleProcessPendingWithoutAlert_Repeat() &&
    isDeviceConnectedVeazyVenty()
  ) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 1);
    dataView.setUint8(1, maskSettingsWrite);
    dataView.setUint8(14, BIT_SETTINGS_FACTORY_RESET);
    dataView.setUint8(15, BIT_SETTINGS_FACTORY_RESET);
    setBleProcessPending(true);
    characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
        QVapReadBrightnessAndVibration();
      })
      .then((service) => {
        setShowSollTempMobile(180);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function QVapReadBrightnessAndVibration() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = new ArrayBuffer(7);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 6);
    setBleProcessPending(true);
    characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function changeTemperatureUnitQVap() {
  if (
    !isBleProcessPendingWithoutAlert_Repeat() &&
    isDeviceConnectedVeazyVenty()
  ) {
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint8(0, 1);
    dataView.setUint8(1, maskSettingsWrite);
    if (isCelsiusActive()) dataView.setUint8(14, BIT_SETTINGS_UNIT);
    else dataView.setUint8(14, 0);
    dataView.setUint8(15, BIT_SETTINGS_UNIT);
    setBleProcessPending(true);
    characteristicQvap
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        generateErrorMsg(error.toString(), true);
        setBleProcessPending(false);
      });
  }
}
function writeSollTemperatureQVap(val) {
  if (isDeviceConnectedVeazyVenty())
    if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
      if (getSuperBoostModeMobile())
        val = val - getShowBoostTempMobile() - getSuperBoostModeMobile();
      else if (getBoostModeMobile()) val = val - getShowBoostTempMobile();
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 1);
      dataView.setUint8(1, maskSetTemperatureWrite);
      let bufferVal = convertToUInt16BLE(val * 10);
      var dataViewVal = new DataView(bufferVal);
      dataView.setUint8(4, dataViewVal.getUint8(0));
      dataView.setUint8(5, dataViewVal.getUint8(1));
      setBleProcessPending(true);
      characteristicQvap
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
          setTemperatureWillChangeViaBLE_RESET();
        })
        .catch((error) => {
          generateErrorMsg(error.toString(), true);
          setBleProcessPending(false);
          setTemperatureWillChangeViaBLE_RESET();
        });
    }
}
function writeBoostTemperatureQVap(val) {
  if (isDeviceConnectedVeazyVenty())
    if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 1);
      dataView.setUint8(1, maskSetBoostWrite);
      dataView.setUint8(6, val);
      setBleProcessPending(true);
      characteristicQvap
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
          boostWillChangeViaBLE_RESET();
        })
        .catch((error) => {
          generateErrorMsg(error.toString(), true);
          setBleProcessPending(false);
          boostWillChangeViaBLE_RESET();
        });
    }
}
function writeSuperBoostTemperatureQVap(val) {
  if (isDeviceConnectedVeazyVenty())
    if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
      var buffer = new ArrayBuffer(20);
      var dataView = new DataView(buffer);
      dataView.setUint8(0, 1);
      dataView.setUint8(1, maskSetSuperboostWrite);
      dataView.setUint8(7, val);
      setBleProcessPending(true);
      characteristicQvap
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
          superboostWillChangeViaBLE_RESET();
        })
        .catch((error) => {
          generateErrorMsg(error.toString(), true);
          setBleProcessPending(false);
          superboostWillChangeViaBLE_RESET();
        });
    }
}
