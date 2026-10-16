<?php
declare(strict_types=1);
namespace Platform;
class Database {
    public \PDO $pdo;
    private array $schema;
    public function __construct(?\PDO $pdo = null) {
        $this->pdo = $pdo ?? new \PDO(\env('DB_DSN', 'mysql:host=127.0.0.1;dbname=cvscreening;charset=utf8mb4'), \env('DB_USER'), \env('DB_PASSWORD'), [\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION, \PDO::ATTR_DEFAULT_FETCH_MODE=>\PDO::FETCH_ASSOC, \PDO::ATTR_EMULATE_PREPARES=>false]);
        $this->schema = json_decode(file_get_contents(APP_ROOT.'/database/schema.json'), true);
        if ($this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME) === 'mysql') $this->pdo->exec("SET time_zone = '+00:00'");
    }
    public function run(string $sql, array $args = []): \PDOStatement { $s=$this->pdo->prepare($sql); $s->execute($args); return $s; }
    public function all(string $sql, array $args = []): array { return $this->run($sql,$args)->fetchAll(); }
    public function one(string $sql, array $args = []): ?array { $r=$this->run($sql,$args)->fetch(); return $r === false ? null : $r; }
    public function transaction(callable $fn) {
        $this->pdo->beginTransaction();
        try { $r=$fn(); $this->pdo->commit(); return $r; } catch (\Throwable $e) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $e; }
    }
    public function fields(string $table): array {
        if (!isset($this->schema[$table])) throw new \InvalidArgumentException('Unknown table');
        return $this->schema[$table]['fields'];
    }
    public function write(string $table, array $data, ?array $where = null): array {
        $fields=$this->fields($table); $row=[];
        foreach ($data as $key=>$value) {
            if (!isset($fields[$key])) throw new \InvalidArgumentException('Unknown field '.$key);
            $f=$fields[$key];
            if($value===null && !$f['nullable'])throw new \Platform\Http\Error(400,'Field cannot be null: '.$key);
            if($value!==null && $f['values'] && !in_array($value,$f['values'],true))throw new \Platform\Http\Error(400,'Invalid '.$key);
            if($value!==null && $f['type']!=='Json' && !is_scalar($value))throw new \Platform\Http\Error(400,'Invalid field type: '.$key);
            if($value!==null && $f['type']==='Int' && filter_var($value,FILTER_VALIDATE_INT)===false)throw new \Platform\Http\Error(400,'Integer required: '.$key);
            if($value!==null && $f['type']==='Decimal' && !is_numeric($value))throw new \Platform\Http\Error(400,'Number required: '.$key);
            if($value!==null && $f['type']==='Boolean' && !in_array($value,[true,false,0,1,'0','1'],true))throw new \Platform\Http\Error(400,'Boolean required: '.$key);
            if ($value !== null && $f['type'] === 'Json' && !is_string($value)) $value=json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            if ($value !== null && $f['type'] === 'Boolean') $value=(int)(bool)$value;
            if ($value !== null && $f['type'] === 'DateTime') {try{$value=(new \DateTimeImmutable((string)$value))->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');}catch(\Exception $e){throw new \Platform\Http\Error(400,'Invalid date: '.$key);}}
            $row[$f['column']]=$value;
        }
        if ($where === null) {
            foreach ($fields as $name=>$f) {
                if (!array_key_exists($f['column'],$row)) {
                    if ($f['default'] === 'uuid') $row[$f['column']]=\uuid();
                    elseif (in_array($f['default'], ['now','updated'],true)) $row[$f['column']]=\now();
                }
                if(!array_key_exists($f['column'],$row) && !$f['nullable'] && $f['default']===null)throw new \Platform\Http\Error(400,'Missing field: '.$name);
            }
            $columns=array_keys($row);
            $this->run('INSERT INTO `'.$table.'` (`'.implode('`,`',$columns).'`) VALUES ('.implode(',',array_fill(0,count($columns),'?')).')', array_values($row));
        } else {
            foreach ($fields as $f) if ($f['default'] === 'updated' && !array_key_exists($f['column'],$row)) $row[$f['column']]=\now();
            if (!$row) return $this->record($table,$where) ?? [];
            [$clause,$args]=$this->where($table,$where);
            $this->run('UPDATE `'.$table.'` SET '.implode(',',array_map(function($c){return '`'.$c.'`=?';},array_keys($row))).' WHERE '.$clause,array_merge(array_values($row),$args));
        }
        $key=$where ?? [];
        if (!$key) foreach ($this->schema[$table]['primary'] as $name) $key[$name]=$row[$fields[$name]['column']];
        return $this->record($table,$key) ?? [];
    }
    public function where(string $table,array $where): array {
        if (!$where) throw new \InvalidArgumentException('A write requires a key');
        $f=$this->fields($table); $sql=[]; $args=[];
        foreach ($where as $k=>$v) { if (!isset($f[$k])) throw new \InvalidArgumentException('Unknown key'); if($f[$k]['type']==='DateTime')$v=(new \DateTimeImmutable($v))->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s.v'); $sql[]='`'.$f[$k]['column'].'`=?'; $args[]=$v; }
        return [implode(' AND ',$sql),$args];
    }
    public function record(string $table,array $where): ?array { [$s,$a]=$this->where($table,$where); $r=$this->one('SELECT * FROM `'.$table.'` WHERE '.$s,$a); return $r ? $this->map($table,$r) : null; }
    public function records(string $table,string $where='1',array $args=[],string $order=''): array { return array_map(function($r)use($table){return $this->map($table,$r);},$this->all('SELECT * FROM `'.$table.'` WHERE '.$where.($order ? ' ORDER BY '.$order : ''),$args)); }
    public function map(string $table,array $row): array {
        $result=[];
        foreach($this->fields($table) as $name=>$f) if(array_key_exists($f['column'],$row)) {
            $v=$row[$f['column']];
            if ($v!==null && $f['type']==='Json') $v=json_decode($v,true,512,JSON_THROW_ON_ERROR);
            elseif ($v!==null && $f['type']==='Boolean') $v=(bool)$v;
            elseif ($v!==null && $f['type']==='Int') $v=(int)$v;
            elseif ($v!==null && $f['type']==='BigInt') $v=(string)$v;
            elseif ($v!==null && $f['type']==='DateTime') $v=(new \DateTimeImmutable($v, new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');
            $result[$name]=$v;
        }
        return $result;
    }
    public function delete(string $table,array $key): void { [$s,$a]=$this->where($table,$key); $this->run('DELETE FROM `'.$table.'` WHERE '.$s,$a); }
}
