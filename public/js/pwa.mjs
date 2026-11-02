const config = document.querySelector("script[data-pwa]");
const installButton = document.getElementById("install-button");
const installLabel = document.getElementById("install-label");
const status = document.getElementById("pwa-status");
const installDialog = document.getElementById("install-dialog");
const updateBanner = document.getElementById("pwa-update");
const standalone = window.matchMedia("(display-mode: standalone)");
let installPrompt = null;
let installed = standalone.matches || navigator.standalone === true;
let registration;
let waitingWorker;
let offlineReady = false;
let unavailable = false;
let cacheFailed = false;
let dismissedUpdate = false;
let reloading = false;
let reloadOnControllerChange = false;
const watchedRegistrations = new WeakSet();

function renderState() {
    installButton.hidden = installed;
    installLabel.textContent = installPrompt
        ? "Install game"
        : "Add to your device";
    status.dataset.state = offlineReady
        ? "ready"
        : unavailable || cacheFailed
          ? "unavailable"
          : "loading";
    status.textContent = offlineReady
        ? navigator.onLine
            ? "Ready to play offline!"
            : "You’re offline. Let’s keep playing!"
        : unavailable
          ? "Play online now. Open a secure game link to enable offline play."
          : cacheFailed
            ? "Play online now. Offline play couldn’t be saved; try reopening the game."
            : navigator.onLine
              ? "Saving the game for offline play…"
              : "Connect once to save the game for offline play.";
    document.getElementById("install-context").textContent = offlineReady
        ? "Offline play is ready. Your game will open without an internet connection."
        : unavailable
          ? "Use an https:// game link to install on your device. On this computer, localhost also works."
          : cacheFailed
            ? "Connect to the internet and reopen the game to save it for offline play."
            : "Keep the game open until the offline-ready message appears.";
    updateBanner.hidden =
        !waitingWorker ||
        dismissedUpdate ||
        document.body.classList.contains("match-active");
}

async function checkOfflineReady() {
    const worker = registration?.active || navigator.serviceWorker?.controller;
    if (!worker) return;
    offlineReady = await new Promise((resolve) => {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
            channel.port1.close();
            resolve(false);
        }, 2500);
        channel.port1.onmessage = (event) => {
            clearTimeout(timeout);
            channel.port1.close();
            resolve(event.data?.ready === true);
        };
        try {
            worker.postMessage({ type: "GET_OFFLINE_STATUS" }, [channel.port2]);
        } catch {
            clearTimeout(timeout);
            channel.port1.close();
            resolve(false);
        }
    });
    renderState();
}

function watchRegistration(value) {
    registration = value;
    if (watchedRegistrations.has(value)) return;
    watchedRegistrations.add(value);
    if (value.waiting) {
        waitingWorker = value.waiting;
        renderState();
    }
    value.addEventListener("updatefound", () => {
        const worker = value.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
            if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller
            ) {
                waitingWorker = value.waiting || worker;
                dismissedUpdate = false;
                renderState();
            }
            if (worker.state === "activated") checkOfflineReady();
        });
    });
}

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    renderState();
});
window.addEventListener("appinstalled", () => {
    installed = true;
    installPrompt = null;
    if (installDialog.open) installDialog.close();
    renderState();
});
standalone.addEventListener("change", () => {
    installed = standalone.matches || navigator.standalone === true;
    renderState();
});
installButton.addEventListener("click", async () => {
    if (!installPrompt) {
        installDialog.showModal();
        return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    installButton.disabled = true;
    try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === "accepted") installed = true;
    } catch {
        installDialog.showModal();
    } finally {
        installButton.disabled = false;
        renderState();
    }
});
for (const id of ["close-install", "install-done"]) {
    document
        .getElementById(id)
        .addEventListener("click", () => installDialog.close());
}
document.getElementById("pwa-update-button").addEventListener("click", () => {
    if (!waitingWorker || document.body.classList.contains("match-active"))
        return;
    reloadOnControllerChange = true;
    document.getElementById("pwa-update-button").disabled = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
});
document.getElementById("pwa-update-dismiss").addEventListener("click", () => {
    dismissedUpdate = true;
    renderState();
});
new MutationObserver(renderState).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
});
window.addEventListener("offline", renderState);
window.addEventListener("online", () => {
    renderState();
    registration?.update().catch(() => {});
    checkOfflineReady();
});
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && navigator.onLine)
        registration?.update().catch(() => {});
});

async function initialize() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
        unavailable = true;
        renderState();
        return;
    }
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadOnControllerChange && !reloading) {
            reloading = true;
            window.location.reload();
        } else checkOfflineReady();
    });
    try {
        const existing = await navigator.serviceWorker.getRegistration(
            config.dataset.home,
        );
        if (existing) {
            watchRegistration(existing);
            await checkOfflineReady();
        }
        const value = await navigator.serviceWorker.register(
            config.dataset.worker,
            {
                scope: config.dataset.home,
                updateViaCache: "none",
            },
        );
        watchRegistration(value);
        await navigator.serviceWorker.ready;
        await checkOfflineReady();
    } catch {
        await checkOfflineReady();
        cacheFailed = !offlineReady && navigator.onLine;
    }
    renderState();
}

renderState();
initialize();
