<?php
require_once __DIR__ . '/../lib/db.php';
header('Content-Type: application/json');

$code = trim($_GET['code'] ?? '');
if ($code === '') { http_response_code(400); echo json_encode(['error'=>'code required']); exit; }

$stmt = db()->prepare("SELECT * FROM promo_codes WHERE code = ? AND active = 1");
$stmt->execute([$code]);
$pc = $stmt->fetch();

if (!$pc) { http_response_code(404); echo json_encode(['valid'=>false]); exit; }

echo json_encode([
  'valid' => true,
  'type'  => $pc['type'],
  'percent' => (int)$pc['percent'],
  'value_cents' => (int)$pc['value_cents']
]);
