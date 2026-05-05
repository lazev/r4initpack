#!/usr/bin/env php
<?php

class LazevJSPacker
{
    private string $source;

    public function __construct(string $source)
    {
        $this->source = $source;
    }

    public function pack(bool $strip = true): string
    {
        if ($strip) {
            $this->source = $this->preprocess();
        }

        $wordFreqs = $this->extractWords();

        if (empty($wordFreqs)) {
            fwrite(STDERR, "  Nenhuma palavra encontrada. Retornando source original.\n");
            return $this->source;
        }

        $dict = $this->buildDictionary($wordFreqs);
        $packed = $this->encode($dict['wordToIndex']);
        return $this->generateWrapper($packed, $dict['dictionary']);
    }

    // --- Preprocessor: strip comments + reduce whitespace ---
    // Uses a state machine to never touch content inside strings,
    // template literals, or regex literals.
    private function preprocess(): string
    {
        $src = $this->source;
        $len = strlen($src);
        $out = '';
        $i = 0;

        // State stack: CODE at bottom, push/pop for nested contexts
        // States: CODE, STR_S, STR_D, TPL, TPL_EXPR, REGEX
        $stack = ['CODE'];
        $braceDepth = [0]; // only meaningful for TPL_EXPR

        $prevCode = ''; // last non-whitespace char emitted in code context
        $prevWord = ''; // last word being built (for regex-after-keyword detection)
        $wsBuffer = ''; // pending whitespace in code context
        $tplLineStart = false; // true after \n inside template literal (strips indentation)

        // Keywords after which / starts a regex, not division
        $regexKeywords = array_flip([
            'return', 'typeof', 'void', 'delete', 'throw', 'new',
            'in', 'case', 'instanceof', 'yield', 'await', 'else', 'do',
        ]);

        while ($i < $len) {
            $state = end($stack);
            $c = $src[$i];
            $n = ($i + 1 < $len) ? $src[$i + 1] : '';

            // ---- Protected states: output verbatim ----
            if ($state === 'STR_S' || $state === 'STR_D') {
                $out .= $c;
                if ($c === '\\' && $i + 1 < $len) {
                    $out .= $src[++$i];
                } elseif (($state === 'STR_S' && $c === "'") || ($state === 'STR_D' && $c === '"')) {
                    array_pop($stack);
                    $prevCode = $c;
                }
                $i++;
                continue;
            }

            if ($state === 'TPL') {
                // Strip leading whitespace (indentation) from lines inside template literals
                if ($tplLineStart && ($c === ' ' || $c === "\t")) {
                    $i++;
                    continue;
                }
                if ($c === "\n") {
                    $tplLineStart = true;
                } else {
                    $tplLineStart = false;
                }

                $out .= $c;
                if ($c === '\\' && $i + 1 < $len) {
                    $out .= $src[++$i];
                } elseif ($c === '$' && $n === '{') {
                    $out .= '{';
                    $i++;
                    $stack[] = 'TPL_EXPR';
                    $braceDepth[] = 0;
                } elseif ($c === '`') {
                    array_pop($stack);
                    $prevCode = $c;
                    $tplLineStart = false;
                }
                $i++;
                continue;
            }

            if ($state === 'REGEX') {
                $out .= $c;
                if ($c === '\\' && $i + 1 < $len) {
                    $out .= $src[++$i];
                } elseif ($c === '[') {
                    // character class — scan until ]
                    $i++;
                    while ($i < $len && $src[$i] !== ']') {
                        $out .= $src[$i];
                        if ($src[$i] === '\\' && $i + 1 < $len) { $out .= $src[++$i]; }
                        $i++;
                    }
                    if ($i < $len) { $out .= ']'; }
                } elseif ($c === '/') {
                    // end of regex — consume flags
                    $i++;
                    while ($i < $len && ctype_alpha($src[$i])) { $out .= $src[$i++]; }
                    array_pop($stack);
                    $prevCode = '/';
                    continue; // i already advanced
                }
                $i++;
                continue;
            }

            // ---- CODE / TPL_EXPR state ----

            // Line comment: skip until newline
            if ($c === '/' && $n === '/') {
                $i += 2;
                while ($i < $len && $src[$i] !== "\n") { $i++; }
                // the \n itself will be processed in the next iteration
                continue;
            }

            // Block comment: skip, preserve one newline if it spanned lines
            if ($c === '/' && $n === '*') {
                $i += 2;
                $hadNL = false;
                while ($i < $len) {
                    if ($src[$i] === "\n") { $hadNL = true; }
                    if ($src[$i] === '*' && ($i + 1 < $len) && $src[$i + 1] === '/') {
                        $i += 2;
                        break;
                    }
                    $i++;
                }
                if ($hadNL) {
                    $wsBuffer = "\n";
                } elseif ($wsBuffer === '') {
                    $wsBuffer = ' ';
                }
                continue;
            }

            // Enter string
            if ($c === "'" || $c === '"') {
                $this->flushWs($out, $wsBuffer, $prevCode, $c);
                $out .= $c;
                $stack[] = ($c === "'") ? 'STR_S' : 'STR_D';
                $prevCode = $c;
                $prevWord = '';
                $i++;
                continue;
            }

            // Enter template literal
            if ($c === '`') {
                $this->flushWs($out, $wsBuffer, $prevCode, $c);
                $out .= $c;
                $stack[] = 'TPL';
                $prevCode = $c;
                $prevWord = '';
                $i++;
                continue;
            }

            // Enter regex: / is regex when preceded by a keyword (return, typeof, etc.)
            // or when the previous non-ws char is NOT an identifier-end, ), or ]
            $isRegex = ($c === '/' && $n !== '/' && $n !== '*'
                && (!preg_match('/[\w)$\]]/', $prevCode) || isset($regexKeywords[$prevWord])));
            if ($isRegex) {
                $this->flushWs($out, $wsBuffer, $prevCode, $c);
                $out .= $c;
                $stack[] = 'REGEX';
                $prevCode = $c;
                $prevWord = '';
                $i++;
                continue;
            }

            // Brace tracking for TPL_EXPR
            if ($state === 'TPL_EXPR') {
                if ($c === '{') {
                    $braceDepth[count($braceDepth) - 1]++;
                } elseif ($c === '}') {
                    $depth = &$braceDepth[count($braceDepth) - 1];
                    if ($depth === 0) {
                        // End of template expression — back to TPL
                        $this->flushWs($out, $wsBuffer, $prevCode, $c);
                        $out .= '}';
                        array_pop($stack);
                        array_pop($braceDepth);
                        $prevCode = '}';
                        $prevWord = '';
                        $i++;
                        continue;
                    }
                    $depth--;
                }
            }

            // Whitespace: buffer it
            if ($c === ' ' || $c === "\t") {
                if ($wsBuffer === '' || $wsBuffer === ' ') {
                    $wsBuffer = ' ';
                }
                // if wsBuffer is already "\n", keep it as newline (higher priority)
                $i++;
                continue;
            }
            if ($c === "\n") {
                $wsBuffer = "\n"; // newline takes priority over space
                $i++;
                continue;
            }
            if ($c === "\r") {
                $i++;
                continue;
            }

            // Normal code char: flush buffered whitespace, emit char
            $this->flushWs($out, $wsBuffer, $prevCode, $c);
            $out .= $c;
            $prevCode = $c;
            // Track word being built (for regex-after-keyword detection)
            if (ctype_alnum($c) || $c === '_') {
                $prevWord .= $c;
            } else {
                $prevWord = '';
            }
            $i++;
        }

        return $out;
    }

    // Flush pending whitespace.
    // Newline: kept only when ASI might be needed (prev char is NOT ;)
    // Space: only emitted when BOTH neighbors are word-like characters,
    //        otherwise the space is purely cosmetic and can be dropped.
    // JS identifier chars not in \w: $ and Unicode (\x80-\xFF in single-byte).
    // Without this, spaces between e.g. return $, const café would be dropped.
    //
    // Newline handling: ASI can only trigger when the previous token could
    // end a statement. Characters that REQUIRE a continuation (operators,
    // opening brackets, comma, etc.) make ASI impossible, so the newline
    // can safely be dropped after them.
    private static string $asiSafe = ';,{([.?:&|^~*/%!<>=+-';

    private function flushWs(string &$out, string &$ws, string $prevCode, string $nextChar): void
    {
        if ($ws === '') return;

        if ($ws === "\n" && strpos(self::$asiSafe, $prevCode) === false) {
            $out .= "\n";
        } elseif (preg_match('/[\w$\x80-\xFF]/', $prevCode) && preg_match('/[\w$\x80-\xFF]/', $nextChar)) {
            $out .= ' '; // mandatory: separates two word-like tokens
        }
        // else: space between punctuation/operator — discard
        $ws = '';
    }

    // --- Step 1: Extract all words and their frequencies ---
    private function extractWords(): array
    {
        // Must use \w+ to match the unpacker's \b\w+\b regex.
        // This captures number literals (0, 1, 2...) so they occupy their
        // natural base-62 slots and don't collide with encoded words.
        preg_match_all('/\w+/', $this->source, $matches);
        $freqs = [];
        foreach ($matches[0] as $word) {
            $freqs[$word] = ($freqs[$word] ?? 0) + 1;
        }
        return $freqs;
    }

    // --- Step 2: Build dictionary with optimal index assignment ---
    private function buildDictionary(array $wordFreqs): array
    {
        $allWords = array_keys($wordFreqs);
        $count = count($allWords);

        // Phase A: reserve natural slots
        // If toBase62(i) exists as a word in the source, assign it to slot i
        $dictionary = array_fill(0, $count, '');
        $wordToIndex = [];
        $placedWords = [];
        $occupiedSlots = [];

        for ($i = 0; $i < $count; $i++) {
            $b62 = self::toBase62($i);
            if (isset($wordFreqs[$b62])) {
                $dictionary[$i] = ''; // empty = word is its own index
                $wordToIndex[$b62] = $i;
                $placedWords[$b62] = true;
                $occupiedSlots[$i] = true;
            }
        }

        // Phase B: assign remaining words by frequency (most frequent → shortest index)
        $remaining = [];
        foreach ($wordFreqs as $word => $freq) {
            if (!isset($placedWords[$word])) {
                $remaining[] = ['word' => $word, 'freq' => $freq];
            }
        }
        usort($remaining, fn($a, $b) => $b['freq'] - $a['freq']);

        $slotIdx = 0;
        foreach ($remaining as $entry) {
            while (isset($occupiedSlots[$slotIdx])) {
                $slotIdx++;
            }
            $dictionary[$slotIdx] = $entry['word'];
            $wordToIndex[$entry['word']] = $slotIdx;
            $occupiedSlots[$slotIdx] = true;
            $slotIdx++;
        }

        return [
            'dictionary' => $dictionary,
            'wordToIndex' => $wordToIndex,
        ];
    }

    // --- Step 3: Replace all words with base-62 indices ---
    private function encode(array $wordToIndex): string
    {
        return preg_replace_callback(
            '/\w+/',
            fn($m) => self::toBase62($wordToIndex[$m[0]]),
            $this->source
        );
    }

    // --- Step 4: Escape string for embedding in JS single-quoted string ---
    private static function escapeForJS(string $str): string
    {
        return str_replace(
            ['\\',   "'",   "\n",  "\r",  "\t"],
            ['\\\\', "\\'", '\\n', '\\r', '\\t'],
            $str
        );
    }

    // --- Step 5: Generate the eval() wrapper ---
    private function generateWrapper(string $packed, array $dictionary): string
    {
        $count = count($dictionary);
        $escapedPacked = self::escapeForJS($packed);
        $escapedDict = self::escapeForJS(implode('|', $dictionary));

        // Script injection instead of eval() so that top-level let/const
        // declarations end up in the global declarative scope (accessible
        // to other scripts), not trapped in an eval block scope.
        $bootstrap = "(function(c){var s=document.createElement('script');s.textContent=c;document.head.appendChild(s);document.head.removeChild(s)}(function(p,a,c,k,e,d)"
            . "{e=function(c){return(c<a?'':e(parseInt(c/a)))"
            . "+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};"
            . "if(!''.replace(/^/,String))"
            . "{while(c--){d[e(c)]=k[c]||e(c)}"
            . "k=[function(e){return d[e]}];"
            . "e=function(){return'\\\\w+'};"
            . "c=1};"
            . "while(c--){if(k[c])"
            . "{p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c])}}"
            . "return p}"
            . "('{$escapedPacked}',62,{$count},'{$escapedDict}'.split('|'),0,{})))";

        return $bootstrap;
    }

    // --- Utility: number to base-62 ---
    private static function toBase62(int $n): string
    {
        $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if ($n < 62) {
            return $chars[$n];
        }
        return self::toBase62(intdiv($n, 62)) . $chars[$n % 62];
    }
}

// ============================================================
// CLI — executa apenas quando chamado diretamente
// Quando o arquivo é incluído via require/include, só a classe
// LazevJSPacker fica disponível para instanciação.
// ============================================================

if (php_sapi_name() !== 'cli' || realpath($argv[0]) !== realpath(__FILE__)) {
    return; // incluído como biblioteca — expõe apenas a classe
}

if ($argc < 2 || in_array($argv[1], ['--help', '-h'])) {
    fwrite(STDERR, "lazevJSPacker - Empacotador JS moderno (base-62)\n\n");
    fwrite(STDERR, "Uso: php lazevJSPacker.php <input.js> [opcoes]\n\n");
    fwrite(STDERR, "  <input.js>       Arquivo JS a ser empacotado\n");
    fwrite(STDERR, "  -o <output.js>   Salvar resultado em arquivo (default: stdout)\n");
    fwrite(STDERR, "  --nostrip        Manter comentarios e whitespace (default: remove)\n");
    exit($argc < 2 ? 1 : 0);
}

$inputFile = null;
$outputFile = null;
$strip = true;

for ($i = 1; $i < $argc; $i++) {
    if ($argv[$i] === '-o' && isset($argv[$i + 1])) {
        $outputFile = $argv[++$i];
    } elseif ($argv[$i] === '--nostrip') {
        $strip = false;
    } elseif ($inputFile === null && $argv[$i][0] !== '-') {
        $inputFile = $argv[$i];
    }
}

if ($inputFile === null || !is_file($inputFile)) {
    fwrite(STDERR, "Erro: arquivo '{$inputFile}' nao encontrado.\n");
    exit(1);
}

$source = file_get_contents($inputFile);
if ($source === false) {
    fwrite(STDERR, "Erro: nao foi possivel ler '{$inputFile}'.\n");
    exit(1);
}

$originalSize = strlen($source);
fwrite(STDERR, "lazevJSPacker\n");
fwrite(STDERR, "  Entrada:  {$inputFile} ({$originalSize} bytes)\n");

$packer = new LazevJSPacker($source);
$result = $packer->pack($strip);
fwrite(STDERR, "  Strip:    " . ($strip ? "comentarios e whitespace removidos" : "desativado (--nostrip)") . "\n");

$packedSize = strlen($result);
$ratio = $originalSize > 0 ? round(($packedSize / $originalSize) * 100, 1) : 0;

fwrite(STDERR, "  Saida:    {$packedSize} bytes ({$ratio}% do original)\n");

preg_match_all('/\w+/', $source, $m);
$uniqueWords = count(array_unique($m[0]));
fwrite(STDERR, "  Palavras: {$uniqueWords} unicas\n");

if ($outputFile) {
    file_put_contents($outputFile, $result);
    fwrite(STDERR, "  Gravado:  {$outputFile}\n");
} else {
    echo $result;
}