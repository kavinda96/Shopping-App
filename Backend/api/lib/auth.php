<?php
// api/lib/auth.php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function require_auth(): int {
  // read bearer token
  $headers = function_exists('getallheaders') ? getallheaders() : [];
  $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
  if (!preg_match('/Bearer\s(\S+)/', $auth, $m)) {
    http_response_code(401);
    echo json_encode(['error' => 'No token']);
    exit;
  }

  try {
    $decoded = JWT::decode($m[1], new Key(app_config('jwt_secret'), 'HS256'));
    return (int)($decoded->user_id ?? 0);
  } catch (Throwable $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
  }
}

/**
 * Require current user to be admin. Returns user id on success.
 * Assumes a users.is_admin TINYINT(1) column (0/1).
 */
function require_admin(): int {
  $uid = require_auth();

  $stmt = db()->prepare('SELECT is_admin FROM users WHERE id = ?');
  $stmt->execute([$uid]);
  $row = $stmt->fetch();
  if (!$row || (int)$row['is_admin'] !== 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Admin only']);
    exit;
  }
  return $uid;
}
