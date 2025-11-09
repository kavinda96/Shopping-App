<?php

return [

    'db' => [
        'dsn'  => 'mysql:host=127.0.0.1;dbname=shopapp;charset=utf8mb4',
        'user' => 'root',   // Laragon default
        'pass' => ''        // Laragon default
    ],

    // JWT secret key
    'jwt_secret' => getenv('JWT_SECRET') ?: '',

    // Upload paths
    'upload_dir'  => __DIR__ . '/uploads',
    'upload_base' => '/uploads',

    // Stripe keys - NEVER hardcode
    'stripe_secret'        => getenv('STRIPE_SECRET') ?: '',
    'stripe_publishable'   => getenv('STRIPE_PUBLISHABLE') ?: '',
    'stripe_webhook_secret'=> getenv('STRIPE_WEBHOOK_SECRET') ?: '',

    'currency' => 'aud'
];
