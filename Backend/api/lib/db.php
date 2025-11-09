<?php
$config = require __DIR__ . '/../config.php';

function db() {
  static $pdo;
  global $config;
  if (!$pdo) {
    $db = $config['db'];
    $pdo = new PDO($db['dsn'], $db['user'], $db['pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
  }
  return $pdo;
}

function app_config($key = null) {
  global $config;
  return $key ? ($config[$key] ?? null) : $config;
}
