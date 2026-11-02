<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class PwaController extends Controller
{
    private const ASSETS = [
        'css/game.css',
        'js/game-core.mjs',
        'js/game.mjs',
        'js/background-music.mjs',
        'js/appearance.js',
        'js/pwa.mjs',
        'favicon.svg',
        'manifest.webmanifest',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
        'icons/apple-touch-icon.png',
    ];

    public function serviceWorker(): Response
    {
        $home = route('game', [], false);
        $urls = [$home];
        $hash = hash_init('sha256');

        foreach (self::ASSETS as $asset) {
            $urls[] = rtrim($home, '/').'/'.$asset;
            hash_update_file($hash, public_path($asset));
        }

        foreach (['views/game.blade.php', 'js/service-worker.js'] as $source) {
            hash_update_file($hash, resource_path($source));
        }

        hash_update_file($hash, config_path('game.php'));
        hash_update_file($hash, __FILE__);
        hash_update($hash, json_encode($urls, JSON_THROW_ON_ERROR));

        $script = strtr(file_get_contents(resource_path('js/service-worker.js')), [
            '__CACHE_VERSION__' => substr(hash_final($hash), 0, 20),
            '__PRECACHE_URLS__' => json_encode($urls, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
        ]);

        return response($script, 200, [
            'Content-Type' => 'application/javascript; charset=UTF-8',
            'Cache-Control' => 'no-cache, max-age=0, must-revalidate',
            'Service-Worker-Allowed' => $home,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
