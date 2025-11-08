/*
 STORZ & BICKEL Web App v3.4.0 (https://app.storz-bickel.com)
STORZ & BICKEL ? 2020-2025
Unauthorized copying of this file via any medium is prohibited.
Written by STORZ & BICKEL GmbH
*/
const firmwareBLEVersionV = document.getElementById("firmwareBLE");
const volcanoHeatClick = document.getElementById("heat");
const volcanoAirClick = document.getElementById("air");
const volcanoSchriftzug = document.getElementById("volcanoSchriftzug");
const brightnessVolcano = document.getElementById("brightness");
const shutoffVolcano = document.getElementById("shutoff");
const vibrationToggleVolcano = document.getElementById("vibration");
const displayOnCoolingToggleVolcano = document.getElementById("cooling");
const workflowButton0 = document.getElementById("wf-0");
const workflowButton1 = document.getElementById("wf-1");
const workflowButton2 = document.getElementById("wf-2");
const workflowButton3 = document.getElementById("wf-3");
const startAnalysisVolcano = document.getElementById("startAnalysisVolcano");
let characteristicHeaterOffV;
let characteristicWriteTempV;
let characteristicHeaterOnV;
let isVolcanoOn = false;
let characteristicIsPumpOffV;
let characteristicCurrTempV;
let characteristicPrj1V;
let characteristicPrj2V;
let characteristicPrj3V;
let characteristicHist1;
let characteristicHist2;
let characteristicVolcanoShutOff;
let characteristicLedBrightnessV;
let characteristicCurrentAutoOffTimeVolcano;
let characteristicHeatHoursChangedVolcano;
let characteristicHeatMinutesChangedVolcano;
let autoOffTimeVolcano;
let shutOffTimeVolcano;
let isPumpOnVolcano = false;
let characteristicVolcanoPumpOn;
let currentTemperatureVolcano = 0;
let workFlowState = false;
let characteristicBootloaderWrite;
let firmwareChecksumOld = "";
let firmwareChecksumNew = "";
let deviceHasErrorsV = false;
let firmwareFileMajorHybrid = 0;
let firmwareFileMinorHybrid = 0;
let firmwareVersionCharacteristic = 0;
let codeNumberCharacteristic = 0;
let useHoursHeatVolcano = 0;
let useMinutesHeatVolcano = 0;
let browserSupportsWriteWithoutResponse = false;
const MASK_PRJSTAT1_VOLCANO_HEIZUNG_ENA = 32;
const MASK_PRJSTAT1_VOLCANO_ENABLE_AUTOBLESHUTDOWN = 512;
const MASK_PRJSTAT1_VOLCANO_PUMPE_FET_ENABLE = 8192;
const MASK_PRJSTAT2_VOLCANO_FAHRENHEIT_ENA = 512;
const MASK_PRJSTAT2_VOLCANO_DISPLAY_ON_COOLING = 4096;
const MASK_PRJSTAT3_VOLCANO_VIBRATION = 1024;
const MASK_PRJSTAT1_VOLCANO_ERR = 16408;
const MASK_PRJSTAT2_VOLCANO_ERR = 59;
let binaryContentV = 0;
let binaryNumberOfPagesV = 0;
let timeoutBLEresponseHybrid;
let primaryServiceUuidVolcano1;
let primaryServiceUuidVolcano2;
let primaryServiceUuidVolcano3;
let primaryServiceUuidVolcano4;
let bleServerVolcano;
$(function () {
  $("#firmwareUpdateIgnore").on("click", function () {
    $("#firmwareUpdateModal").modal("hide");
  });
});
function isVolcanoHeaterOn() {
  return isVolcanoOn;
}
function isVolcanoPumpOn() {
  return isPumpOnVolcano;
}
function eventsVolcano(state) {
  if (state == true) {
    changeActualTemperatureColor("orange");
    document.getElementById("BLEAnalysisItem").classList.remove("d-none");
    volcanoHeatClick.addEventListener("click", onHeatClickVolcano);
    volcanoAirClick.addEventListener("click", onAirClickVolcano);
    brightnessVolcano.addEventListener("change", writeBrightnessVolcano);
    shutoffVolcano.addEventListener("change", writeAutoOffCountdownVolcano);
    vibrationToggleVolcano.addEventListener(
      "click",
      vibrationToggleVolcanoHandler
    );
    displayOnCoolingToggleVolcano.addEventListener(
      "click",
      displayOnCoolingToggleVolcanoHandler
    );
    volcanoSchriftzug.addEventListener("click", onVolcanoSchriftzugClick);
    workflowButton0.addEventListener("click", onWorkflowClick0);
    workflowButton1.addEventListener("click", onWorkflowClick1);
    workflowButton2.addEventListener("click", onWorkflowClick2);
    workflowButton3.addEventListener("click", onWorkflowClick3);
    startAnalysisVolcano.addEventListener("click", startAnalysisVolcanoFunc);
    tempMinus.classList.add("volcano");
  } else {
    volcanoHeatClick.removeEventListener("click", onHeatClickVolcano);
    volcanoAirClick.removeEventListener("click", onAirClickVolcano);
    brightnessVolcano.removeEventListener("change", writeBrightnessVolcano);
    shutoffVolcano.removeEventListener("change", writeAutoOffCountdownVolcano);
    vibrationToggleVolcano.removeEventListener(
      "click",
      vibrationToggleVolcanoHandler
    );
    displayOnCoolingToggleVolcano.removeEventListener(
      "click",
      displayOnCoolingToggleVolcanoHandler
    );
    try {
      characteristicWriteTempV.removeEventListener(
        "characteristicvaluechanged",
        handleTargetTemperatureChanged
      );
      characteristicCurrTempV.removeEventListener(
        "characteristicvaluechanged",
        handleCurrTemperatureChangedVolcano
      );
      characteristicPrj1V.removeEventListener(
        "characteristicvaluechanged",
        handlePrj1ChangedVolcano
      );
      characteristicPrj2V.removeEventListener(
        "characteristicvaluechanged",
        handlePrj2ChangedVolcano
      );
    } catch (e) {
      console.log("eventsVolcano " + e);
    }
    workflowButton0.removeEventListener("click", onWorkflowClick0);
    workflowButton1.removeEventListener("click", onWorkflowClick1);
    workflowButton2.removeEventListener("click", onWorkflowClick2);
    workflowButton3.removeEventListener("click", onWorkflowClick3);
    startUpdate.removeEventListener("click", startUpdateFunc);
    tempMinus.classList.remove("volcano");
    volcanoSchriftzug.classList.add("d-none");
  }
}
function startAnalysisVolcanoFunc() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    setBleProcessPending(true);
    var characteristicPrj1Value = 0;
    var characteristicPrj2Value = 0;
    var characteristicPrj3Value = 0;
    var hist1 = "";
    var hist2 = "";
    characteristicPrj1V
      .readValue()
      .then((value) => {
        characteristicPrj1Value = convertBLEtoUint16(value);
        return characteristicPrj2V.readValue();
      })
      .then((value) => {
        characteristicPrj2Value = convertBLEtoUint16(value);
        return characteristicPrj3V.readValue();
      })
      .then((value) => {
        characteristicPrj3Value = convertBLEtoUint16(value);
        return characteristicHist1.readValue();
      })
      .then((value) => {
        hist1 = buf2hex(new Uint8Array(value.buffer));
        return characteristicHist2.readValue();
      })
      .then((value) => {
        hist2 = buf2hex(new Uint8Array(value.buffer));
        setBleProcessPending(false);
        if (
          characteristicPrj1Value & MASK_PRJSTAT1_VOLCANO_ERR ||
          characteristicPrj2Value & MASK_PRJSTAT2_VOLCANO_ERR
        ) {
          let str =
            "Please contact STORZ & BICKEL with the following information: \n\n" +
            "SN   :   " +
            getSerialNumber() +
            "\n" +
            "date : 0x" +
            numHex(Math.floor(Date.now() / 1e3), 8) +
            "\n" +
            "hist1:   " +
            hist1 +
            "\n" +
            "hist2:   " +
            hist2 +
            "\n";
          alert(str);
        } else {
          var str = "";
          if (
            characteristicPrj2Value & MASK_PRJSTAT2_VOLCANO_DISPLAY_ON_COOLING
          )
            str =
              str +
              "- Temperature display during cool down phase disabled. Activate function if required.\n";
          if (characteristicPrj3Value & MASK_PRJSTAT3_VOLCANO_VIBRATION)
            str =
              str +
              "- Vibration when setpoint reached disabled. Activate function if required.\n";
          if (ledBrightness < 25)
            str =
              str +
              "- Display brightness set to low value. Change brightness if required.\n";
          if (str.length > 1) alert(str);
          else alert("Device analysis successful and without any issues.");
        }
      })
      .catch((error) => {
        setBleProcessPending(false);
        showError(error);
      });
  }
}
function calcCheckValue(val) {
  let data = val.slice(4, val.length - 2);
  var check = 0;
  for (let i = 0; i < data.length; i++) check = check ^ data[i];
  return check;
}
function generateTelegram(val, dataLen) {
  var buffer = new ArrayBuffer(6 + val.length);
  var uint8Buf = new Uint8Array(buffer);
  uint8Buf.set([254, 250, 127, 6 + dataLen], 0);
  uint8Buf.set(val, 4);
  uint8Buf.set([0, 253], 4 + val.length);
  uint8Buf[uint8Buf.length - 2] = calcCheckValue(uint8Buf);
  return buffer;
}
const fsmNameHybrid = {
  idle: 0,
  erase: 1,
  writePageAddr: 2,
  writePageData: 3,
  flashPage: 4,
  getCRCChecksum: 5,
  quitBootMode: 6,
};
let fsmHybrid = fsmNameHybrid.idle;
let pageIdxHybrid = 0;
let dataIdxHybrid = 0;
let repeatPageDataV = 0;
function handleTimeoutBLEResponseMissingHybrid() {
  console.log(
    "handleTimeoutBLEResponseMissingHybrid repeat: " + repeatPageDataV
  );
  if (dataIdxHybrid >= 16) pageIdxHybrid = pageIdxHybrid - 1;
  if (dataIdxHybrid > 0) dataIdxHybrid = dataIdxHybrid - 1;
  if (repeatPageDataV < 6) {
    repeatPageDataV = repeatPageDataV + 1;
    writePageDataSequenceHybrid();
  } else {
    preventScreenDimming(false);
    alert("Firmware update error: please reload and retry.\n");
  }
}
function writePageDataSequenceHybrid() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    console.log(
      " writePageDataSequenceHybrid dataIdxHybrid: " +
        dataIdxHybrid +
        " page: " +
        pageIdxHybrid
    );
    preventScreenDimming(true);
    let data = binaryContentV.slice(
      dataIdxHybrid * 128 + pageIdxHybrid * 2048,
      (dataIdxHybrid + 1) * 128 + pageIdxHybrid * 2048
    );
    setBleProcessPending(true);
    var newprogress = Math.round((pageIdxHybrid * 100) / binaryNumberOfPagesV);
    $("#progressFirmwareUpdate")
      .width(newprogress + "%")
      .attr("aria-valuenow", newprogress);
    let dataBuf = sendPageDataHybrid(data, dataIdxHybrid);
    var indexVar = 0;
    characteristicBootloaderWrite
      .writeValueWithoutResponse(dataBuf.slice(indexVar, indexVar + 20))
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 20)
        );
      })
      .then((value) => {
        indexVar = indexVar + 20;
        return characteristicBootloaderWrite.writeValueWithoutResponse(
          dataBuf.slice(indexVar, indexVar + 6)
        );
      })
      .then((value) => {
        dataIdxHybrid = dataIdxHybrid + 1;
        timeoutBLEresponseHybrid = setTimeout(
          handleTimeoutBLEResponseMissingHybrid,
          1500
        );
        if (dataIdxHybrid < 16) fsmHybrid = fsmNameHybrid.writePageData;
        else if (pageIdxHybrid < binaryNumberOfPagesV) {
          fsmHybrid = fsmNameHybrid.flashPage;
          pageIdxHybrid = pageIdxHybrid + 1;
        } else fsmHybrid = fsmNameHybrid.idle;
        setBleProcessPending(false);
      })
      .catch((error) => {
        preventScreenDimming(false);
        console.log(error);
        showError(error);
        setBleProcessPending(false);
      });
  }
}
function parseTelegram(uint8Buf) {
  let len = uint8Buf[3];
  clearTimeout(timeoutBLEresponseHybrid);
  if (calcCheckValue(uint8Buf) == uint8Buf[len - 2]) {
    let str = uint8Buf.slice(4, len - 2);
    let decoder = new TextDecoder("utf-8");
    let strChar = decoder.decode(str);
    if (strChar.startsWith("RV0 222 BL")) {
      if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
        setBleProcessPending(true);
        characteristicBootloaderWrite
          .writeValue(getPageNumber())
          .then((value) => {
            setBleProcessPending(false);
          });
      }
    } else if (strChar.startsWith("Ra1 ")) {
      if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
        setBleProcessPending(true);
        characteristicBootloaderWrite
          .writeValue(getPageSize())
          .then((value) => {
            setBleProcessPending(false);
          });
      }
    } else if (strChar.startsWith("Ra2 ")) {
      if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
        setBleProcessPending(true);
        pageIdxHybrid = 0;
        dataIdxHybrid = 0;
        fsmHybrid = fsmNameHybrid.writePageAddr;
        characteristicBootloaderWrite.writeValue(chipErase()).then((value) => {
          setBleProcessPending(false);
        });
      }
    } else if (strChar.startsWith("Rc ")) {
      console.log("strChar.startsWith('Rc ') " + strChar);
      setBleProcessPending(true);
      fsmHybrid = fsmNameHybrid.quitBootMode;
      if (strChar.includes(firmwareChecksumNew))
        characteristicBootloaderWrite
          .writeValue(sendCRChecksum(firmwareChecksumNew))
          .then((value) => {
            setBleProcessPending(false);
          });
      else if (strChar.includes(firmwareChecksumOld))
        characteristicBootloaderWrite
          .writeValue(sendCRChecksum(firmwareChecksumOld))
          .then((value) => {
            setBleProcessPending(false);
          });
      else {
        setBleProcessPending(false);
        alert("Firmware CRC error: please contact STORZ & BICKEL.");
      }
    } else if (strChar.startsWith("W> ")) {
      console.log("  ACK");
      if (fsmHybrid == fsmNameHybrid.writePageAddr) {
        dataIdxHybrid = 0;
        if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
          console.log("fsmNameHybrid.writePageAddr " + pageIdxHybrid);
          if (pageIdxHybrid < binaryNumberOfPagesV) {
            setBleProcessPending(true);
            fsmHybrid = fsmNameHybrid.writePageData;
            repeatPageDataV = 0;
            characteristicBootloaderWrite
              .writeValue(writePage(pageIdxHybrid))
              .then((value) => {
                setBleProcessPending(false);
              });
          } else {
            fsmHybrid = fsmNameHybrid.idle;
            characteristicBootloaderWrite
              .writeValue(getCRCChecksum())
              .then((value) => {
                setBleProcessPending(false);
              });
          }
        }
      } else if (fsmHybrid == fsmNameHybrid.flashPage) {
        console.log("fsmNameHybrid.flashPage");
        setBleProcessPending(true);
        fsmHybrid = fsmNameHybrid.writePageAddr;
        characteristicBootloaderWrite.writeValue(flashPage()).then((value) => {
          setBleProcessPending(false);
        });
      } else if (fsmHybrid == fsmNameHybrid.writePageData) {
        console.log("fsmNameHybrid.writePageData");
        writePageDataSequenceHybrid();
      } else if (fsmHybrid == fsmNameHybrid.getCRCChecksum) {
        console.log("fsmNameHybrid.getCRCChecksum");
        setBleProcessPending(true);
        fsmHybrid = fsmNameHybrid.idle;
        characteristicBootloaderWrite
          .writeValue(getCRCChecksum())
          .then((value) => {
            setBleProcessPending(false);
          });
      } else if (fsmHybrid == fsmNameHybrid.quitBootMode) {
        console.log("fsmNameHybrid.quitBootMode");
        preventScreenDimming(false);
        setBleProcessPending(true);
        fsmHybrid = fsmNameHybrid.idle;
        characteristicBootloaderWrite
          .writeValue(exitBootMode())
          .then((value) => {
            setBleProcessPending(false);
            alert(
              "Firmware update successful: please reconnect to VOLCANO HYBRID."
            );
          });
      } else {
        console.log("not defined");
        console.log("data: '" + strChar + "'");
      }
    } else if (strChar.startsWith("W?")) console.log("  NACK");
    else console.log("data: '" + strChar + "'");
    return true;
  } else return false;
}
function writePage(page) {
  const zeroPad = (num, places) => {
    return String(num).padStart(places, "0");
  };
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Wp  " + zeroPad(page, 4)), 8);
}
function getPageNumber() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Ra1"), 3);
}
function getBootStatus() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("RV0"), 3);
}
function getVersion() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("RVA"), 3);
}
function getPageSize() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Ra2"), 3);
}
function chipErase() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("We "), 3);
}
function sendPageDataHybrid(data, position) {
  var enc = new TextEncoder();
  var dec = new TextDecoder();
  var nbr = position.toString(16).toUpperCase();
  var dat = enc.encode("Wd" + nbr + " " + buf2hex(data));
  return generateTelegram(dat, 128 + 4);
}
function flashPage() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Wfp"), 3);
}
function getCRCChecksum() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Rc "), 3);
}
function getStatusRegister() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Rsa"), 3);
}
function getBootloaderMode() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Rsm"), 3);
}
function getPageFlagRegister() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Rsp"), 3);
}
function sendCRChecksum(checksum) {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Wc  " + checksum), 14);
}
function exitBootMode() {
  var enc = new TextEncoder();
  return generateTelegram(enc.encode("Wl "), 3);
}
function startUpdateFuncHybrid() {
  console.log("startUpdateFuncHybrid ");
  if (whichDeviceConnected() == devices.Hybrid)
    if (!isBleProcessPendingWithoutAlert_Repeat()) {
      fsmHybrid = fsmNameHybrid.idle;
      $("#firmwareUpdateModal").modal("hide");
      $("#device").modal("hide");
      var pleaseWait = $("#pleaseWaitDialog");
      pleaseWait.modal("show");
      $("#progressFirmwareUpdate").width("0%").attr("aria-valuenow", 0);
      currentThenValue = 100;
      let postStr = "version=false";
      return fetch("firmwareHybrid", {
        method: "post",
        body: new URLSearchParams(postStr),
      })
        .then(function (response) {
          currentThenValue = 101;
          return response.json();
        })
        .then(function (data) {
          currentThenValue = 102;
          if (parseInt(data[0].valid) === 1) {
            firmwareChecksumOld = data[0].checksumOld;
            firmwareChecksumNew = data[0].checksumNew;
            binaryContentV = data[0].firmware;
            binaryNumberOfPagesV = binaryContentV.length / 2048;
            console.log("binaryNumberOfPagesV: " + binaryNumberOfPagesV);
            var buffer = convertToUInt16BLE(4711);
            setBleProcessPending(true);
            return codeNumberCharacteristic.writeValue(buffer);
          } else throw new Error("no valid response received");
        })
        .then((value) => {
          currentThenValue = 104;
          setBleProcessPending(false);
          setTimeout(function () {
            setBleProcessPending(true);
            characteristicBootloaderWrite
              .writeValue(getBootStatus())
              .then((value) => {
                setBleProcessPending(false);
              });
          }, 1e3);
        })
        .catch((error) => {
          showError(error);
          setBleProcessPending(false);
        });
    }
}
var _appendBuffer = function (buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};
var tempBufUARTBootloader = new ArrayBuffer(0);
function handleUARTBootloader(event) {
  tempBufUARTBootloader = _appendBuffer(
    tempBufUARTBootloader,
    event.target.value.buffer
  );
  let uint8Buf = new Uint8Array(tempBufUARTBootloader);
  var uint8BufTemp = new Uint8Array(tempBufUARTBootloader);
  if (uint8Buf[0] != 254) {
    uint8BufTemp = uint8BufTemp.slice(1, uint8BufTemp.length);
    for (let i = 1; i < uint8Buf.length; i++) {
      if (uint8Buf[i] == 254) break;
      uint8BufTemp = uint8BufTemp.slice(1, uint8BufTemp.length);
    }
  }
  if (parseTelegram(uint8BufTemp)) tempBufUARTBootloader = new ArrayBuffer(0);
}
function disconnectHybrid() {
  if (whichDeviceConnected() == devices.Hybrid) {
    eventsVolcano(false);
    let elemente = document.getElementsByClassName("volcano");
    var i = 0;
    for (; i < elemente.length; i++) elemente[i].classList.add("d-none");
  }
}
function volcanoConnect() {
  workFlowState = false;
  eventsVolcano(true);
  var elemente = document.getElementsByClassName("volcano");
  var i = 0;
  for (; i < elemente.length; i++) elemente[i].classList.remove("d-none");
  setMaximumAutomaticShutoff(360);
  bluetoothDevice.gatt
    .connect()
    .then((server) => {
      $("#waitModal").modal("show");
      bleServerVolcano = server;
      return bleServerVolcano.getPrimaryService(serviceUuidVolcano1);
    })
    .then((service) => {
      currentThenValue = 3;
      primaryServiceUuidVolcano1 = service;
      return bleServerVolcano.getPrimaryService(serviceUuidVolcano2);
    })
    .then((service) => {
      currentThenValue = 4;
      primaryServiceUuidVolcano2 = service;
      return bleServerVolcano.getPrimaryService(serviceUuidVolcano3);
    })
    .then((service) => {
      currentThenValue = 5;
      primaryServiceUuidVolcano3 = service;
      return bleServerVolcano.getPrimaryService(serviceUuidVolcano4);
    })
    .then((service) => {
      primaryServiceUuidVolcano4 = service;
      return primaryServiceUuidVolcano1.getCharacteristic(
        "00000003-1989-0108-1234-123456789abc"
      );
    })
    .then((characteristic) => {
      return characteristic.startNotifications().then((_) => {
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleUARTBootloader
        );
      });
    })
    .then((_) => {
      return primaryServiceUuidVolcano1.getCharacteristic(
        "00000002-1989-0108-1234-123456789abc"
      );
    })
    .then((characteristic) => {
      characteristicBootloaderWrite = characteristic;
      return primaryServiceUuidVolcano3.getCharacteristic(
        "10100011-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      codeNumberCharacteristic = characteristic;
      currentThenValue = 7;
      return primaryServiceUuidVolcano3.getCharacteristic(
        "1010000d-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      currentThenValue = 8;
      characteristicPrj2V = characteristic;
      return characteristicPrj2V.readValue();
    })
    .then((value) => {
      let characteristicPrj2Value = convertBLEtoUint16(value);
      evalPrj2Volcano(characteristicPrj2Value);
      if (characteristicPrj2Value & MASK_PRJSTAT2_VOLCANO_ERR)
        deviceHasErrorsV = true;
      currentThenValue = 9;
      return characteristicPrj2V.startNotifications().then((_) => {
        characteristicPrj2V.addEventListener(
          "characteristicvaluechanged",
          handlePrj2ChangedVolcano
        );
      });
    })
    .then((_) => {
      return characteristicPrj2V.readValue();
    })
    .then((value) => {
      aside.classList.add("d-none");
      return primaryServiceUuidVolcano4.getCharacteristic(
        "10110003-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicWriteTempV = characteristic;
      currentThenValue = 10;
      return characteristicWriteTempV.startNotifications().then((_) => {
        characteristicWriteTempV.addEventListener(
          "characteristicvaluechanged",
          handleTargetTemperatureChanged
        );
      });
    })
    .then((_) => {
      return characteristicWriteTempV.readValue();
    })
    .then((value) => {
      let targetTemp = Math.round(convertBLEtoUint16(value) / 10);
      setSollTemperatureVisible(targetTemp);
    })
    .then((service) => {
      return primaryServiceUuidVolcano4.getCharacteristic(
        "10110001-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicCurrTempV = characteristic;
      currentThenValue = 11;
      return characteristicCurrTempV.startNotifications().then((_) => {
        characteristicCurrTempV.addEventListener(
          "characteristicvaluechanged",
          handleCurrTemperatureChangedVolcano
        );
      });
    })
    .then((_) => {
      return characteristicCurrTempV.readValue();
    })
    .then((value) => {
      let currentTemperature = Math.round(convertBLEtoUint16(value) / 10);
      if (currentTemperature < 6536) showCurrentTemperature(currentTemperature);
      currentThenValue = 12;
      return primaryServiceUuidVolcano4.getCharacteristic(
        "1011000f-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicHeaterOnV = characteristic;
    })
    .then((service) => {
      currentThenValue = 13;
      return primaryServiceUuidVolcano4.getCharacteristic(
        "10110010-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicHeaterOffV = characteristic;
    })
    .then((service) => {
      return primaryServiceUuidVolcano4.getCharacteristic(
        "10110014-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      currentThenValue = 14;
      characteristicIsPumpOffV = characteristic;
    })
    .then((service) => {
      return primaryServiceUuidVolcano4.getCharacteristic(
        "10110013-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicVolcanoPumpOn = characteristic;
    })
    .then((service) => {
      currentThenValue = 15;
      return primaryServiceUuidVolcano3.getCharacteristic(
        "10100008-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      return characteristic.readValue();
    })
    .then((value) => {
      let decoder = new TextDecoder("utf-8");
      setSerialNumber(decoder.decode(value).substring(0, 8));
    })
    .then((service) => {
      currentThenValue = 16;
      return primaryServiceUuidVolcano3.getCharacteristic(
        "10100005-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      firmwareVersionCharacteristic = characteristic;
      if (
        typeof characteristicBootloaderWrite.writeValueWithoutResponse ===
        "function"
      )
        browserSupportsWriteWithoutResponse = true;
      else browserSupportsWriteWithoutResponse = false;
    })
    .then((_) => {
      let postStr = "version=true";
      return fetch("firmwareHybrid", {
        method: "post",
        body: new URLSearchParams(postStr),
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (parseInt(data[0].valid) === 1) {
            firmwareFileMajorHybrid = parseInt(data[0].majorApplication);
            firmwareFileMinorHybrid = parseInt(data[0].minorApplication);
          }
        })
        .catch((error) => {
          console.log(error.toString() + "\n" + error.stack);
        });
    })
    .then((_) => {
      return primaryServiceUuidVolcano3.getCharacteristic(
        "10100003-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      currentThenValue = 17;
      return characteristic.readValue();
    })
    .then((value) => {
      let decoder = new TextDecoder("utf-8");
      let firmwareV = decoder.decode(value);
      firmwareLabel.innerText = firmwareV.substring(0, 8);
      var regex = /(\d+)\.?(\d+)\.?(\d+)\.?(\d+)$/;
      var result = regex.exec(firmwareV);
      if (
        result.length < 3 ||
        firmwareFileMajorHybrid != result[1] ||
        !checkVersionIsGreater(firmwareFileMinorHybrid, result[2]) ||
        browserSupportsWriteWithoutResponse == false
      ) {
        startUpdate.disabled = true;
        firmwareUpdateLiItem.classList.add("d-none");
      } else {
        startUpdate.disabled = false;
        firmwareUpdateLiItem.classList.remove("d-none");
        var element = document.getElementById("firmwareUpdateText");
        element.innerHTML =
          "The firmware of your VOLCANO HYBRID is outdated. The update will restart your VOLCANO HYBRID: please reconnect to finish the firmware update." +
          "The device can not be used during the update and must stay connected to the power grid.";
        firmwareUpdateIgnore.style.visibility = "visible";
        $("#firmwareUpdateModal").removeData("bs.modal").modal({
          backdrop: true,
        });
        $("#firmwareUpdateModal").modal("show");
      }
    })
    .then((characteristic) => {
      currentThenValue = 18;
      return primaryServiceUuidVolcano3.getCharacteristic(
        "10100001-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      return characteristic.readValue();
    })
    .then((value) => {
      let decoder = new TextDecoder("utf-8");
      let bootloaderV = decoder.decode(value);
      if (bootloaderV.includes("BL"))
        if (browserSupportsWriteWithoutResponse == false) {
          alert(
            "Your VOLCANO HYBRID is in firmware update mode: but your browser does not support the firmware update. Please use a compatible browser to finish the firmware update. We recommend using Bluefy for iOS or Chrome for Android, Mac and Windows."
          );
          firmwareUpdateLiItem.classList.add("d-none");
          startUpdate.disabled = true;
        } else {
          var element = document.getElementById("firmwareUpdateText");
          element.innerHTML =
            "Your VOLCANO HYBRID is in firmware update mode: please finish the firmware update.";
          firmwareUpdateLiItem.classList.remove("d-none");
          startUpdate.disabled = false;
          firmwareUpdateIgnore.style.visibility = "hidden";
          $("#firmwareUpdateModal").removeData("bs.modal").modal({
            backdrop: "static",
          });
          $("#firmwareUpdateModal").modal("show");
        }
      else firmwareUpdateLiItem.classList.add("d-none");
      currentThenValue = 19;
    })
    .then((service) => {
      return primaryServiceUuidVolcano3.getCharacteristic(
        "10100004-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      return characteristic.readValue();
    })
    .then((value) => {
      currentThenValue = 20;
      let decoder = new TextDecoder("utf-8");
      let firmwareBLEVersion = decoder.decode(value);
      firmwareBLEVersionV.innerText = firmwareBLEVersion;
    })
    .then((service) => {
      return primaryServiceUuidVolcano4.getCharacteristic(
        "1011000c-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicCurrentAutoOffTimeVolcano = characteristic;
      currentThenValue = 21;
      return characteristic.startNotifications().then((_) => {
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleCurrentAutoOffTimeVolcano
        );
      });
    })
    .then((_) => {
      return characteristicCurrentAutoOffTimeVolcano.readValue();
    })
    .then((value) => {
      autoOffTimeVolcano = convertBLEtoUint16(value);
      return primaryServiceUuidVolcano4.getCharacteristic(
        "10110015-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicHeatHoursChangedVolcano = characteristic;
      currentThenValue = 22;
      return characteristic.startNotifications().then((_) => {
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleHeatHoursChangedVolcano
        );
      });
    })
    .then((_) => {
      return characteristicHeatHoursChangedVolcano.readValue();
    })
    .then((value) => {
      useHoursHeatVolcano = convertBLEtoUint16(value);
      return primaryServiceUuidVolcano4.getCharacteristic(
        "10110016-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicHeatMinutesChangedVolcano = characteristic;
      currentThenValue = 23;
      return characteristic.startNotifications().then((_) => {
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleHeatMinutesChangedVolcano
        );
      });
    })
    .then((_) => {
      return characteristicHeatMinutesChangedVolcano.readValue();
    })
    .then((value) => {
      useMinutesHeatVolcano = convertBLEtoUint16(value);
      updateHoursLabel();
      return primaryServiceUuidVolcano3.getCharacteristic(
        "1010000c-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicPrj1V = characteristic;
      currentThenValue = 24;
      return characteristicPrj1V.startNotifications().then((_) => {
        characteristicPrj1V.addEventListener(
          "characteristicvaluechanged",
          handlePrj1ChangedVolcano
        );
      });
    })
    .then((_) => {
      return characteristicPrj1V.readValue();
    })
    .then((value) => {
      let characteristicPrj1Value = convertBLEtoUint16(value);
      evalPrj1Volcano(characteristicPrj1Value);
      if (characteristicPrj1Value & MASK_PRJSTAT1_VOLCANO_ERR)
        deviceHasErrorsV = true;
    })
    .then((service) => {
      currentThenValue = 25;
      return primaryServiceUuidVolcano3.getCharacteristic(
        "1010000e-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicPrj3V = characteristic;
      return characteristic.readValue();
    })
    .then((value) => {
      let currentVal = convertBLEtoUint16(value);
      if ((currentVal & MASK_PRJSTAT3_VOLCANO_VIBRATION) == 0)
        vibrationToggleVolcano.checked = true;
      else vibrationToggleVolcano.checked = false;
      currentThenValue = 26;
    })
    .then((service) => {
      return primaryServiceUuidVolcano3.getCharacteristic(
        "10100015-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicHist1 = characteristic;
      return primaryServiceUuidVolcano3.getCharacteristic(
        "10100016-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicHist2 = characteristic;
      currentThenValue = 27;
      return primaryServiceUuidVolcano4.getCharacteristic(
        "1011000d-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicVolcanoShutOff = characteristic;
      return characteristicVolcanoShutOff.readValue();
    })
    .then((value) => {
      shutOffTimeVolcano = convertBLEtoUint16(value) / 60;
      shutoff.value = shutOffTimeVolcano;
      shutOffLabel.innerText = shutOffTimeVolcano + " min";
      currentThenValue = 28;
    })
    .then((service) => {
      return primaryServiceUuidVolcano4.getCharacteristic(
        "10110005-5354-4f52-5a26-4249434b454c"
      );
    })
    .then((characteristic) => {
      characteristicLedBrightnessV = characteristic;
      return characteristicLedBrightnessV.readValue();
    })
    .then((value) => {
      ledBrightness = convertBLEtoUint16(value);
      brightness.value = ledBrightness;
      currentThenValue = 29;
      $("#waitModal").modal("hide");
      if (deviceHasErrorsV == true) startAnalysisVolcanoFunc();
    })
    .catch((error) => {
      eventsVolcano(false);
      if (error.toString().includes("User cancelled"))
        $("#waitModal").modal("hide");
      else {
        $("#waitModal").modal("hide");
        alert(
          "Bluetooth connection error HYBRID: please reload and retry.\n" +
            error.toString() +
            "\n" +
            error.stack +
            "\n" +
            currentThenValue
        );
      }
    });
}
function onPlusButtonMouseDownVolcano() {
  if (whichDeviceConnected() == devices.Hybrid) {
    if (myTimerSetTempHandler !== 0) window.clearTimeout(myTimerSetTempHandler);
    myTimerSetTempHandler = window.setTimeout(myTimerSet, timeInMilliSeconds);
    if (isCelsiusActive() == true) setSollTemperatureVisible(SOLLTEMP + 1);
    else setSollTemperatureVisible(SOLLTEMP + 1 / 1.8);
    timerPlusButtonMouseDown = easingTimeout(1e3, function () {
      if (myTimerSetTempHandler !== 0)
        window.clearTimeout(myTimerSetTempHandler);
      myTimerSetTempHandler = window.setTimeout(myTimerSet, timeInMilliSeconds);
      if (isCelsiusActive() == true) setSollTemperatureVisible(SOLLTEMP + 1);
      else setSollTemperatureVisible(SOLLTEMP + 1 / 1.8);
    });
  }
}
function onPlusButtonMouseUpVolcano() {
  if (whichDeviceConnected() == devices.Hybrid) {
    timerPlusButtonMouseDown.clear();
    return false;
  }
}
function onMinusButtonMouseDownVolcano() {
  if (whichDeviceConnected() == devices.Hybrid) {
    if (myTimerSetTempHandler !== 0) window.clearTimeout(myTimerSetTempHandler);
    myTimerSetTempHandler = window.setTimeout(myTimerSet, timeInMilliSeconds);
    if (isCelsiusActive() == true) setSollTemperatureVisible(SOLLTEMP - 1);
    else setSollTemperatureVisible(SOLLTEMP - 1 / 1.8);
    timerMinusButtonMouseDown = easingTimeout(1e3, function () {
      if (myTimerSetTempHandler !== 0)
        window.clearTimeout(myTimerSetTempHandler);
      myTimerSetTempHandler = window.setTimeout(myTimerSet, timeInMilliSeconds);
      if (isCelsiusActive() == true) setSollTemperatureVisible(SOLLTEMP - 1);
      else setSollTemperatureVisible(SOLLTEMP - 1 / 1.8);
    });
  }
}
function onMinusButtonMouseUpVolcano() {
  if (whichDeviceConnected() == devices.Hybrid) {
    timerMinusButtonMouseDown.clear();
    return false;
  }
}
function onHeatClickVolcano() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = convertToUInt8BLE(0);
    if (isVolcanoOn == false) {
      setBleProcessPending(true);
      setVisualVolcanoActive(true);
      characteristicHeaterOnV
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          setVisualVolcanoActive(false);
          showError(error);
          setBleProcessPending(false);
        });
    } else {
      setVisualVolcanoActive(false);
      setBleProcessPending(true);
      characteristicHeaterOffV
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          setBleProcessPending(false);
          showError(error);
        });
    }
  }
}
function setVisualStatePumpVolcano(state) {
  if (state == true) {
    isPumpOnVolcano = true;
    document.getElementById("airImg").src = "img/air-1.svg";
  } else {
    isPumpOnVolcano = false;
    document.getElementById("airImg").src = "img/air-0.svg";
  }
}
function onAirClickVolcano() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = convertToUInt8BLE(0);
    if (isPumpOnVolcano != true) {
      setVisualStatePumpVolcano(true);
      setBleProcessPending(true);
      characteristicVolcanoPumpOn
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          showError(error);
          setBleProcessPending(false);
        });
    } else {
      setVisualStatePumpVolcano(false);
      setBleProcessPending(true);
      characteristicIsPumpOffV
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          setBleProcessPending(false);
          showError(error);
        });
    }
  }
}
function handleCurrTemperatureChangedVolcano(event) {
  let currentTemperature = Math.round(
    convertBLEtoUint16(event.target.value) / 10
  );
  if (currentTemperature < 6536) showCurrentTemperature(currentTemperature);
}
function showCurrentTemperature(temperature) {
  currentTemperatureVolcano = temperature;
  if (isCelsiusActive() == true)
    istTempLabel.innerText =
      Math.round(currentTemperatureVolcano).toString() + "\u00b0C";
  else
    istTempLabel.innerText =
      Math.round(
        convertToFahrenheitFromCelsius(currentTemperatureVolcano)
      ).toString() + "\u00b0F";
}
function writeSollTemperatureHybrid(val) {
  if (whichDeviceConnected() == devices.Hybrid) {
    let buffer = convertToUInt32BLE(val * 10);
    if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
      setBleProcessPending(true);
      characteristicWriteTempV
        .writeValue(buffer)
        .then((service) => {
          currentThenValue = 48;
          setBleProcessPending(false);
          setTemperatureWillChangeViaBLE_RESET();
        })
        .catch((error) => {
          setBleProcessPending(false);
          setTemperatureWillChangeViaBLE_RESET();
          showError(error);
        });
    }
  }
}
function setVisualVolcanoActive(ena) {
  if (ena == true) {
    isVolcanoOn = true;
    border.style.borderTopColor = "#ff6600";
    volcanoSchriftzug.src = "img/v-logo-power-1.svg";
    document.getElementById("heatImg").src = "img/heat-1.svg";
  } else {
    isVolcanoOn = false;
    border.style.borderTopColor = " #373737";
    volcanoSchriftzug.src = "img/v-logo-power-0.svg";
    timerObject.classList.add("d-none");
    document.getElementById("heatImg").src = "img/heat-0.svg";
  }
}
function writeBrightnessVolcano() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    ledBrightness = brightness.value;
    let buffer = convertToUInt16BLE(ledBrightness);
    setBleProcessPending(true);
    characteristicLedBrightnessV
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
function writeAutoOffCountdownVolcano() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    shutOffLabel.innerText = shutoff.value + " min";
    let buffer = convertToUInt16BLE(shutoff.value * 60);
    setBleProcessPending(true);
    characteristicVolcanoShutOff
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        setBleProcessPending(false);
        showError(error);
      })
      .catch((error) => {
        setBleProcessPending(false);
        showError(error);
      });
  }
}
function handleTargetTemperatureChanged(event) {
  let setTemperature = Math.round(convertBLEtoUint16(event.target.value) / 10);
  setSollTemperatureVisible(setTemperature);
}
function clickOnTempLabelClickVolcano() {
  if (whichDeviceConnected() == devices.Hybrid)
    if (isCelsiusActive() == true)
      projectRegister2ChangeBit(65536 + MASK_PRJSTAT2_VOLCANO_FAHRENHEIT_ENA);
    else projectRegister2ChangeBit(MASK_PRJSTAT2_VOLCANO_FAHRENHEIT_ENA);
}
function evalPrj1Volcano(currentVal) {
  if ((currentVal & MASK_PRJSTAT1_VOLCANO_HEIZUNG_ENA) == 0)
    setVisualVolcanoActive(false);
  else setVisualVolcanoActive(true);
  if ((currentVal & MASK_PRJSTAT1_VOLCANO_PUMPE_FET_ENABLE) == 0)
    setVisualStatePumpVolcano(false);
  else setVisualStatePumpVolcano(true);
  if ((currentVal & MASK_PRJSTAT1_VOLCANO_ENABLE_AUTOBLESHUTDOWN) == 0);
  else timerObject.classList.remove("d-none");
}
function evalPrj2Volcano(currentVal) {
  if ((currentVal & MASK_PRJSTAT2_VOLCANO_FAHRENHEIT_ENA) == 0)
    setCelsiusActive(true);
  else setCelsiusActive(false);
  showCurrentTemperature(currentTemperatureVolcano);
  setSollTemperatureVisible(SOLLTEMP);
  if ((currentVal & MASK_PRJSTAT2_VOLCANO_DISPLAY_ON_COOLING) == 0)
    displayOnCoolingToggleVolcano.checked = true;
  else displayOnCoolingToggleVolcano.checked = false;
}
function handlePrj1ChangedVolcano(event) {
  let currentVal = convertBLEtoUint16(event.target.value);
  evalPrj1Volcano(currentVal);
}
function handleHeatMinutesChangedVolcano(event) {
  useMinutesHeatVolcano = convertBLEtoUint16(event.target.value);
  updateHoursLabel();
}
function handleHeatHoursChangedVolcano(event) {
  useHoursHeatVolcano = convertBLEtoUint16(event.target.value);
  updateHoursLabel();
}
function updateHoursLabel() {
  useHoursLabel.innerText =
    useHoursHeatVolcano + "h " + useMinutesHeatVolcano + "m";
}
function handlePrj2ChangedVolcano(event) {
  let currentVal = convertBLEtoUint16(event.target.value);
  evalPrj2Volcano(currentVal);
}
function handleCurrentAutoOffTimeVolcano(event) {
  let tempVal = convertBLEtoUint16(event.target.value);
  if (autoOffTimeVolcano !== tempVal) {
    autoOffTimeVolcano = tempVal;
    let val = Math.round((autoOffTimeVolcano / 60 / shutOffTimeVolcano) * 100);
    document.getElementById("timerInSec").innerText =
      Math.round(autoOffTimeVolcano / 60) + " min";
    document.getElementById("timer").style.width = tempVal + "%";
  }
}
function onVolcanoSchriftzugClick() {
  if (!isBleProcessPendingWithoutAlert_Repeat()) {
    var buffer = convertToUInt8BLE(0);
    if (isVolcanoOn == false) {
      setVisualVolcanoActive(true);
      setBleProcessPending(true);
      characteristicHeaterOnV
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          setVisualVolcanoActive(false);
          showError(error);
          setBleProcessPending(false);
        });
    } else {
      setVisualVolcanoActive(false);
      setBleProcessPending(true);
      characteristicHeaterOffV
        .writeValue(buffer)
        .then((service) => {
          setBleProcessPending(false);
        })
        .catch((error) => {
          setBleProcessPending(false);
          showError(error);
        });
    }
  }
}
function vibrationToggleVolcanoHandler() {
  if (!vibrationToggleVolcano.checked)
    projectRegister3ChangeBit(65536 + MASK_PRJSTAT3_VOLCANO_VIBRATION);
  else projectRegister3ChangeBit(MASK_PRJSTAT3_VOLCANO_VIBRATION);
}
function displayOnCoolingToggleVolcanoHandler() {
  if (!isBleProcessPendingWithoutAlert_Repeat())
    if (displayOnCoolingToggleVolcano.checked)
      projectRegister2ChangeBit(MASK_PRJSTAT2_VOLCANO_DISPLAY_ON_COOLING);
    else
      projectRegister2ChangeBit(
        65536 + MASK_PRJSTAT2_VOLCANO_DISPLAY_ON_COOLING
      );
}
function projectRegister2ChangeBit(val) {
  if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
    let buffer = convertToUInt32BLE(val);
    setBleProcessPending(true);
    characteristicPrj2V
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        setBleProcessPending(false);
        showError(error);
      });
  }
}
function projectRegister3ChangeBit(val) {
  if (!isBleProcessPendingWithoutAlert_Repeat(arguments[0])) {
    let buffer = convertToUInt32BLE(val);
    setBleProcessPending(true);
    characteristicPrj3V
      .writeValue(buffer)
      .then((service) => {
        setBleProcessPending(false);
      })
      .catch((error) => {
        setBleProcessPending(false);
        showError(error);
      });
  }
}
function setSollTemperatureVisible(temperature) {
  let MAX_CELSIUS_TEMP = 230;
  let MIN_CELSIUS_TEMP = 40;
  if (temperature <= MAX_CELSIUS_TEMP && temperature >= MIN_CELSIUS_TEMP)
    SOLLTEMP = temperature;
  if (isCelsiusActive() == true)
    document.getElementById("sollTemp").innerText =
      Math.round(SOLLTEMP).toString() + "\u00b0C";
  else
    document.getElementById("sollTemp").innerText =
      convertToFahrenheitFromCelsius(SOLLTEMP).toString() + "\u00b0F";
}
