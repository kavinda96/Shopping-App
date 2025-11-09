<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$headers = getallheaders();
$auth = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
  http_response_code(401);
  echo json_encode(['error' => 'No token provided']);
  exit;
}

$token = $matches[1];

try {
  $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
  echo json_encode(['user' => $decoded]);
} catch (Exception $e) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
}
