<?php

use App\Http\Controllers\GameController;
use App\Http\Controllers\PwaController;
use Illuminate\Support\Facades\Route;

Route::get('/', GameController::class)->name('game');
Route::get('/service-worker.js', [PwaController::class, 'serviceWorker'])->name('pwa.service-worker');
