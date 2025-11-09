<?php
// api/routes/admin_products.php
require_once __DIR__ . '/../lib/auth.php'; // gives require_admin(), db()

header('Content-Type: application/json');
$admin = require_admin(); // 403 if not admin
$method = $_SERVER['REQUEST_METHOD'];

// Helpers
function json_out($data, $code=200){ http_response_code($code); echo json_encode($data); exit; }
function read_json(){ return json_decode(file_get_contents('php://input'), true) ?? []; }


if ($method === 'GET') {
  $shopId = isset($_GET['shop_id']) ? (int)$_GET['shop_id'] : 0;
  if ($shopId <= 0) json_out(['error'=>'shop_id required'], 422);

  $stmt = db()->prepare("SELECT * FROM products WHERE shop_id = ? ORDER BY created_at DESC");
  $stmt->execute([$shopId]);
  json_out($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'POST') {
  $b = read_json();
  $shop_id = (int)($b['shop_id'] ?? 0);
  $name = trim($b['name'] ?? '');
  $price_cents = (int)($b['price_cents'] ?? 0);
  $photo_url = trim($b['photo_url'] ?? '');
  $is_active = (int)($b['is_active'] ?? 1);

  if ($shop_id <= 0 || $name === '' || $price_cents < 0) {
    json_out(['error'=>'shop_id, name, price_cents required'], 422);
  }

  $stmt = db()->prepare("INSERT INTO products (shop_id, name, price_cents, photo_url, is_active, created_at) VALUES (?,?,?,?,?,NOW())");
  $stmt->execute([$shop_id, $name, $price_cents, $photo_url, $is_active]);

  $id = (int)db()->lastInsertId();
  $row = db()->prepare("SELECT * FROM products WHERE id=?");
  $row->execute([$id]);
  json_out($row->fetch(PDO::FETCH_ASSOC), 201);
}

if ($method === 'PATCH') {
  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($id <= 0) json_out(['error'=>'id required'], 422);

  $b = read_json();
  $fields = [];
  $params = [];

  if (isset($b['name']))         { $fields[] = "name=?";         $params[] = trim($b['name']); }
  if (isset($b['price_cents']))  { $fields[] = "price_cents=?";  $params[] = (int)$b['price_cents']; }
  if (isset($b['photo_url']))    { $fields[] = "photo_url=?";    $params[] = trim($b['photo_url']); }
  if (isset($b['is_active']))    { $fields[] = "is_active=?";    $params[] = (int)$b['is_active']; }

  if (!$fields) json_out(['error'=>'no fields to update'], 422);

  $sql = "UPDATE products SET ".implode(',', $fields)." WHERE id=?";
  $params[] = $id;
  $stmt = db()->prepare($sql);
  $stmt->execute($params);

  $row = db()->prepare("SELECT * FROM products WHERE id=?");
  $row->execute([$id]);
  json_out($row->fetch(PDO::FETCH_ASSOC));
}

if ($method === 'DELETE') {
  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($id <= 0) json_out(['error'=>'id required'], 422);
  $stmt = db()->prepare("DELETE FROM products WHERE id=?");
  $stmt->execute([$id]);
  json_out(['ok'=>true]);
}

json_out(['error'=>'Method Not Allowed'], 405);
