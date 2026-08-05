<?php
namespace Config;

use PDO;
use PDOException;

class Database {
    private static $instance = null;
    private $connection;

    private $host = 'localhost';
    private $db_name = 'rdmi_db';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';

    private function __construct() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
            exit;
        }
    }

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection(): PDO {
        return $this->connection;
    }
}
?>
<?php
namespace App\Models;

use Config\Database;
use PDO;

abstract class Model {
    protected $db;
    protected $table;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function all(): array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table}");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function find(int $id) {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create(array $data): int {
        $keys = array_keys($data);
        $fields = implode(', ', $keys);
        $placeholders = implode(', ', array_fill(0, count($keys), '?'));

        $sql = "INSERT INTO {$this->table} ({$fields}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($data));

        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = array_map(fn($key) => "{$key} = ?", array_keys($data));
        $setClause = implode(', ', $fields);

        $sql = "UPDATE {$this->table} SET {$setClause} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        
        return $stmt->execute([...array_values($data), $id]);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
?>
<?php
namespace App\Models;

class Orden extends Model {
    protected $table = 'ordenes_mantenimiento';

    public function obtenerPorEstado(string $estado): array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE estado = ?");
        $stmt->execute([$estado]);
        return $stmt->fetchAll();
    }
}
?>
<?php
namespace App\Controllers;

use App\Models\Orden;

class OrdenController {
    private $ordenModel;

    public function __construct() {
        $this->ordenModel = new Orden();
    }

    public function listar(): void {
        $ordenes = $this->ordenModel->all();
        echo json_encode(['success' => true, 'data' => $ordenes]);
    }

    public function crear(array $data): void {
        if (empty($data['asunto'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'mensaje' => 'El asunto es obligatorio']);
            return;
        }

        $id = $this->ordenModel->create([
            'asunto' => $data['asunto'],
            'encargado' => $data['encargado'] ?? 'Sin asignar',
            'prioridad' => $data['prioridad'] ?? 'Media',
            'descripcion' => $data['descripcion'] ?? ''
        ]);

        echo json_encode(['success' => true, 'mensaje' => 'Orden registrada con éxito', 'id' => $id]);
    }
}
?>
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Models/Model.php';
require_once __DIR__ . '/../src/Models/Orden.php';
require_once __DIR__ . '/../src/Controllers/OrdenController.php';

use App\Controllers\OrdenController;

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'ordenes/listar':
        if ($method === 'GET') {
            (new OrdenController())->listar();
        }
        break;

    case 'ordenes/crear':
        if ($method === 'POST') {
            (new OrdenController())->crear($input);
        }
        break;

    default:
        http_response_code(444);
        echo json_encode(['success' => false, 'mensaje' => 'Ruta no encontrada']);
        break;
}
?>
