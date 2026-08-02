export const blockInput = () => {
    window.addEventListener("beforeunload", function (event) {
        event.preventDefault();
        event.returnValue = "";
    });
    document.addEventListener("keydown", function (event) {
        const isF5 = event.key === "F5"
        const isCtrlR = event.ctrlKey && (event.key === "r" || event.key === "R");

        if (isF5 || isCtrlR) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    });
}