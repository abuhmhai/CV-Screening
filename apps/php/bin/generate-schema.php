<?php
declare(strict_types=1);
// Development-only conversion of the checked-in Prisma schema. No Prisma runtime.
$source=file_get_contents(__DIR__.'/../../api/prisma/schema.prisma');
preg_match_all('/enum (\w+)\s*\{([^}]+)\}/s',$source,$em,PREG_SET_ORDER);
$enums=[]; foreach($em as $e) $enums[$e[1]]=preg_split('/\s+/',trim($e[2]));
preg_match_all('/model (\w+)\s*\{(.*?)^\}/ms',$source,$models,PREG_SET_ORDER);
$schema=[]; $sql=[]; $relations=[]; $nameToTable=[];
foreach($models as $m) { preg_match('/@@map\("([^"]+)"\)/',$m[2],$tm); $nameToTable[$m[1]]=$tm[1]??$m[1]; }
foreach($models as $m) {
    $table=$nameToTable[$m[1]]; $fields=[]; $columns=[]; $keys=[]; $primary=[];
    foreach(explode("\n",$m[2]) as $line) {
        if(!preg_match('/^\s*(\w+)\s+(\w+)(\?|\[\])?\s*(.*)$/',$line,$f)) continue;
        [$full,$name,$type]=$f; $mod=$f[3]??''; $attrs=$f[4]??'';
        if($mod==='[]' || isset($nameToTable[$type])) {
            if(preg_match('/@relation\([^\n]*fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\](?:,\s*onDelete:\s*(\w+))?/',$attrs,$r)) {
                $relations[]=[$table,$type,array_map('trim',explode(',',$r[1])),array_map('trim',explode(',',$r[2])),$r[3]??'Restrict'];
            }
            continue;
        }
        preg_match('/@map\("([^"]+)"\)/',$attrs,$cm); $column=$cm[1]??$name;
        $nullable=$mod==='?'; $default=null;
        if(strpos($attrs,'@default(uuid())')!==false) $default='uuid';
        elseif(strpos($attrs,'@default(now())')!==false) $default='now';
        elseif(strpos($attrs,'@updatedAt')!==false) $default='updated';
        elseif(preg_match('/@default\(("(?:[^"\\\\]|\\\\.)*"|[^)]+)\)/',$attrs,$dm)) $default=trim($dm[1],'"');
        $fields[$name]=['column'=>$column,'type'=>$type,'nullable'=>$nullable,'default'=>$default,'values'=>$enums[$type]??null];
        $sqlType=['String'=>'TEXT','Boolean'=>'TINYINT(1)','Int'=>'INT','BigInt'=>'BIGINT','Float'=>'DOUBLE','Decimal'=>'DECIMAL(10,2)','DateTime'=>'DATETIME(3)','Json'=>'JSON'][$type]??'VARCHAR(32)';
        if($type==='String') {
            if(strpos($attrs,'@db.Uuid')!==false) $sqlType='CHAR(36) CHARACTER SET ascii COLLATE ascii_bin';
            elseif(in_array($name,['email','username','name','publicSlug','slug','status','role','targetType','source','type','passwordHash','grade','modelVersion','frequency','level','reactionType','visibility','profileVisibility','allowMessages'],true)) $sqlType='VARCHAR(255)';
            elseif($name==='url' && strpos($attrs,'@unique')!==false) $sqlType='VARCHAR(700) COLLATE utf8mb4_bin';
            elseif(in_array($name,['createdBy','targetId'],true)) $sqlType='CHAR(36)';
            if($sqlType==='TEXT' && $default!==null) $sqlType='VARCHAR(255)';
        }
        if(preg_match('/@db.Decimal\((\d+),\s*(\d+)\)/',$attrs,$d)) $sqlType='DECIMAL('.$d[1].','.$d[2].')';
        $def='';
        if(in_array($default,['now','updated'],true)) $def=' DEFAULT CURRENT_TIMESTAMP(3)';
        elseif($default!==null && $default!=='uuid') {
            if($type==='Boolean') $def=' DEFAULT '.($default==='true'?'1':'0');
            elseif($type==='Json') $def=" DEFAULT ('".str_replace("'","''",$default)."')";
            elseif($type==='Int') $def=' DEFAULT '.(int)$default;
            else $def=" DEFAULT '".str_replace("'","''",$default)."'";
        }
        $columns[$name]='  `'.$column.'` '.$sqlType.($nullable?' NULL':' NOT NULL').$def;
        if(preg_match('/@id\b/',$attrs)) $primary=[$name];
        if(strpos($attrs,'@unique')!==false) $keys[]='  UNIQUE KEY `'.$table.'_'.$column.'_uq` (`'.$column.'`)';
    }
    if(preg_match('/@@id\(\[([^\]]+)\]/',$m[2],$pk)) $primary=array_map('trim',explode(',',$pk[1]));
    if(!$primary) throw new RuntimeException('No primary key '.$table);
    $keys[]='  PRIMARY KEY (`'.implode('`,`',array_map(function($n)use($fields){return $fields[$n]['column'];},$primary)).'`)';
    preg_match_all('/@@(index|unique)\(\[([^\]]+)\](?:,\s*map:\s*"([^"]+)")?/',$m[2],$indices,PREG_SET_ORDER);
    foreach($indices as $i) {
        $names=array_map('trim',explode(',',$i[2])); $cols=[];
        foreach($names as $n) { $c=$fields[$n]['column']; if(strpos($columns[$n],' TEXT')!==false) $c.='`(191)'; else $c.='`'; $cols[]='`'.$c; }
        $label=$i[3]??substr($table.'_'.implode('_',$names).'_'.$i[1],0,64);
        $keys[]='  '.($i[1]==='unique'?'UNIQUE ':'').'KEY `'.$label.'` ('.implode(',',$cols).')';
    }
    $schema[$table]=['model'=>$m[1],'fields'=>$fields,'primary'=>$primary];
    $sql[]='CREATE TABLE IF NOT EXISTS `'.$table.'` (' . "\n".implode(",\n",array_merge(array_values($columns),$keys))."\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;";
}
foreach($relations as [$table,$target,$local,$remote,$onDelete]) {
    $remoteTable=$nameToTable[$target];
    $lc=array_map(function($n)use($schema,$table){return $schema[$table]['fields'][$n]['column'];},$local);
    $rc=array_map(function($n)use($schema,$remoteTable){return $schema[$remoteTable]['fields'][$n]['column'];},$remote);
    $sql[]='ALTER TABLE `'.$table.'` ADD CONSTRAINT `'.substr($table.'_'.implode('_',$lc).'_fk',0,64).'` FOREIGN KEY (`'.implode('`,`',$lc).'`) REFERENCES `'.$remoteTable.'` (`'.implode('`,`',$rc).'`) ON DELETE '.(['Cascade'=>'CASCADE','SetNull'=>'SET NULL','Restrict'=>'RESTRICT'][$onDelete]??'RESTRICT').';';
}
$dir=__DIR__.'/../database'; if(!is_dir($dir))mkdir($dir,0775,true);
file_put_contents($dir.'/schema.json',json_encode($schema,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n");
file_put_contents($dir.'/001_domain.sql',"-- Generated from the legacy schema; reviewed and run against MySQL 8.4.\n".implode("\n\n",$sql)."\n");
echo count($schema)." domain tables generated\n";
