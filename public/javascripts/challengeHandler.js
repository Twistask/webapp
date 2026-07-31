let selectpackage = document.getElementById("challenge-select");

export function createItems(items) {
    items.forEach(item => {
        let opt = document.createElement("option");
        opt.value = item.title;
        opt.innerHTML = item.title;
        selectpackage.appendChild(opt);
    })
}