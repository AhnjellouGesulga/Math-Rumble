<?php

namespace Tests\Feature;

use Tests\TestCase;

class PwaTest extends TestCase
{
    public function test_game_exposes_installation_and_offline_controls(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('rel="manifest"', false)
            ->assertSee('apple-touch-icon', false)
            ->assertSee('js/pwa.mjs', false)
            ->assertSee('id="install-button"', false)
            ->assertSee('id="pwa-status"', false);
    }

    public function test_manifest_has_installable_metadata_and_real_png_icons(): void
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.webmanifest')), true, flags: JSON_THROW_ON_ERROR);

        $this->assertSame('Math Rope Rumble', $manifest['name']);
        $this->assertSame('standalone', $manifest['display']);
        $this->assertSame('./', $manifest['id']);
        $this->assertSame('./', $manifest['scope']);
        $this->assertStringStartsWith('./', $manifest['start_url']);
        $this->assertFalse($manifest['prefer_related_applications']);
        $this->assertContains('maskable', array_column($manifest['icons'], 'purpose'));
        $this->assertContains('192x192', array_column($manifest['icons'], 'sizes'));
        $this->assertContains('512x512', array_column($manifest['icons'], 'sizes'));

        foreach ($manifest['icons'] as $icon) {
            $path = public_path($icon['src']);
            $this->assertFileExists($path);
            $dimensions = getimagesize($path);
            $this->assertSame($icon['sizes'], $dimensions[0].'x'.$dimensions[1]);
            $this->assertSame('image/png', $dimensions['mime']);
        }
    }

    public function test_worker_contains_versioned_shell_assets_and_revalidation_headers(): void
    {
        $response = $this->get(route('pwa.service-worker'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/javascript; charset=UTF-8')
            ->assertHeader('Service-Worker-Allowed', '/')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertSee('/js/game-core.mjs', false)
            ->assertSee('/js/background-music.mjs', false)
            ->assertSee('/js/appearance.js', false)
            ->assertSee('/js/pwa.mjs', false)
            ->assertSee('/manifest.webmanifest', false)
            ->assertDontSee('__CACHE_VERSION__', false)
            ->assertDontSee('__PRECACHE_URLS__', false);

        $this->assertStringContainsString('no-cache', $response->headers->get('Cache-Control'));
        $this->assertMatchesRegularExpression('/[a-f0-9]{20}/', $response->getContent());
        $this->assertSame($response->getContent(), $this->get(route('pwa.service-worker'))->getContent());
    }
}
