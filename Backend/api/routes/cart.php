<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header('Content-Type: application/json');

function auth_user_id() {
  $headers = function_exists('getallheaders') ? getallheaders() : [];
  $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
  if (!preg_match('/Bearer\s(\S+)/', $auth, $m)) {
    http_response_code(401); echo json_encode(['error'=>'No token']); exit;
  }
  try {
    $decoded = JWT::decode($m[1], new Key(app_config('jwt_secret'), 'HS256'));
    return (int)$decoded->user_id;
  } catch (Exception $e) {
    http_response_code(401); echo json_encode(['error'=>'Invalid token']); exit;
  }
}

$method = $_SERVER['REQUEST_METHOD'];
$userId = auth_user_id();

if ($method === 'GET') {
  $sql = "SELECT ci.id, ci.product_id, ci.shop_id, ci.qty,
                 p.name, p.price_cents, p.photo_url, p.shop_id, s.name AS shop_name
          FROM cart_items ci
          JOIN products p ON p.id = ci.product_id
          JOIN shops s ON s.id = p.shop_id
          WHERE ci.user_id = ?
          ORDER BY ci.id DESC";
  $stmt = db()->prepare($sql);
  $stmt->execute([$userId]);
  echo json_encode(['items' => $stmt->fetchAll()]); exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'POST') {
  $pid = (int)($body['product_id'] ?? 0);
  $qty = max(1, (int)($body['qty'] ?? 1));
  if (!$pid) { http_response_code(400); echo json_encode(['error'=>'product_id required']); exit; }

// Get shop_id from product
$prod = db()->prepare("SELECT shop_id FROM products WHERE id = ?");
$prod->execute([$pid]);
$row = $prod->fetch();
if (!$row) { http_response_code(400); echo json_encode(['error'=>'Invalid product']); exit; }
$shopId = (int)$row['shop_id'];

$stmt = db()->prepare("INSERT INTO cart_items (user_id, product_id, shop_id, qty)
                       VALUES (?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)");
$stmt->execute([$userId, $pid, $shopId, $qty]);

  echo json_encode(['success'=>true]); exit;
}

if ($method === 'PATCH') {
  $id  = (int)($body['id'] ?? 0);
  $qty = (int)($body['qty'] ?? 1);
  if ($id <= 0) { http_response_code(400); echo json_encode(['error'=>'id required']); exit; }

  $stmt = db()->prepare("UPDATE cart_items SET qty = ? WHERE id = ? AND user_id = ?");
  $stmt->execute([$qty, $id, $userId]);
  echo json_encode(['success'=>true]); exit;
}

if ($method === 'DELETE') {
  $id = (int)($_GET['id'] ?? 0);
  if ($id <= 0) { http_response_code(400); echo json_encode(['error'=>'id required']); exit; }

  $stmt = db()->prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?");
  $stmt->execute([$id, $userId]);
  echo json_encode(['success'=>true]); exit;
}

http_response_code(405); echo json_encode(['error'=>'Method Not Allowed']); exit;
