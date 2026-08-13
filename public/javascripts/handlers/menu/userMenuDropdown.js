document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById("user-menu-toggle");
    const menu = document.getElementById("user-menu");
    if (!toggle || !menu) return;

    const isOpen = () => !menu.hidden;

    const closeMenu = () => {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
        menu.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (isOpen()) closeMenu(); else openMenu();
    });

    document.addEventListener("click", (ev) => {
        if (isOpen() && !menu.contains(ev.target) && ev.target !== toggle) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && isOpen()) {
            closeMenu();
            toggle.focus();
        }
    });
});
