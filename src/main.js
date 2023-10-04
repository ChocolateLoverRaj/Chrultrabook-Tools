import { appWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/tauri";
import { enable, isEnabled, disable } from "tauri-plugin-autostart-api";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import "chartjs-plugin-dragdata";
import "./styles.css";

//prevents rightclick
document.addEventListener("contextmenu", (event) => event.preventDefault());

var is_windows;
setTimeout(async () => {
  is_windows = await invoke("is_windows");
  console.log(is_windows);
});

//hides things currently incopatiable with linux

//start Hidden
const hideOnStart = localStorage.getItem("startHidden");
if (hideOnStart == "yes") {
  appWindow.hide();
  startHiddenInput.checked = true;
}

//app close and open functions
document.getElementById("close").addEventListener("mousedown", () => {
  let addToTray = localStorage.getItem("quitToTray");
  if (addToTray == "yes") {
    appWindow.hide();
    systemTrayInput.checked = true;
  } else {
    appWindow.close();
  }
});

document
  .getElementById("minimize")
  .addEventListener("mousedown", () => appWindow.minimize());

//function to check if a number exist
function containsNumber(str) {
  return /\d/.test(str);
}
//checks if fan exists
const fanExist = await invoke("get_fan_rpm");
let fan = !!containsNumber(fanExist);
if (!fan) {
  document.getElementById("fan").style.display = "none";
}
//sets current percantage for backlight and hides the slider if computer has no backlight
setTimeout(async () => {
  let keyboardBackLight = await invoke("ectool", {
    value: "pwmgetkblight",
    value2: "",
  });
  let value = keyboardBackLight.split(" ");
  document.getElementById("backlightRangeSlider").value = value[4];
  if (containsNumber(value[4]) == false) {
    document.getElementById("rangeBacklight").style.display = "none";
    document.getElementById("rangeBacklightslider").style.display = "none";
  }

  //prevents laptops with no backlight form using this
  if (value[4] !== "0") {
    document.getElementById("backlightRangeSliderText").innerText = value[4];
  } else {
    document.getElementById("backlightRangeSliderText").innerText = "off";
  }
}, 0);

//homepage
var averageTemp;
setInterval(async () => {
  const ramUsage = await invoke("get_ram_usage");
  const cpuUsage = await invoke("get_cpu_usage");
  document.getElementById("ramPercentage").innerText = ramUsage + "%";
  document.getElementById("cpuLoad").innerText = cpuUsage + "%";

  //cpu temps
  const cpuTempFunction = await invoke("get_cpu_temp");
  let sensors = 0;
  let temps = 0;
  cpuTempFunction.split("\n").forEach((line) => {
    const num = line.split("C)")[0].trim().split(" ").pop().trim();
    if (num && !isNaN(num)) {
      temps += parseFloat(num);
      sensors++;
    }
  });
  averageTemp = temps / sensors;
  document.getElementById("cpuTemp").innerText = averageTemp.toFixed(0) + "°C";
  document.getElementById("cpuTempFan").innerText =
    averageTemp.toFixed(0) + "°C";
}, 1000);
if (fan == true) {
  setInterval(async () => {
    const fanRPM = await invoke("get_fan_rpm");
    const fanSpeed = fanRPM.toString().split(":").pop().trim();
    document.getElementById("fanSpeed").innerText = fanSpeed + " RPM";
  }, 1000);
  setTimeout(async () => {
    let fanCurve = localStorage.getItem("customfanCurves");
    let fanCurveData = JSON.parse(fanCurve);
    //adds chart for new installs/users
    if (fanCurveData == null) {
      let defaultChart = [0, 0, 50, 90, 100, 100, 100];
      myChart.config.data.datasets[0].data = defaultChart;
    } else {
      myChart.config.data.datasets[0].data = fanCurveData;
    }
  }, 0);
}

setTimeout(async () => {
  const hostname = await invoke("get_hostname");
  const bios = await invoke("get_bios_version");
  const boardname = await invoke("get_board_name");
  const cores = await invoke("get_cpu_cores");
  const cpuname = await invoke("get_cpu_name");
  document.getElementById("biosVersion").innerText = "Bios Version: " + bios;
  document.getElementById("boardname").innerText = "Boardname: " + boardname;
  document.getElementById("coreCPU").innerText = "Cores: " + cores + " Cores";
  document.getElementById("hostname").innerText = "Hostname: " + hostname;
  document.getElementById("cpuName").innerText = "CPU: " + cpuname;

  //shows or hides activity light settings based on boardname (only shows to Candy and Kefka)
  if(boardname !== "Candy" && boardname !== "Kefka" && boardname !== "Vayne")
  {
    document.getElementById("ActivityLight").style.display = "none";
    document.getElementById("keyboardBacklight").classList.add("afterCheck");
  }

}, 0);
//setFanSpeeds
//fan chart
const data = {
  labels: ["35°C", "40°C", "45°C", "50°C", "55°C", "60°C"],
  datasets: [
    {
      label: "Fan Speed",
      data: [0, 0, 50, 90, 100, 100, 100],
      backgroundColor: [
        "rgba(255, 26, 104, 0.2)",
        "rgba(54, 162, 235, 0.2)",
        "rgba(255, 206, 86, 0.2)",
        "rgba(75, 192, 192, 0.2)",
        "rgba(153, 102, 255, 0.2)",
        "rgba(255, 159, 64, 0.2)",
        "rgba(0, 0, 0, 0.2)",
      ],
      borderColor: [
        "rgba(255, 26, 104, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 206, 86, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(153, 102, 255, 1)",
        "rgba(255, 159, 64, 1)",
        "rgba(0, 0, 0, 1)",
      ],
      borderWidth: 1,
      dragData: true,
      pointHitRadius: 26,
    },
  ],
};
//chart config
const config = {
  type: "line",
  data: data,
  dragData: true,
  legend: {
    display: false,
  },
  dragData: true,
  options: {
    tension: 0.2,
    legend: false,
    plugins: {
      dragData: {
        round: 0,
        showTooltip: true,
        onDragStart: (event) => {},
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Fan Speed In Percentage",
        },
      },
      x: {
        title: {
          display: true,
          text: "CPU Temperature",
        },
      },
    },
  },
};
//render chart
const myChart = new Chart(document.getElementById("fancurves"), config);
myChart.update();

let autoFan = document.getElementById("fanAuto");
let offFan = document.getElementById("fanOff");
let maxFan = document.getElementById("fanMax");
let setFan = document.getElementById("setFan");

function setTemps() {
  var cpuTemp = parseInt(averageTemp);

  if (cpuTemp <= 35) {
    invoke("ectool", { value: "fanduty", value2: "0" });
    return;
  }
  if (cpuTemp >= 60) {
    invoke("ectool", { value: "fanduty", value2: "100" });
    return;
  }
  let base = cpuTemp - 35;
  const percentage = [1, 0.2, 0.4, 0.6, 0.8][base % 5];
  let index = (base - (base % 5)) / 5;
  let temp = myChart.data.datasets[0].data[index];
  index++;
  let temp2 = myChart.data.datasets[0].data[index];

  var tempBetween;
  if (cpuTemp % 5 == 0) {
    index--;
    tempBetween = myChart.data.datasets[0].data[index];
  } else {
    tempBetween = (temp2 - temp) * percentage + temp;
  }
  invoke("ectool", { value: "fanduty", value2: tempBetween.toString() });
}
var clearcustomFan;

//starts fans if avaliable
const fanOnStart = localStorage.getItem("fanOnStart");
if (fanOnStart == "yes") {
  startupFansInput.checked = true;
  clearcustomFan = setInterval(async () => {
    setTemps();
  }, 2000);
}

function customFan() {
  autoFan.classList.remove("activeButton");
  offFan.classList.remove("activeButton");
  maxFan.classList.remove("activeButton");
  setFan.classList.add("activeButton");
  clearInterval(clearcustomFan);
  clearcustomFan = setInterval(async () => {
    setTemps();
  }, 2000);
  //save to local storage
  const toSave = JSON.stringify(myChart.data.datasets[0].data);
  localStorage.setItem("customfanCurves", toSave);
}
function fanMax() {
  autoFan.classList.remove("activeButton");
  offFan.classList.remove("activeButton");
  maxFan.classList.add("activeButton");
  setFan.classList.remove("activeButton");
  clearInterval(clearcustomFan);

  //changes chart
  const fanMaxArray = [100, 100, 100, 100, 100, 100, 100];
  myChart.config.data.datasets[0].data = fanMaxArray;
  myChart.update();
  clearcustomFan = setInterval(async () => {
    setTemps();
  }, 2000);
}
function fanOff() {
  invoke("ectool", { value: "fanduty", value2: "0" });
  autoFan.classList.remove("activeButton");
  offFan.classList.add("activeButton");
  maxFan.classList.remove("activeButton");
  setFan.classList.remove("activeButton");
  clearInterval(clearcustomFan);

  //changes chart
  const fanOffArray = [0, 0, 0, 0, 0, 0, 100];
  myChart.config.data.datasets[0].data = fanOffArray;
  myChart.update();
  clearcustomFan = setInterval(async () => {
    setTemps();
  }, 2000);
}
function fanAuto() {
  invoke("ectool", { value: "autofanctrl", value2: "" });
  autoFan.classList.add("activeButton");
  offFan.classList.remove("activeButton");
  maxFan.classList.remove("activeButton");
  setFan.classList.remove("activeButton");
  clearInterval(clearcustomFan);

  //changes chart
  const fanAutoArray = [0, 0, 50, 90, 100, 100, 100];
  myChart.config.data.datasets[0].data = fanAutoArray;
  myChart.update();
  clearcustomFan = setInterval(async () => {
    setTemps();
  }, 2000);
}

const buttonfanMax = document.getElementById("fanMax");
buttonfanMax.addEventListener("mousedown", () => fanMax());

const buttonfanOff = document.getElementById("fanOff");
buttonfanOff.addEventListener("mousedown", () => fanOff());

const buttonfanAuto = document.getElementById("fanAuto");
buttonfanAuto.addEventListener("mousedown", () => fanAuto());

const buttonCustomFan = document.getElementById("setFan");
buttonCustomFan.addEventListener("mousedown", () => customFan());

//system options
//activity light


const selectedActivityLight = document.querySelector(".selectedActivityLight");
async function activityLight(){
  switch(selectedActivityLight.innerText) {
    case "Off":
      console.log("off");
    break;
    case "Red":
      console.log("Red");
    break;
    case "Green":
      console.log("Green");
    break;
    case "Blue":
      console.log("Blue");
    break;
    case "White":
      console.log("White");
    break;
    case "Cyan":
      console.log("Cyan");
    break;
    case "Magenta":
      console.log("Magenta");
    break;
    case "Yellow":
      console.log("Yellow");
    break;
  }
}
const activityLightColor = document.getElementById("activityLightMenu");
activityLightColor.addEventListener("mousedown", () => activityLight());


//keyboard backlight slider
let sliderBacklight = document.getElementById("backlightRangeSlider");
let outputBacklight = document.getElementById("backlightRangeSliderText");
outputBacklight.innerHTML = sliderBacklight.value;
//sends infrom from html to ec

sliderBacklight.oninput = function () {
  outputBacklight.innerText = this.value === "0" ? "off" : this.value;
  invoke("ectool", { value: "pwmsetkblight", value2: sliderBacklight.value });
  //changes text color
  document.getElementById("key").style.filter =
    sliderBacklight.value < 25 || this.value === "0"
      ? "opacity(25%)"
      : "opacity(" + sliderBacklight.value + "%)";
};

//sends info from ec to html
const selected = document.querySelector(".selected");
async function getSystemInfo() {
  switch (selected.innerText) {
    case "Boot Timestamps":
      document.getElementById("cbMemInfo").innerText = await invoke("cbmem", {
        value: "-t",
      });
      break;
    case "Coreboot Log":
      document.getElementById("cbMemInfo").innerText = await invoke("cbmem", {
        value: "-c1",
      });
      break;
    case "Coreboot Extended Log":
      document.getElementById("cbMemInfo").innerText = await invoke("cbmem", {
        value: "-c",
      });
      break;
    case "EC Console Log":
      document.getElementById("cbMemInfo").innerText = await invoke("ectool", {
        value: "console",
        value2: "",
      });
      break;
    case "Battery Info":
      document.getElementById("cbMemInfo").innerText = await invoke("ectool", {
        value: "battery",
        value2: "",
      });
      break;
    case "EC Chip Info":
      document.getElementById("cbMemInfo").innerText = await invoke("ectool", {
        value: "chipinfo",
        value2: "",
      });
      break;
    case "SPI Info":
      document.getElementById("cbMemInfo").innerText = await invoke("ectool", {
        value: "flashspiinfo",
        value2: "",
      });
      break;
    case "EC Protocol Info":
      document.getElementById("cbMemInfo").innerText = await invoke("ectool", {
        value: "protoinfo",
        value2: "",
      });
      break;
    case "Temp Sensor Info":
      document.getElementById("cbMemInfo").innerText = await invoke("ectool", {
        value: "tempsinfo",
        value2: "all",
      });
      break;
    case "Power Delivery Info":
      document.getElementById("cbMemInfo").innerText = await invoke("ectool", {
        value: "pdlog",
        value2: "",
      });
      break;
    default:
      document.getElementById("cbMemInfo").innerText = "Select Something";
  }
}

//copy
const buttoncbMem = document.getElementById("cbMem");
buttoncbMem.addEventListener("mousedown", () => getSystemInfo());

function copyTxt(htmlElement) {
  if (!htmlElement) return;

  let elementText = htmlElement.innerText;

  let inputElement = document.createElement("input");
  inputElement.setAttribute("value", elementText);
  document.body.appendChild(inputElement);
  inputElement.select();
  document.execCommand("copy");
  inputElement.parentElement.removeChild(inputElement);
}
document.querySelector("#copyButton").addEventListener("mousedown", () => {
  copyTxt(document.querySelector("#cbMemInfo"));
});

//settings
const startupFan = document.getElementById("startupFansInput");
const systemTray = document.getElementById("systemTrayInput");
const startOnBoot = document.getElementById("startOnBootInput");
const startHidden = document.getElementById("startHiddenInput");

startupFan.addEventListener("click", () => {
  if (startupFan.checked) {
    localStorage.setItem("fanOnStart", "yes");
    console.log("checked");
  } else {
    localStorage.setItem("fanOnStart", "no");
    console.log("notChecked");
  }
});
systemTray.addEventListener("click", () => {
  if (systemTray.checked) {
    localStorage.setItem("quitToTray", "yes");
  } else {
    localStorage.setItem("quitToTray", "no");
  }
});
/*
startOnBoot.addEventListener("click", () => {
  if (startOnBoot.checked) {
    localStorage.setItem("startOnBoot", "yes");
  } else {
    localStorage.setItem("startOnBoot", "no");
  }
});
*/

startHidden.addEventListener("click", () => {
  if (startHidden.checked) {
    localStorage.setItem("startHidden", "yes");
    console.log("checkedhidden");
  } else {
    localStorage.setItem("startHidden", "no");
  }
});
/*
const onBoot = localStorage.getItem("startOnBoot");
if (onBoot == "yes") {
  await enable();
  startOnBootInput.checked = true;
} else {
  setTimeout(async () => {
    await disable();
  });
}
*/
