<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET');

use Config\Database;
use Models\Paciente;

session_start();

$allowedOrigin = 'https://citasalud.infinityfreeapp.com';
header("Access-Control-Allow-Origin: {$allowedOrigin}");

$response = ['is_valid' => false];

if (!isset($_SESSION['paciente_documento'])) {
    echo json_encode($response);
    exit;
}

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    echo json_encode($response);
    exit;
}

$pacienteModel = new Paciente($db);
$paciente = $pacienteModel->findByDocumento($_SESSION['paciente_documento']);

if ($paciente !== null && $paciente->session_id_activa === session_id()) {
    $response['is_valid'] = true;
} else {
    session_unset();
    session_destroy();
}

echo json_encode($response);
