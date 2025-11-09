<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// --- CORS for local dev (adjust origin as needed) ---
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
// ----------------------------------------------------

header('Content-Type: application/json');

// Extract user id from bearer token
function auth_user_id_checkout() {
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

$userId = auth_user_id_checkout();
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$promo = trim($body['promo_code'] ?? '');

// Load cart
$sql = "SELECT ci.id, ci.qty, p.id AS product_id, p.price_cents, p.name
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?";
$stmt = db()->prepare($sql);
$stmt->execute([$userId]);
$rows = $stmt->fetchAll();

if (!$rows) { http_response_code(400); echo json_encode(['error'=>'Cart is empty']); exit; }

$total = 0;
foreach ($rows as $r) {
  $total += (int)$r['price_cents'] * (int)$r['qty'];
}

// Apply promo (optional)
$discount = 0;
if ($promo !== '') {
  $ps = db()->prepare("SELECT * FROM promo_codes WHERE code = ? AND active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())");
  $ps->execute([$promo]);
  $pc = $ps->fetch();
  if ($pc) {
    if (($pc['type'] ?? '') === 'percent') {
      $p = max(0, min(100, (int)$pc['percent']));
      $discount = intdiv($total * $p, 100);
    } else {
      $discount = max(0, (int)$pc['value_cents']);
    }
    if ($discount > $total) $discount = $total;
  } else {
    http_response_code(422); echo json_encode(['error'=>'Invalid promo code']); exit;
  }
}

$amount = max(0, $total - $discount);

$config = app_config();
$stripeSecret = $config['stripe_secret'] ?? '';
$currency = $config['currency'] ?? 'aud';

if (!$stripeSecret) {
  http_response_code(200);
  echo json_encode([
    'client_secret'  => null,
    'amount'         => $amount,
    'currency'       => $currency,
    'discount_cents' => $discount,
    'note'           => 'Stripe secret not set. Set stripe_secret in api/config.php'
  ]);
  exit;
}

try {
  $stripe = new \Stripe\StripeClient($stripeSecret);
  $pi = $stripe->paymentIntents->create([
    'amount' => $amount,
    'currency' => $currency,
    'automatic_payment_methods' => ['enabled' => true], // <— important
    'metadata' => [
      'user_id' => (string)$userId,
      'promo_code' => $promo,
    ]
  ]);

  echo json_encode([
    'client_secret'  => $pi->client_secret,
    'amount'         => $amount,
    'currency'       => $currency,
    'discount_cents' => $discount
  ]);
  exit;
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error'=>'Stripe error: '.$e->getMessage()]);
  exit;
}
