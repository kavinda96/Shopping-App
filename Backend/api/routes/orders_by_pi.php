<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
header('Content-Type: application/json');

function auth_user_id() {
  $headers = function_exists('getallheaders') ? getallheaders() : [];
  $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
  if (!preg_match('/Bearer\s(\S+)/', $auth, $m)) { http_response_code(401); echo json_encode(['error'=>'No token']); exit; }
  try {
    $decoded = JWT::decode($m[1], new Key(app_config('jwt_secret'), 'HS256'));
    return (int)$decoded->user_id;
  } catch (Exception $e) { http_response_code(401); echo json_encode(['error'=>'Invalid token']); exit; }
}

$userId = auth_user_id();
$piId = $_GET['pi'] ?? $_GET['payment_intent'] ?? '';
if (!$piId) { http_response_code(400); echo json_encode(['error'=>'missing pi']); exit; }

$pdo = db();
$sel = $pdo->prepare("SELECT * FROM invoices WHERE stripe_pi_id = ? AND user_id = ?");
$sel->execute([$piId, $userId]);
$inv = $sel->fetch();

if ($inv) {
  $items = $pdo->prepare("SELECT product_id, name, price_cents, qty FROM invoice_items WHERE invoice_id = ?");
  $items->execute([$inv['id']]);
  echo json_encode(['invoice'=>$inv, 'items'=>$items->fetchAll()]);
  exit;
}

// Fallback: check with Stripe and finalize if succeeded
$config    = app_config();
$stripeKey = getenv('STRIPE_SECRET') ?: ($config['stripe_secret'] ?? '');
if (!$stripeKey) { http_response_code(404); echo json_encode(['error'=>'invoice not found']); exit; }

try {
  $stripe = new \Stripe\StripeClient($stripeKey);
  $pi = $stripe->paymentIntents->retrieve($piId, []);
  if ($pi->status === 'succeeded' && (int)($pi->metadata->user_id ?? 0) === $userId) {
    $pdo->beginTransaction();

    $ins = $pdo->prepare("INSERT INTO invoices (user_id, stripe_pi_id, amount_cents, currency, status) VALUES (?,?,?,?, 'succeeded')");
    $ins->execute([$userId, $pi->id, (int)$pi->amount, (string)$pi->currency]);
    $invoiceId = (int)$pdo->lastInsertId();

    $rows = $pdo->prepare("SELECT ci.qty, p.id AS product_id, p.name, p.price_cents
                           FROM cart_items ci
                           JOIN products p ON p.id = ci.product_id
                           WHERE ci.user_id = ?");
    $rows->execute([$userId]);
    $items = $rows->fetchAll();

    if ($items) {
      $it = $pdo->prepare("INSERT INTO invoice_items (invoice_id, product_id, name, price_cents, qty)
                           VALUES (?,?,?,?,?)");
      foreach ($items as $r) $it->execute([$invoiceId, (int)$r['product_id'], (string)$r['name'], (int)$r['price_cents'], (int)$r['qty']]);
    }

    $del = $pdo->prepare("DELETE FROM cart_items WHERE user_id = ?");
    $del->execute([$userId]);

    $pdo->commit();

    $items = $pdo->prepare("SELECT product_id, name, price_cents, qty FROM invoice_items WHERE invoice_id = ?");
    $items->execute([$invoiceId]);
    echo json_encode(['invoice'=>[
      'id'=>$invoiceId,'user_id'=>$userId,'stripe_pi_id'=>$pi->id,'amount_cents'=>$pi->amount,'currency'=>$pi->currency,'status'=>'succeeded'
    ], 'items'=>$items->fetchAll()]);
    exit;
  }
} catch (Throwable $e) {
  // ignore and fall through
}

http_response_code(404);
echo json_encode(['error'=>'invoice not found (yet)']);
