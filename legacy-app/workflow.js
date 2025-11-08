/*
 STORZ & BICKEL Web App v3.4.0 (https://app.storz-bickel.com)
STORZ & BICKEL ? 2020-2025
Unauthorized copying of this file via any medium is prohibited.
Written by STORZ & BICKEL GmbH
*/
let timerHandlerAir;
let timerHandlerHeat;
let timerHandlerWorkflow;
let timerHandlerProofTemp;
let timerHandlerHold;
function resetAllWorkflowButtons() {
  document.getElementById("wf-0-img").src = "img/play-0.svg";
  document.getElementById("wf-1-img").src = "img/play-0.svg";
  document.getElementById("wf-2-img").src = "img/play-0.svg";
  document.getElementById("wf-3-img").src = "img/play-0.svg";
  clearTimeout(timerHandlerAir);
  clearTimeout(timerHandlerHeat);
  clearTimeout(timerHandlerWorkflow);
  clearTimeout(timerHandlerProofTemp);
  clearTimeout(timerHandlerHold);
}
let workflow_temperature = [];
let workflow_holdTimeInMilliSeconds = [];
let workflow_pumpTimeInMilliSeconds = [];
let workflow_state = 0;
let startTime = 0;
let workflow0_temperature = [
  170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220,
];
let workflow0_holdTimeInMilliSeconds = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let workflow0_pumpTimeInMilliSeconds = [
  5e3, 5e3, 5e3, 5e3, 5e3, 5e3, 5e3, 5e3, 5e3, 5e3, 5e3,
];
let workflow1_temperature = [182, 192, 201, 220];
let workflow1_holdTimeInMilliSeconds = [1e4, 7e3, 5e3, 3e3];
let workflow1_pumpTimeInMilliSeconds = [1e4, 12e3, 1e4, 1e4];
let workflow2_temperature = [175, 180, 185, 190, 195];
let workflow2_holdTimeInMilliSeconds = [0, 0, 0, 0, 0];
let workflow2_pumpTimeInMilliSeconds = [7e3, 7e3, 7e3, 7e3, 1e4];
let workflow3_temperature = [174, 199, 213, 222];
let workflow3_holdTimeInMilliSeconds = [2e4, 0, 0, 0];
let workflow3_pumpTimeInMilliSeconds = [8e3, 2e4, 1e4, 1e4];
function proofTempPart_workflow() {
  console.log(
    Math.floor((Date.now() - startTime) / 1e3) +
      " proofTempPart_workflow state: " +
      workflow_state +
      "  workflow_holdTimeInMilliSeconds: " +
      workflow_holdTimeInMilliSeconds[workflow_state]
  );
  if (
    currentTemperatureVolcano >= SOLLTEMP - 1 &&
    currentTemperatureVolcano < SOLLTEMP + 1
  ) {
    console.log("proofTempPart_workflow temperture reached");
    if (workflow_temperature.length > workflow_state)
      timerHandlerHold = window.setTimeout(
        volcanoPumpInMilliseconds_workflow,
        workflow_holdTimeInMilliSeconds[workflow_state]
      );
    else {
      onWorkflowClick();
      console.log("stop workflow");
    }
  } else
    timerHandlerProofTemp = window.setTimeout(proofTempPart_workflow, 1500);
}
function volcanoPumpInMilliseconds_workflow() {
  let time = workflow_pumpTimeInMilliSeconds[workflow_state];
  if (time == 0) time = 500;
  console.log(
    Math.floor((Date.now() - startTime) / 1e3) +
      " volcanoPumpInMilliseconds " +
      time +
      "[ms]"
  );
  onAirClickVolcano();
  timerHandlerAir = window.setTimeout(workFlow_nextState, time);
}
function workFlow_nextState() {
  console.log(
    Math.floor((Date.now() - startTime) / 1e3) +
      " workFlow_nextState state: " +
      workflow_state
  );
  onAirClickVolcano();
  workflow_state = workflow_state + 1;
  setSollTemperatureVisible(workflow_temperature[workflow_state]);
  timerHandlerHeat = window.setTimeout(
    writeSollTemperatureHybrid,
    750,
    SOLLTEMP
  );
  timerHandlerHold = window.setTimeout(proofTempPart_workflow, 1500);
}
function onWorkflowClick(workflowNb) {
  if (workFlowState == true) {
    workFlowState = false;
    resetAllWorkflowButtons();
    if (isVolcanoHeaterOn()) onHeatClickVolcano();
    if (isVolcanoPumpOn()) onAirClickVolcano();
  } else {
    workFlowState = true;
    if (workflowNb == 0) {
      document.getElementById("wf-0-img").src = "img/play-1.svg";
      workflow_temperature = workflow0_temperature;
      workflow_holdTimeInMilliSeconds = workflow0_holdTimeInMilliSeconds;
      workflow_pumpTimeInMilliSeconds = workflow0_pumpTimeInMilliSeconds;
    } else if (workflowNb == 1) {
      document.getElementById("wf-1-img").src = "img/play-1.svg";
      workflow_temperature = workflow1_temperature;
      workflow_holdTimeInMilliSeconds = workflow1_holdTimeInMilliSeconds;
      workflow_pumpTimeInMilliSeconds = workflow1_pumpTimeInMilliSeconds;
    } else if (workflowNb == 2) {
      document.getElementById("wf-2-img").src = "img/play-1.svg";
      workflow_temperature = workflow2_temperature;
      workflow_holdTimeInMilliSeconds = workflow2_holdTimeInMilliSeconds;
      workflow_pumpTimeInMilliSeconds = workflow2_pumpTimeInMilliSeconds;
    } else if (workflowNb == 3) {
      document.getElementById("wf-3-img").src = "img/play-1.svg";
      workflow_temperature = workflow3_temperature;
      workflow_holdTimeInMilliSeconds = workflow3_holdTimeInMilliSeconds;
      workflow_pumpTimeInMilliSeconds = workflow3_pumpTimeInMilliSeconds;
    } else console.log("not allowed");
    startTime = Date.now();
    workflow_state = 0;
    setSollTemperatureVisible(workflow_temperature[workflow_state]);
    writeSollTemperatureHybrid(SOLLTEMP);
    timerHandlerHeat = window.setTimeout(onHeatClickVolcano, 1e3);
    proofTempPart_workflow();
  }
}
function onWorkflowClick0() {
  onWorkflowClick(0);
}
function onWorkflowClick1() {
  onWorkflowClick(1);
}
function onWorkflowClick2() {
  onWorkflowClick(2);
}
function onWorkflowClick3() {
  onWorkflowClick(3);
}
