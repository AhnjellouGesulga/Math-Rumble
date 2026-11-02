(() => {
    const storageKey = "math-rope-rumble.theme.v1";
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    let preference;
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved === "light" || saved === "dark") preference = saved;
    } catch {
        /* Appearance also works when storage is unavailable. */
    }

    function applyTheme(theme) {
        const dark = theme === "dark";
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute("content", dark ? "#181329" : "#7950e8");
        const button = document.getElementById("theme-button");
        if (!button) return;
        const label = dark ? "Switch to light mode" : "Switch to dark mode";
        button.setAttribute("aria-label", label);
        button.setAttribute("aria-pressed", String(dark));
        button.title = label;
        document
            .getElementById("theme-icon")
            .setAttribute("href", dark ? "#icon-sun" : "#icon-moon");
        document.getElementById("theme-label").textContent = dark
            ? "Light mode"
            : "Dark mode";
    }

    function initializeControls() {
        applyTheme(preference || (system.matches ? "dark" : "light"));
        document
            .getElementById("theme-button")
            ?.addEventListener("click", () => {
                preference =
                    document.documentElement.dataset.theme === "dark"
                        ? "light"
                        : "dark";
                try {
                    localStorage.setItem(storageKey, preference);
                } catch {
                    /* Keep the choice for this session. */
                }
                applyTheme(preference);
            });
        system.addEventListener("change", () => {
            if (!preference) applyTheme(system.matches ? "dark" : "light");
        });
    }

    applyTheme(preference || (system.matches ? "dark" : "light"));
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", initializeControls, {
            once: true,
        });
    else initializeControls();
})();
