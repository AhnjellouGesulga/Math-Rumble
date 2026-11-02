# Math Rope Rumble

A two-player math tug-of-war game built with Laravel 13, Blade, plain JavaScript, and CSS. Red and blue teams share one screen, solve their own questions, and pull a ribbon toward their winning line.

## Start the prepared Windows project

Double-click **`start.cmd`**, or run this from the project folder in PowerShell:

```powershell
.\start.cmd
```

Open **http://127.0.0.1:8000**. Keep the terminal open while playing and press **Ctrl+C** to stop the server.

The launcher uses the project-local PHP runtime at `.runtime/php/php.exe` when available. Otherwise, it uses PHP from your `PATH`. The prepared workspace already has its dependencies and environment configured.

To use another port:

```powershell
.\start.cmd -Port 8080
```

Then open http://127.0.0.1:8080.

## Set up a fresh checkout

Requirements:

- PHP **8.4.1 or newer**, with the extensions required by the locked Composer dependencies.
- Composer **2**.
- A modern browser with JavaScript enabled.
- Node.js **18 or newer** only if you want to run the JavaScript tests.

The `.runtime` and `vendor` folders are ignored by Git. A fresh checkout needs its own compatible PHP installation and installed dependencies.

With PHP and Composer available in your terminal, run these commands from the project folder. Copy the environment file only if `.env` does not already exist:

```powershell
composer install
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
php artisan key:generate --no-interaction
php artisan serve --host=127.0.0.1 --port=8000
```

For macOS or Linux, use `cp .env.example .env` for the initial environment-file copy instead of the PowerShell `if` block.

No database setup, migrations, npm installation, or frontend build is required to play. Sessions and cache use files, and the assets are served directly from `public/`.

### Using Laragon

`start.cmd` can run the project with its local runtime independently of Laragon's selected PHP version. To serve the app through Laragon's web server instead, select PHP **8.4.1 or newer** and point the virtual host's document root at this project's **`public`** folder.

## Use on a phone

You do not need to install PHP or Laravel on the phone. Open the game in its browser and tap the answers. Both teams play on the **same phone or tablet**; opening it on two phones creates two separate games.

### Play using your computer and the same Wi-Fi

1. Connect your phone and computer to the same Wi-Fi network. A computer connected by Ethernet to the same router also works.
2. If the game is already running in PowerShell, press **Ctrl+C** in that server's terminal. From the project folder, start it with network access:

   ```powershell
   cd 'C:\laragon\www\Math Rope Rumble'
   php artisan serve --host=0.0.0.0 --port=8000 --tries=1 --no-interaction
   ```

   If `php` is not recognized, use the prepared runtime instead:

   ```powershell
   & '.\.runtime\php\php.exe' artisan serve --host=0.0.0.0 --port=8000 --tries=1 --no-interaction
   ```

   The normal `start.cmd` launcher listens on `127.0.0.1`, so use one of the commands above for phone access. Run only one server on port 8000.

3. Open another PowerShell terminal and run:

   ```powershell
   ipconfig
   ```

   Find the **IPv4 Address** under the computer's connected **Wi-Fi** or **Ethernet** adapter. For example, it might be `192.168.1.23`. Ignore disconnected adapters and VPN or virtual-machine adapters.

4. On your phone, open Chrome or Safari and enter the computer's address with the port. For that example:

   ```text
   http://192.168.1.23:8000
   ```

   Replace `192.168.1.23` with your computer's actual IPv4 address. `localhost` and `127.0.0.1` on the phone refer to the phone itself; `0.0.0.0` is the server's listening address, not the address to enter.

5. If Windows Firewall asks, allow the PHP server on your trusted **Private network**. Keep the computer awake and the server terminal running while playing. Press **Ctrl+C** when finished.

Choose your adventure, tap **Start the rumble**, and use the red and blue answer buttons. You can rotate the phone for a wider layout. The music, theme, pause, restart, and new-game controls also work with touch.

This HTTP Wi-Fi link supports browser play while the computer serves the game. For this app's installation and offline caching on a phone, use an **HTTPS** link with a certificate the phone trusts. Changing `http://` to `https://` does not add HTTPS to `php artisan serve`. See [MDN's PWA installation requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

### Install on Android or iPhone and play offline

First deploy the Laravel project to an HTTPS address, or use an HTTPS development address that your phone trusts. Open that address on the phone. For a deployed server, its web root must point to this project's `public/` folder.

1. Keep the game open until setup says **Ready to play offline!**.
2. **Android:** open the HTTPS game link in Chrome, then tap **Install game** if available. Alternatively, use Chrome's **More** menu, then **Install and create shortcut > Install**; some versions show **Install app** or **Add to Home screen**. Follow the prompts. See [Google's Android installation guide](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid).
3. **iPhone:** open the HTTPS game link in Safari. Tap **Share > Add to Home Screen**, keep **Open as Web App** enabled if shown, then tap **Add**. See [Apple's Safari web-app guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).
4. Launch **Math Rope Rumble** from the new Home Screen icon while still connected. Wait for **Ready to play offline!** in that installed app as well. Then you can disconnect and reopen it to play offline.

After the complete offline download, the computer or hosted server does not need to stay available to play that cached version. Refreshing still resets the current match. Reconnect and choose **Update game** from setup when you want a newer version.

### If the phone cannot open the game

- **Page does not load:** check that both devices use the same network, the server is running with `--host=0.0.0.0`, and the phone URL has the correct IPv4 address and port. Check that Windows Firewall permits PHP on your Private network.
- **Port 8000 is already in use:** stop the existing server, or change `--port=8000` to `--port=8001` and use `:8001` in the phone's URL too.
- **It works on the computer only:** guest Wi-Fi, school networks, or router client isolation can block connections between devices. Try a network that allows devices to communicate, or use the deployed HTTPS link.
- **It stopped working later:** the computer may be asleep, its terminal may have closed, or its IPv4 address may have changed. Run `ipconfig` again and update the phone URL.
- **Install or offline play is unavailable:** use a trusted HTTPS game link and wait for the offline-ready message. A Home Screen shortcut to the HTTP Wi-Fi address does not enable this app's offline cache.
- **No music:** start the match, turn **Music on**, and check the phone's media volume. The speaker button controls sound effects separately.

## How to play

1. Choose the math operation, difficulty, round duration, and match length in the centered **Choose your adventure** card. The arena stays hidden during setup.
2. Pick a team and click **Start the rumble**. The game appears with a compact layout that keeps the questions and answers together.
3. After the countdown, select the correct answer to your team's question.
4. Each correct answer earns one point and pulls the rope one step toward your side.

| Action | Red team | Blue team |
| --- | --- | --- |
| Select the left answer | `A` | `J` |
| Select the middle answer | `S` | `K` |
| Select the right answer | `D` | `L` |

You can also click or tap the answer buttons. Press **Esc** to pause or resume, or use the pause button. Opening the instructions or switching to another browser tab pauses the game; resume when ready. Sound can be toggled in the header.

The live pull meter shows the rope's position. Correct answers trigger a “+1 pull!” animation, and three or more correct answers in a row light up your team's streak badge. Tap effects and keyboard presses give immediate visual feedback. Reduced-motion preferences are respected.

### Light, dark, and fullscreen

Use **Dark mode** or **Light mode** in the top controls to switch appearance. The first visit follows your device preference; choosing a mode saves it for future visits and offline play. Dark mode also changes the playground, question panels, and dialogs.

The **Fullscreen** control is available during setup and gameplay when the browser supports it. The same controls move into the match toolbar after starting, so theme, fullscreen, sound, and help remain accessible. Fullscreen opens only when you press its button. Unsupported browsers hide the control.

Choosing **New game** hides the arena and shows the centered setup again without changing the selected theme.

### Background music

The **Music on / Music off** button in the top controls enables or disables a gentle, original looping tune. Music is enabled by default and starts when you start a match. It pauses with the game, stops at the results, and stays silent while the tab is hidden. The setting is saved for future visits. The speaker button controls sound effects separately.

Music also works offline. It is generated in the browser, so it needs no external tracks or downloads. Browsers that do not support audio can still play the game.

## Install and play offline

1. Open the game online and wait for **Ready to play offline!** in the setup panel.
2. Choose **Install game**. When a native install prompt is available, the button opens it. Otherwise, **Add to your device** opens instructions for your browser.
3. Open the installed game from your home screen, taskbar, or applications menu. The game, questions, icons, and settings work offline after the first complete download.

On iPhone or iPad, open the game in Safari, tap **Share**, and choose **Add to Home Screen**. On Android, Chrome, or Edge, use the app's install button or the browser's installation menu.

Installation requires **HTTPS**, except on `localhost` or `127.0.0.1` for development. To install on a phone or another computer, serve the game from an HTTPS address; the localhost address belongs to the device opening it. See [MDN's installation requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

After the first download, Laravel does not need to be reachable for a cached game to launch and play. Match progress still resets on a reload; setup and sound preferences remain saved in that browser. Clearing site data removes the offline download.

### App updates

The service worker caches the page and its assets as one version. Changes to the game files generate a new cache version automatically. A banner offers **Update game** when a new version has downloaded. It is hidden during a match, and the game reloads only after you choose to update from setup.

During local development, a page refresh can keep showing the cached version. Return to setup and choose **Update game** when the banner appears. Developer tools can also unregister the service worker and clear the app's caches when needed.

### Winning a round and match

- Reach **six net pulls** toward your side to win a round. For example, seven correct red answers and one correct blue answer give red a six-pull lead.
- Wrong answers do not move the rope or subtract points. The correct answer is highlighted and the solved question stays visible for two seconds before that team's next question. The other team can keep playing. Pausing also pauses this review time.
- When the timer expires, the team ahead on the rope wins the round. A centered ribbon results in a draw.
- A match ends when a team wins a majority of the configured rounds, or when all configured rounds have been played. The team with more round wins takes the match; equal round wins result in a tie.
- Draws count toward the round limit without awarding either team a win. Odd match lengths help avoid ties, but draws can still produce one.

Results show each team's correct answers, accuracy, and rounds won. Round results use that round's answers; match results use all answers from the match. Accuracy is correct answers divided by attempts, rounded to a percentage. A dash means the team has not answered yet.

Use **Next round** to continue a match. **Play again** immediately starts a fresh match with the same settings.

The **Restart game** and **New game** buttons are available below the answers and on the pause screen. **Restart game** clears both teams' scores, accuracy, streaks, and round wins, resets the timer, and begins again from round 1 with the same settings and a fresh countdown. **New game** clears the match and returns to **Choose your adventure**. Both ask for confirmation during a match; cancelling preserves progress and resumes only if the game was running before the prompt. Theme, music, and sound preferences are kept.

Round results also offer **Restart game** and **New game**. Final results offer **Play again** and **New game**.

## Match settings

| Setting | Options | Default |
| --- | --- | --- |
| Type of math | Addition, subtraction, multiplication, division, or mixed | Addition |
| Difficulty | Easy, medium, hard | Easy |
| Time per round | 1–60 minutes | 5 minutes |
| Match length | 1–15 rounds | Best of 3 |

Subtraction questions have nonnegative answers, and division questions have whole-number answers. Choose the math type and difficulty from the dropdowns. Each difficulty option includes an example question for the selected math type, and the preview below shows a solved example.

Use the **Time per round** dropdown to choose **5 min**, **10 min**, or **15 min**, and the **Match length** dropdown to choose **1**, **3**, or **5** rounds. Choose **Custom…** in either dropdown to show an editable number field: 1–60 whole minutes or 1–15 rounds. Custom values such as 7 minutes or 4 rounds work too, and both choices are saved for the next visit.

Both teams follow the same question sequence each round, including in mixed mode, while the answer buttons are shuffled separately. Teams advance independently, so a faster team can be further along in that shared sequence.

Settings and sound preferences are saved in the current browser's local storage. Match progress is held in browser memory: refreshing the page starts a fresh match. Both teams play on the same device; there is no remote multiplayer or shared leaderboard.

## Project structure

| File | Purpose |
| --- | --- |
| [routes/web.php](routes/web.php) | Named route for the game page |
| [app/Http/Controllers/GameController.php](app/Http/Controllers/GameController.php) | Renders the Blade view with game configuration |
| [config/game.php](config/game.php) | Math-mode labels, difficulty labels, and default settings |
| [resources/views/game.blade.php](resources/views/game.blade.php) | Page layout, illustrated arena, settings, and dialogs |
| [public/css/game.css](public/css/game.css) | Responsive styling and animations |
| [public/js/game-core.mjs](public/js/game-core.mjs) | Question generation, scoring, round state, timers, and win rules |
| [public/js/game.mjs](public/js/game.mjs) | Interface updates, controls, sound, and saved preferences |
| [public/js/appearance.js](public/js/appearance.js) | Theme initialization, device preference, and saved light/dark controls |
| [public/js/background-music.mjs](public/js/background-music.mjs) | Original synthesized music loop and audio cleanup |
| [public/js/pwa.mjs](public/js/pwa.mjs) | Installation, offline status, and update controls |
| [public/manifest.webmanifest](public/manifest.webmanifest) | Installed-app identity, display mode, and icons |
| [public/icons/icon.svg](public/icons/icon.svg) | Vector source for the PNG app icons |
| [app/Http/Controllers/PwaController.php](app/Http/Controllers/PwaController.php) | Versioned service-worker response and cache asset list |
| [resources/js/service-worker.js](resources/js/service-worker.js) | Offline caching and worker update lifecycle |
| [serve.ps1](serve.ps1) | Windows server launcher and PHP checks |

To change initial settings, edit `config/game.php`. To change question ranges, cooldowns, or the number of pulls needed to win, edit `public/js/game-core.mjs` and update the related tests. Saved browser settings take precedence over the initial defaults.

## Tests

Run the Laravel feature tests with a compatible PHP version:

```powershell
php artisan test --compact tests/Feature
```

In the prepared Windows workspace, you can explicitly use the local runtime:

```powershell
& '.\.runtime\php\php.exe' artisan test --compact tests/Feature
```

Run the JavaScript game tests with Node.js on your `PATH`:

```powershell
node tests/js/game-core.test.mjs
node tests/js/service-worker.test.mjs
node tests/js/appearance.test.mjs
node tests/js/background-music.test.mjs
```

Alternatively, run `npm test`. Neither command requires npm dependencies to be installed.

The suite contains **6 Laravel feature tests** and **41 JavaScript tests**. These cover gameplay, fair question sequences, match restarts, results, theme preferences and storage fallbacks, music playback and cancellation, manifest metadata, icon dimensions, worker headers, complete offline caching, cache cleanup, and explicit update activation.

## Troubleshooting

- **`php` is not recognized:** the PHP folder must be on your Windows `PATH`. After changing `PATH`, reopen PowerShell; for an integrated terminal, restart VS Code so it picks up the new environment. You can always use `.\start.cmd` with the prepared runtime. To enable `php` immediately in an existing PowerShell terminal opened at this project folder, run `$env:Path = "$PWD\.runtime\php;$env:Path"`.
- **PHP version error:** use `start.cmd` with the local runtime, or select PHP 8.4.1 or newer in your terminal or Laragon.
- **Missing dependencies:** run `composer install` with a compatible PHP version. Use `composer check-platform-reqs` to identify missing extensions.
- **Port already in use:** start with a different port, such as `.\start.cmd -Port 8080`.
- **Changes to defaults do not appear:** existing browser preferences override defaults. Clear this site's local storage to restore them. After editing Laravel configuration or Blade views, run `php artisan optimize:clear` if cached content remains.
- **A fresh installation cannot write cache or sessions:** make sure `storage/` and `bootstrap/cache/` are writable by the PHP process.
- **Install or offline play is unavailable:** use HTTPS or a localhost address, allow the first download to finish, and check that your browser permits service workers and site storage. Private browsing can restrict installation.
