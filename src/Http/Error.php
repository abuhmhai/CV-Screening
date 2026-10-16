<?php
declare(strict_types=1);
namespace Platform\Http;
class Error extends \RuntimeException {
    public int $status;
    public function __construct(int $status, string $message) { parent::__construct($message); $this->status = $status; }
}
