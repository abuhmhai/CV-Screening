<?php
declare(strict_types=1);
namespace Platform\Http;
class Router {
    private array $routes = [];
    public function add(string $method, string $path, callable $handler): void {
        $regex = preg_replace('/\\{([a-zA-Z]+)\\}/', '(?P<$1>[^/]+)', $path);
        $this->routes[] = [$method, '#^'.$regex.'/?$#D', $handler];
    }
    public function dispatch(Request $request) {
        foreach ($this->routes as [$method, $regex, $handler]) {
            if ($method === $request->method && preg_match($regex, $request->path, $matches)) {
                return $handler($request, array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY));
            }
        }
        throw new Error(404, 'Route not found');
    }
    public function inventory(): array { return array_map(function ($r) { return [$r[0], $r[1]]; }, $this->routes); }
}
