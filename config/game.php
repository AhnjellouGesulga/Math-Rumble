<?php

return [
    'operations' => [
        'addition' => ['label' => 'Addition', 'symbol' => '+'],
        'subtraction' => ['label' => 'Subtraction', 'symbol' => '−'],
        'multiplication' => ['label' => 'Multiplication', 'symbol' => '×'],
        'division' => ['label' => 'Division', 'symbol' => '÷'],
        'mixed' => ['label' => 'A little of everything', 'symbol' => '±'],
    ],
    'difficulties' => [
        'easy' => 'Easy',
        'medium' => 'Medium',
        'hard' => 'Hard',
    ],
    'defaults' => [
        'operation' => 'addition',
        'difficulty' => 'easy',
        'minutes' => 5,
        'rounds' => 3,
    ],
];
