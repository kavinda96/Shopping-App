<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

$stmt = db()->prepare("SELECT id, name, email, password_hash, is_admin FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid email or password']);
  exit;
}

$payload = [
  'user_id'  => (int)$user['id'],
  'email'    => $user['email'],
  'is_admin' => (int)$user['is_admin'],
  'exp'      => time() + 60*60*24*7,
];

$jwt = JWT::encode($payload, app_config('jwt_secret'), 'HS256');

echo json_encode([
  'token' => $jwt,
  'user'  => [
    'id'       => (int)$user['id'],
    'name'     => $user['name'],
    'email'    => $user['email'],
    'is_admin' => (int)$user['is_admin'],
  ],
]);
