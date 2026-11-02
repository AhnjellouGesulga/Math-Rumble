<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#7950e8">
    <meta name="color-scheme" content="light dark">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Rope Rumble">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="description" content="Two teams. One rope. Put your math skills to the test in a friendly tug-of-war. A free, same-device math game for everyone.">
    <title>Math Rope Rumble — A little math. A big pull.</title>
    <script src="{{ asset('js/appearance.js') }}?v={{ filemtime(public_path('js/appearance.js')) }}"></script>
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
    <link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
    <link rel="apple-touch-icon" href="{{ asset('icons/apple-touch-icon.png') }}">
    <link rel="stylesheet" href="{{ asset('css/game.css') }}?v={{ filemtime(public_path('css/game.css')) }}">
    <script type="module" src="{{ asset('js/game.mjs') }}?v={{ filemtime(public_path('js/game.mjs')) }}"></script>
    <script type="module" data-pwa data-worker="{{ route('pwa.service-worker', [], false) }}" data-home="{{ route('game', [], false) }}" src="{{ asset('js/pwa.mjs') }}?v={{ filemtime(public_path('js/pwa.mjs')) }}"></script>
</head>
<body>
    <svg class="svg-definitions" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <symbol id="icon-rope" viewBox="0 0 32 32"><path d="M5 22c-5-5 1-12 7-7l8 7c5 4 11-2 7-7L16 5C11 1 5 7 9 12l13 15" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></symbol>
            <symbol id="icon-arrow" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
            <symbol id="icon-trophy" viewBox="0 0 24 24"><path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 2v6m-5 1h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
            <symbol id="icon-sound" viewBox="0 0 24 24"><path d="m11 4-6 5H2v6h3l6 5V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></symbol>
            <symbol id="icon-mute" viewBox="0 0 24 24"><path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></symbol>
            <symbol id="icon-music" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13M9 9l12-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="6" cy="18" rx="3" ry="2.5" fill="currentColor"/><ellipse cx="18" cy="16" rx="3" ry="2.5" fill="currentColor"/></symbol>
            <symbol id="icon-music-off" viewBox="0 0 24 24"><path d="M9 18v-5m0-7V5l12-2v13M13 8l8-1M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="6" cy="18" rx="3" ry="2.5" fill="currentColor"/><path d="M18 13.5c-1.7 0-3 1.1-3 2.5s1.3 2.5 3 2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
            <symbol id="icon-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1 .7-1.7 1.1-1.7 2.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></symbol>
            <symbol id="icon-reset" viewBox="0 0 24 24"><path d="M4 10a8 8 0 1 1 1.5 7M4 4v6h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
            <symbol id="icon-pause" viewBox="0 0 24 24"><path d="M9 5v14m6-14v14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></symbol>
            <symbol id="icon-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
            <symbol id="icon-star" viewBox="0 0 24 24"><path d="m12 2 3 6.3 7 .9-5.1 4.9 1.3 7L12 17.7l-6.2 3.4 1.3-7L2 9.2l7-.9Z" fill="currentColor" stroke="currentColor" stroke-linejoin="round"/></symbol>
            <symbol id="icon-bolt" viewBox="0 0 24 24"><path d="M14 2 4 14h7l-1 8L21 9h-8Z" fill="currentColor" stroke="currentColor" stroke-linejoin="round"/></symbol>
            <symbol id="icon-rocket" viewBox="0 0 24 24"><path d="M9 14c-1-5 3-10 11-11 0 8-5 12-10 11Zm0-6-5 1-2 5 7-1m5 1-1 6-5 2 1-8M6 17l-3 4m0-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="15" cy="8" r="2" fill="currentColor"/></symbol>
            <symbol id="icon-install" viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
            <symbol id="icon-fullscreen" viewBox="0 0 24 24"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
            <symbol id="icon-moon" viewBox="0 0 24 24"><path d="M20.8 14A9 9 0 0 1 10 3.2 9 9 0 1 0 20.8 14Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
            <symbol id="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        </defs>
    </svg>

    <header class="site-header">
        <a class="brand" href="{{ route('game') }}" aria-label="Math Rope Rumble home"><span class="brand-icon"><svg><use href="#icon-rope"/></svg></span><span>Math<span class="brand-light">Play</span><span class="brand-dot">.</span></span></a>
        <div class="header-controls-home" id="header-controls-home"><div class="header-actions" id="header-actions">
            <span class="local-badge"><svg aria-hidden="true"><use href="#icon-star"/></svg> Little questions. BIG high-fives!</span>
            <button class="help-button" id="help-button" type="button" aria-label="How to play" title="How to play"><svg><use href="#icon-help"/></svg><span>How to play</span></button>
            <span class="header-divider"></span>
            <button class="icon-button" id="sound-button" type="button" aria-label="Turn sound effects on" aria-pressed="false" title="Turn sound effects on"><svg aria-hidden="true"><use id="sound-icon" href="#icon-mute"/></svg></button>
            <button class="music-toggle display-control" id="music-button" type="button" aria-label="Turn background music off" aria-pressed="true" title="Turn background music off. Plays during the match."><svg aria-hidden="true"><use id="music-icon" href="#icon-music"/></svg><span id="music-label">Music on</span></button>
            <button class="theme-toggle display-control" id="theme-button" type="button" aria-label="Switch to dark mode" aria-pressed="false" title="Switch to dark mode"><svg aria-hidden="true"><use id="theme-icon" href="#icon-moon"/></svg><span id="theme-label">Dark mode</span></button>
            <button class="fullscreen-button display-control" id="fullscreen-button" type="button" aria-label="Enter fullscreen" aria-pressed="false" title="Enter fullscreen" hidden><svg aria-hidden="true"><use href="#icon-fullscreen"/></svg><span id="fullscreen-label">Fullscreen</span></button>
        </div></div>
    </header>

    <main class="page-shell">
        <div class="page-intro">
            <div><p class="eyebrow"><span class="tiny-star" aria-hidden="true">✦</span> READY, SET, BRAIN POWER!</p><h1><span class="title-math">Math</span> <span class="title-rope">Rope</span> <span class="title-rumble">Rumble<svg viewBox="0 0 240 10" aria-hidden="true"><path d="M2 7Q90 0 237 5"/></svg></span></h1><p class="intro-copy">Grab a friend. Pick a team. Pull with your brain!</p></div>
            <div class="player-badge"><span class="player-badge-icons" aria-hidden="true"><span><svg><use href="#icon-bolt"/></svg></span><span><svg><use href="#icon-star"/></svg></span></span><div><strong>High-fives encouraged!</strong><span>2 players · 1 screen · Big smiles</span></div></div>
        </div>

        <div class="dashboard">
            <div class="game-column" id="game-screen" role="region" aria-label="Math Rope Rumble game" tabindex="-1" hidden>
                <section class="game-card" aria-label="Math tug-of-war arena">
                    <div class="arena-toolbar">
                        <div class="round-info"><span class="round-label" id="round-label">ROUND 1 OF 3</span><span class="match-status" id="match-status"><i></i> Ready to rumble</span></div>
                        <div class="timer" id="timer" role="timer" aria-label="Time remaining: 5 minutes"><svg><use href="#icon-clock"/></svg><span id="timer-value">05:00</span></div>
                        <div class="round-score" aria-label="Rounds won"><span class="score-red" id="red-wins">0</span><svg><use href="#icon-trophy"/></svg><span class="score-blue" id="blue-wins">0</span></div>
                        <div class="pull-meter" id="pull-meter" role="meter" aria-label="Rope position" aria-valuemin="-6" aria-valuemax="6" aria-valuenow="0" aria-valuetext="The ribbon is at the center."><span class="pull-meter-thumb" aria-hidden="true"></span></div>
                    </div>

                    <div class="arena" id="arena">
                        <div class="arena-grid" aria-hidden="true"></div>
                        <div class="arena-scenery" aria-hidden="true">
                            <div class="night-sky"><span class="night-moon"></span><i>✦</i><i>✧</i><i>✦</i><i>✧</i></div>
                            <div class="cloud cloud-left"></div><div class="cloud cloud-right"></div>
                            <svg class="sun" viewBox="0 0 80 80"><g stroke="#ffb822" stroke-width="5" stroke-linecap="round"><path d="M40 4v6m0 60v6M4 40h6m60 0h6M15 15l5 5m40 40 5 5M15 65l5-5m40-40 5-5"/></g><circle cx="40" cy="40" r="24" fill="#ffda54"/><circle cx="32" cy="37" r="2.5" fill="#925a29"/><circle cx="48" cy="37" r="2.5" fill="#925a29"/><path d="M32 46q8 9 16 0" fill="none" stroke="#925a29" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="26" cy="44" rx="4" ry="2" fill="#ffb45a"/><ellipse cx="54" cy="44" rx="4" ry="2" fill="#ffb45a"/></svg>
                            <div class="playground-hill hill-left"></div><div class="playground-hill hill-right"></div>
                            <svg class="arena-bunting" viewBox="0 0 900 65" preserveAspectRatio="none"><path d="M0 4q110 60 225 0m450 0q115 60 225 0" fill="none" stroke="#b6a4e7" stroke-width="2"/><path d="m22 14 22 7-17 21Z" fill="#ff7786"/><path d="m66 28 22 3-13 22Z" fill="#ffcd45"/><path d="m112 34 22-2-9 24Z" fill="#8b6cf0"/><path d="m157 27 22-6-4 25Z" fill="#43c7b1"/><path d="m710 19 22 7-17 21Z" fill="#ffcd45"/><path d="m755 31 22 3-13 22Z" fill="#54b1ef"/><path d="m801 32 22-3-9 24Z" fill="#ff7786"/><path d="m846 22 22-8-2 25Z" fill="#8b6cf0"/></svg>
                        </div>
                        <span class="floating-math math-one" aria-hidden="true">+</span><span class="floating-math math-two" aria-hidden="true">÷</span><span class="floating-math math-three" aria-hidden="true">×</span>
                        <div class="arena-heading"><span class="arena-heading-line"></span><span id="arena-heading">A LITTLE MATH. A BIG PULL.</span><span class="arena-heading-line"></span></div>
                        <div class="goal goal-red"><span>RED WINS HERE</span><div class="goal-post"></div></div>
                        <div class="goal goal-blue"><span>BLUE WINS HERE</span><div class="goal-post"></div></div>
                        <div class="center-line" aria-hidden="true"></div>
                        <svg class="tug-scene" viewBox="0 0 900 290" role="img" aria-label="Red and blue teams pull a rope. The ribbon starts at the center.">
                            <defs>
                                <pattern id="rope-pattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="12" height="12" fill="#bd9560"/><path d="M0 0h5v12H0" fill="#ebc78f"/></pattern>
                                <g id="player">
                                    <ellipse cx="0" cy="103" rx="29" ry="5" fill="#345643" opacity=".10"/>
                                    <path d="m-9 61-16 34m27-32 16 32" stroke="#273a3c" stroke-width="13" stroke-linecap="round"/>
                                    <path d="m-29 97 9 1m34-1 10 1" stroke="#fffdf5" stroke-width="10" stroke-linecap="round"/>
                                    <path d="m-12 22-4 35c3 14 37 13 36-1L13 22Z" fill="currentColor"/>
                                    <path d="m-9 28 22 16 25-7" fill="none" stroke="#e7ad7c" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="m11 26 20 13 21-2" fill="none" stroke="#f5c593" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="m-10 25 9 7m15-4 5 5" stroke="currentColor" stroke-width="13"/>
                                    <rect x="-4" y="8" width="11" height="14" rx="4" fill="#e7ad7c"/>
                                    <ellipse cx="1" cy="-6" rx="21" ry="24" fill="#f5c593"/>
                                    <path d="M-20-6c-11-36 41-41 43-13l-2 12-7-12c-5 6-15 8-24 6l-5 11Z" fill="#423b34"/>
                                    <circle cx="10" cy="-5" r="2" fill="#423b34"/><path d="m9 4 6 1" stroke="#b26c50" stroke-width="2" stroke-linecap="round"/>
                                    <circle cx="-19" cy="-4" r="5" fill="#f5c593"/>
                                </g>
                                <g id="player-curly"><use href="#player"/><path d="M-20-12c-11-5-7-18 2-19-3-11 13-17 19-9 6-10 22-3 19 7 12 0 16 16 6 22l-8-9c-9 6-24 8-34 5Z" fill="#423b34"/></g>
                                <g id="player-pony"><use href="#player"/><path d="M-17-18c-25-11-37 17-27 31 1-14 10-18 21-10" fill="#654536"/><path d="M-21-10c-7-31 38-42 45-13l-7 10-7-13c-7 11-16 13-25 14Z" fill="#654536"/><circle cx="-23" cy="-15" r="4" fill="#e9b145"/></g>
                            </defs>
                            <path d="M25 255Q450 246 875 255" stroke="#95c66b" stroke-width="2" fill="none"/>
                            <g class="tug-movers" id="tug-movers">
                                <rect x="135" y="175" width="630" height="8" rx="4" fill="url(#rope-pattern)" stroke="#ad885a" stroke-width=".6"/>
                                <g class="red-players" style="color:#ff536c">
                                    <g class="character-position" transform="translate(175 138) rotate(-12)"><g class="character" style="--idle-delay:0s"><g class="character-tug"><use href="#player-curly"/></g></g></g>
                                    <g class="character-position" transform="translate(260 138) rotate(-12)"><g class="character" style="--idle-delay:-0.7s"><g class="character-tug"><use href="#player-pony"/></g></g></g>
                                    <g class="character-position" transform="translate(345 138) rotate(-12)"><g class="character" style="--idle-delay:-1.4s"><g class="character-tug"><use href="#player"/></g></g></g>
                                </g>
                                <g class="blue-players" style="color:#3989f5">
                                    <g class="character-position" transform="translate(555 138) scale(-1 1) rotate(-12)"><g class="character" style="--idle-delay:-0.35s"><g class="character-tug"><use href="#player"/></g></g></g>
                                    <g class="character-position" transform="translate(640 138) scale(-1 1) rotate(-12)"><g class="character" style="--idle-delay:-1.05s"><g class="character-tug"><use href="#player-pony"/></g></g></g>
                                    <g class="character-position" transform="translate(725 138) scale(-1 1) rotate(-12)"><g class="character" style="--idle-delay:-1.75s"><g class="character-tug"><use href="#player-curly"/></g></g></g>
                                </g>
                                <g class="ribbon"><path d="m443 180-3 35 10-7 10 7-3-35" fill="#efb748"/><path d="m449 178-11-12c-9-9-17 6-6 10l17 5m2-3 11-12c9-9 17 6 6 10l-17 5" fill="#f6cd69" stroke="#d89d31" stroke-width="1.5"/><rect x="446" y="175" width="9" height="9" rx="3" fill="#e6aa38"/></g>
                            </g>
                            <g fill="#90ab72" opacity=".6"><path d="m60 252-3-10m3 10 5-7m764 7-3-10m3 10 5-7m-440 8-3-8m3 8 4-5" stroke="#90ab72" stroke-width="2" stroke-linecap="round"/></g>
                        </svg>
                        <div class="arena-bottom"><span><span class="team-dot red-dot"></span> Teamwork makes the dream work</span><span class="ribbon-label"><span></span> Pull the ribbon past your line</span></div>
                    </div>

                    <div class="team-panels">
                        @foreach (['red' => ['Red', 'A', 'S', 'D'], 'blue' => ['Blue', 'J', 'K', 'L']] as $team => $labels)
                        <section class="team-panel team-{{ $team }}" id="{{ $team }}-panel" aria-label="{{ $labels[0] }} team questions">
                            <div class="team-panel-heading"><h2><span class="team-mascot" aria-hidden="true"><svg><use href="#icon-{{ $team === 'red' ? 'bolt' : 'star' }}"/></svg><span class="streak-count" id="{{ $team }}-streak" hidden>0</span></span>{{ $labels[0] }} Team</h2><span class="points"><strong id="{{ $team }}-points">0</strong> points</span></div>
                            <span class="pull-pop" id="{{ $team }}-pull-pop" aria-hidden="true">+1 pull!</span>
                            <div class="question-area"><p class="question-caption" id="{{ $team }}-caption">YOUR NEXT BIG PULL</p><p class="equation" id="{{ $team }}-question">{{ $team === 'red' ? '6 + 3' : '4 + 5' }} <span>= ?</span></p></div>
                            <div class="answers" id="{{ $team }}-answers">
                                @for ($i = 0; $i < 3; $i++)
                                <button type="button" class="answer-button" data-team="{{ $team }}" data-index="{{ $i }}" disabled><span class="answer-value">{{ [7, 9, 12][$i] }}</span><kbd>{{ $labels[$i + 1] }}</kbd></button>
                                @endfor
                            </div>
                            <p class="team-feedback" id="{{ $team }}-feedback" aria-live="polite">Tap an answer or use <strong>{{ $labels[1] }} &nbsp; {{ $labels[2] }} &nbsp; {{ $labels[3] }}</strong></p>
                        </section>
                        @endforeach
                    </div>
                    <div class="game-footer">
                        <span><svg aria-hidden="true"><use href="#icon-help"/></svg> Correct answers pull the rope. Six net pulls win the round.</span>
                        <div class="game-actions" role="group" aria-label="Start a fresh game">
                            <button id="restart-button" class="text-button restart-button" data-reset-action="restart" type="button" title="Restart from round 1 with the same settings" disabled><svg aria-hidden="true"><use href="#icon-reset"/></svg> Restart game</button>
                            <button id="reset-button" class="text-button" data-reset-action="new-game" type="button" title="Return to Choose your adventure" disabled><svg aria-hidden="true"><use href="#icon-rocket"/></svg> New game</button>
                        </div>
                    </div>
                </section>

                <section class="quick-guide" aria-label="Quick guide"><div><span class="step-number" aria-hidden="true"><svg><use href="#icon-rocket"/></svg></span><div><h3>1. Pick your challenge</h3><p>A little math, a lot of fun!</p></div></div><div><span class="step-number" aria-hidden="true"><svg><use href="#icon-bolt"/></svg></span><div><h3>2. Think, tap, pull!</h3><p>Every right answer is a big move.</p></div></div><div><span class="step-number" aria-hidden="true"><svg><use href="#icon-trophy"/></svg></span><div><h3>3. Celebrate together</h3><p>Big brains deserve big high-fives.</p></div></div></section>
            </div>

            <aside class="settings-card" aria-labelledby="settings-heading">
                <div class="match-toolbar-slot" id="match-toolbar-slot"></div>
                <div class="settings-heading"><span class="settings-icon"><svg aria-hidden="true"><use href="#icon-rocket"/></svg></span><div><h2 id="settings-heading" tabindex="-1">Choose your adventure</h2><p>Pick your challenge, then let the fun begin!</p></div></div>
                <form id="settings-form">
                    <fieldset id="settings-fields">
                        <legend class="sr-only">Match settings</legend>
                        <div class="setting-group operation-group">
                            <label for="operation">Type of math</label>
                            <div class="select-field"><select class="setting-select" id="operation" name="operation" aria-describedby="difficulty-hint">
                                @foreach ($operations as $value => $operation)
                                <option value="{{ $value }}" @selected($value === $defaults['operation'])>{{ $operation['symbol'] }} &nbsp; {{ $operation['label'] }}</option>
                                @endforeach
                            </select></div>
                        </div>
                        <div class="setting-group difficulty-group">
                            <label for="difficulty">Difficulty</label>
                            <div class="select-field"><select class="setting-select" id="difficulty" name="difficulty" aria-describedby="difficulty-hint">
                                @foreach ($difficulties as $value => $label)
                                <option id="difficulty-example-{{ $value }}" value="{{ $value }}" data-label="{{ $label }}" @selected($value === $defaults['difficulty'])>{{ $label }} · {{ ['easy' => '6 + 3', 'medium' => '18 + 7', 'hard' => '47 + 38'][$value] }}</option>
                                @endforeach
                            </select></div>
                        </div>
                        <p class="setting-preview" id="difficulty-hint" aria-live="polite">Add numbers from 1 to 10. Try 6 + 3 = 9.</p>
                        <div class="setting-group">
                            <label for="minutes-suggestion">Time per round</label>
                            <div class="select-field"><select class="setting-select" id="minutes-suggestion" data-number-suggestion="minutes" aria-describedby="minutes-hint">
                                @foreach ([5, 10, 15] as $suggestedMinutes)
                                <option value="{{ $suggestedMinutes }}">{{ $suggestedMinutes }} min</option>
                                @endforeach
                                <option value="custom">Custom…</option>
                            </select></div>
                            <div class="custom-number-option" id="minutes-custom" hidden>
                                <label class="custom-number-label" for="minutes">Custom minutes</label>
                                <div class="custom-number-field"><input type="number" id="minutes" name="minutes" min="1" max="60" step="1" inputmode="numeric" value="5" placeholder="e.g. 7" required aria-describedby="minutes-hint"><span id="minutes-unit" aria-hidden="true">minutes</span></div>
                            </div>
                            <p class="setting-hint" id="minutes-hint">Choose a time or enter 1–60 custom minutes.</p>
                        </div>
                        <div class="setting-group rounds-group">
                            <label for="rounds-suggestion">Match length</label>
                            <div class="select-field"><select class="setting-select" id="rounds-suggestion" data-number-suggestion="rounds" aria-describedby="rounds-hint">
                                @foreach ([1, 3, 5] as $suggestedRounds)
                                <option value="{{ $suggestedRounds }}">{{ $suggestedRounds }} {{ $suggestedRounds === 1 ? 'round' : 'rounds' }}</option>
                                @endforeach
                                <option value="custom">Custom…</option>
                            </select></div>
                            <div class="custom-number-option" id="rounds-custom" hidden>
                                <label class="custom-number-label" for="rounds">Custom rounds</label>
                                <div class="custom-number-field"><input type="number" id="rounds" name="rounds" min="1" max="15" step="1" inputmode="numeric" value="3" placeholder="e.g. 7" required aria-describedby="rounds-hint"><span id="rounds-unit" aria-hidden="true">rounds</span></div>
                            </div>
                            <p class="setting-hint" id="rounds-hint">1–15 rounds. Odd numbers help avoid ties.</p>
                        </div>
                    </fieldset>
                    <button class="primary-button start-button" id="start-button" type="submit"><span id="start-label">Start the rumble</span><svg id="start-icon"><use href="#icon-arrow"/></svg></button>
                </form>
                <section class="pwa-panel" aria-label="Install and offline play">
                    <div class="pwa-panel-heading"><svg aria-hidden="true"><use href="#icon-rocket"/></svg><strong>Take the fun with you!</strong></div>
                    <button class="install-button" id="install-button" type="button"><svg aria-hidden="true"><use href="#icon-install"/></svg><span id="install-label">Install game</span></button>
                    <p class="pwa-status" id="pwa-status" role="status">Getting ready for offline play…</p>
                </section>
            </aside>
        </div>
        <footer class="site-footer"><span>Less scrolling. More solving.</span><span>Made for curious minds <span class="footer-star">✦</span></span></footer>
    </main>

    <div class="arena-overlay" id="arena-overlay" hidden>
        <div class="overlay-panel" id="overlay-panel"><span class="overlay-eyebrow" id="overlay-eyebrow"></span><div class="overlay-symbol" id="overlay-symbol"></div><h2 id="overlay-title"></h2><p id="overlay-copy"></p><button class="primary-button overlay-action" id="overlay-action" type="button" hidden>Continue</button><div class="game-actions pause-actions" id="pause-actions" role="group" aria-label="Start a fresh game" hidden><button class="text-button restart-button" data-reset-action="restart" type="button"><svg aria-hidden="true"><use href="#icon-reset"/></svg> Restart game</button><button class="text-button" data-reset-action="new-game" type="button"><svg aria-hidden="true"><use href="#icon-rocket"/></svg> New game</button></div></div>
    </div>
    <dialog id="help-dialog" class="help-dialog" aria-labelledby="help-title"><button class="dialog-close icon-button" type="button" id="close-help" aria-label="Close instructions">×</button><span class="dialog-kicker">A FRIENDLY BATTLE OF BRAINS</span><h2 id="help-title">Ready, set, <em>solve.</em></h2><p>Grab a friend and pick a side. Both teams follow the same questions, with the answer buttons shuffled separately.</p><ol><li><strong>Set your challenge.</strong> Pick an operation, difficulty, time limit, and number of rounds. Each difficulty shows an example.</li><li><strong>Make your move.</strong> Red uses <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>. Blue uses <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd>. You can also tap or click the answers.</li><li><strong>Learn as you pull.</strong> A correct answer pulls one step. Six net pulls win. After a mistake, read the correct answer for two seconds before your next question. Your opponent keeps playing.</li><li><strong>Beat the clock.</strong> When time runs out, the team ahead on the rope wins. A centered ribbon is a draw. The results show correct answers, accuracy, and round wins.</li></ol><p class="help-pause">Need a breather? Use Pause or press <kbd>Esc</kbd>. The game also pauses when you switch tabs.</p><button class="primary-button" type="button" id="help-done">Got it. Let's rumble <svg><use href="#icon-arrow"/></svg></button></dialog>
    <dialog id="reset-dialog" class="help-dialog reset-dialog" aria-labelledby="reset-title" aria-describedby="reset-copy"><span class="dialog-kicker">A FRESH START?</span><h2 id="reset-title">New game?</h2><p id="reset-copy">Your scores will be cleared, and you can choose a new adventure.</p><div class="dialog-actions"><button class="secondary-button" id="cancel-reset" type="button" autofocus>Keep playing</button><button class="primary-button" id="confirm-reset" type="button">New game</button></div></dialog>
    <dialog id="install-dialog" class="help-dialog install-dialog" aria-labelledby="install-title">
        <button class="dialog-close icon-button" id="close-install" type="button" aria-label="Close installation help">×</button>
        <img class="install-app-icon" src="{{ asset('icons/icon-192.png') }}" width="72" height="72" alt="">
        <span class="dialog-kicker">YOUR POCKET PLAYGROUND</span>
        <h2 id="install-title">Play anywhere.</h2>
        <p>Add Math Rope Rumble to your home screen or computer. Once offline play is ready, you can play without an internet connection.</p>
        <ol><li><strong>iPhone or iPad:</strong> open this game in Safari, tap Share, then choose <strong>Add to Home Screen</strong>.</li><li><strong>Android:</strong> open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li><li><strong>Computer:</strong> in Chrome or Edge, use the install icon in the address bar or the browser’s <strong>Install app</strong> menu.</li></ol>
        <p class="help-pause" id="install-context">Keep the game open until the offline-ready message appears.</p>
        <button class="primary-button" id="install-done" type="button">Got it!</button>
    </dialog>
    <div class="pwa-update" id="pwa-update" role="status" hidden><span>A fresh version is ready!</span><button type="button" id="pwa-update-button">Update game</button><button type="button" class="pwa-update-dismiss" id="pwa-update-dismiss" aria-label="Dismiss update">×</button></div>
    <dialog id="results-dialog" class="results-dialog" aria-labelledby="results-title" aria-describedby="results-copy results-scope">
        <span class="dialog-kicker" id="results-eyebrow">MATCH COMPLETE</span>
        <svg class="results-trophy" aria-hidden="true"><use href="#icon-trophy"/></svg>
        <h2 id="results-title">Great teamwork!</h2>
        <p id="results-copy"></p>
        <p id="results-scope" class="results-scope">Answers and accuracy for this match.</p>
        <div class="results-teams">
            @foreach (['red' => 'Red', 'blue' => 'Blue'] as $team => $label)
            <section class="results-team results-{{ $team }}" aria-label="{{ $label }} team results">
                <h3><span class="team-dot {{ $team }}-dot" aria-hidden="true"></span>{{ $label }} Team</h3>
                <dl>
                    <div><dt>Correct answers</dt><dd id="{{ $team }}-result-correct">0</dd></div>
                    <div><dt>Accuracy</dt><dd id="{{ $team }}-result-accuracy">—</dd></div>
                    <div><dt>Rounds won</dt><dd id="{{ $team }}-result-wins">0</dd></div>
                </dl>
                <p class="result-attempts" id="{{ $team }}-result-attempts">No answers yet</p>
            </section>
            @endforeach
        </div>
        <button class="primary-button results-action" id="results-action" type="button" autofocus>Play again</button>
        <div class="results-other-actions"><button class="results-settings text-button" id="results-restart" type="button">Restart game</button><button class="results-settings text-button" id="results-settings" type="button">New game</button></div>
    </dialog>
    <div id="announcer" class="sr-only" role="status" aria-live="polite"></div>
    <noscript><div class="noscript-message">Please enable JavaScript to play Math Rope Rumble.</div></noscript>
    <script type="application/json" id="game-config">{!! json_encode($defaults, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>
</body>
</html>
