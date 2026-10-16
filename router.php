<?php
// Router for PHP's development server; Apache uses .htaccess instead.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = realpath(__DIR__ . $path);
if ($file && strpos($file, __DIR__ . DIRECTORY_SEPARATOR) === 0 && is_file($file) && !preg_match('/\.php$/i', $file)) return false;
require __DIR__ . '/index.php';
