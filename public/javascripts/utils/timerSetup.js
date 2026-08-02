import {convertToString} from "./timeConverter.js";

export const setupTimer = (trialTime) => {
    let start = Date.now();
    setTimeout(() => {
        alert("Time's up!");
        window.location.href = "/";
    }, Number(trialTime));
    let time_div = document.createElement("div");
    let timer_value = document.createElement("p");
    setInterval(() => {
        timer_value.innerText = `Time left: ${convertToString(Math.max(0, trialTime - (Date.now() - start)))}`
    }, 1)
    time_div.append(timer_value);
    let work_area = document.getElementById("work-area");
    work_area.append(time_div);
}