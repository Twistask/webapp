import {convertToString} from "./timeConverter.js";

let trialTime = 20 * 60 * 1000;
let start = Date.now();
document.getElementById("menu").style.display = "none";
document.getElementById("controls").style.display = "none";
document.getElementById("trial-menu").style.display = "flex";
let timer = setTimeout(() => {
    alert("Time's up!");
    window.location.href = "/";
}, trialTime);
let time_div = document.createElement("div");
let timer_value = document.createElement("p");
setInterval(() => {
    timer_value.innerText = `Time left: ${convertToString(Math.max(0, trialTime - (Date.now() - start)))}`
}, 1)
time_div.append(timer_value);
let work_area = document.getElementById("work-area");
work_area.append(time_div);
window.addEventListener("beforeunload", function (event) {
    event.preventDefault();
    event.returnValue = "";
});
document.addEventListener("keydown", function (event) {
    const isF5 = event.key === "F5" || event.keyCode === 116;
    const isCtrlR = event.ctrlKey && (event.key === "r" || event.key === "R" || event.keyCode === 82);

    if (isF5 || isCtrlR) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
});