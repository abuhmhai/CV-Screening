<?php
declare(strict_types=1);
namespace Platform\Http;
class Request {
    public string $method;
    public string $path;
    public array $body;
    public array $query;
    public function __construct() {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $this->path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
        $this->query = $_GET;
        $this->body = $_POST;
        if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            $decoded = json_decode($raw, true);
            if (!is_array($decoded) || json_last_error() !== JSON_ERROR_NONE) throw new Error(400, 'Invalid JSON body');
            $this->body = $decoded;
        }
    }
    public function required(string $key): string {
        if (!isset($this->body[$key]) || !is_scalar($this->body[$key]) || trim((string)$this->body[$key]) === '') throw new Error(400, 'Missing field: '.$key);
        return trim((string)$this->body[$key]);
    }
    public function choice(string $key, array $allowed, ?string $default = null): string {
        $value = $this->body[$key] ?? $default;
        if (!in_array($value, $allowed, true)) throw new Error(400, 'Invalid '.$key);
        return $value;
    }
}
