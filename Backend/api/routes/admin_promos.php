<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
header('Content-Type: application/json');
require_admin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $stmt = db()->query("SELECT * FROM promo_codes ORDER BY created_at DESC");
  echo json_encode($stmt->fetchAll()); exit;
}

if ($method === 'POST') {
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $stmt = db()->prepare("INSERT INTO promo_codes (code,type,percent,value_cents,active,starts_at,ends_at) VALUES (?,?,?,?,?,?,?)");
  $stmt->execute([
    strtoupper(trim($b['code']??'')),
    $b['type'] ?? 'percent',
    isset($b['percent']) ? (int)$b['percent'] : null,
    isset($b['value_cents']) ? (int)$b['value_cents'] : null,
    (int)($b['active']??1),
    $b['starts_at']??null, $b['ends_at']??null
  ]);
  echo json_encode(['id'=>db()->lastInsertId()]); exit;
}

if ($method === 'PATCH') {
  $id = (int)($_GET['id'] ?? 0);
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $stmt = db()->prepare("UPDATE promo_codes SET code=?, type=?, percent=?, value_cents=?, active=?, starts_at=?, ends_at=? WHERE id=?");
  $stmt->execute([
    strtoupper(trim($b['code']??'')),
    $b['type'] ?? 'percent',
    isset($b['percent']) ? (int)$b['percent'] : null,
    isset($b['value_cents']) ? (int)$b['value_cents'] : null,
    (int)($b['active']??1),
    $b['starts_at']??null, $b['ends_at']??null, $id
  ]);
  echo json_encode(['ok'=>true]); exit;
}

if ($method === 'DELETE') {
  $id = (int)($_GET['id'] ?? 0);
  $stmt = db()->prepare("DELETE FROM promo_codes WHERE id=?");
  $stmt->execute([$id]);
  echo json_encode(['ok'=>true]); exit;
}

http_response_code(405); echo json_encode(['error'=>'Method not allowed']);
