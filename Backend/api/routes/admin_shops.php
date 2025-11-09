<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
header('Content-Type: application/json');
require_admin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $stmt = db()->query("SELECT * FROM shops ORDER BY created_at DESC");
  echo json_encode($stmt->fetchAll()); exit;
}

if ($method === 'POST') {
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $stmt = db()->prepare("INSERT INTO shops (name, description, photo_url) VALUES (?,?,?)");
  $stmt->execute([trim($b['name']??''), $b['description']??null, $b['photo_url']??null]);
  echo json_encode(['id'=>db()->lastInsertId()]); exit;
}

if ($method === 'PATCH') {
  $id = (int)($_GET['id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(['error'=>'Missing id']); exit; }
  $b = json_decode(file_get_contents('php://input'), true) ?: [];
  $stmt = db()->prepare("UPDATE shops SET name=?, description=?, photo_url=? WHERE id=?");
  $stmt->execute([trim($b['name']??''), $b['description']??null, $b['photo_url']??null, $id]);
  echo json_encode(['ok'=>true]); exit;
}

if ($method === 'DELETE') {
  $id = (int)($_GET['id'] ?? 0);
  $stmt = db()->prepare("DELETE FROM shops WHERE id=?");
  $stmt->execute([$id]);
  echo json_encode(['ok'=>true]); exit;
}

http_response_code(405); echo json_encode(['error'=>'Method not allowed']);
