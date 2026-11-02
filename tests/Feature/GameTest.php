<?php

namespace Tests\Feature;

use Tests\TestCase;

class GameTest extends TestCase
{
    public function test_game_page_renders_both_teams_and_all_settings(): void
    {
        $this->get(route('game'))
            ->assertOk()
            ->assertViewIs('game')
            ->assertSee('Math Rope Rumble')
            ->assertSee('Red Team')
            ->assertSee('Blue Team')
            ->assertSee('Start the rumble')
            ->assertDontSee('public/build', false)
            ->assertSee('js/game.mjs', false);
    }

    public function test_configuration_supplies_all_math_modes_and_difficulties(): void
    {
        $this->get('/')
            ->assertViewHas('operations', fn (array $operations) => array_keys($operations) === [
                'addition', 'subtraction', 'multiplication', 'division', 'mixed',
            ])
            ->assertViewHas('difficulties', fn (array $difficulties) => count($difficulties) === 3)
            ->assertViewHas('defaults', [
                'operation' => 'addition',
                'difficulty' => 'easy',
                'minutes' => 5,
                'rounds' => 3,
            ]);
    }

    public function test_health_check_succeeds_without_a_database(): void
    {
        $this->get('/up')->assertOk();
    }
}
