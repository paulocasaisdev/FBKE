<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNÓSTICO DE ERROS DO BACKEND FLASK ===\n";
echo "Diretório Atual: " . getcwd() . "\n\n";

// Encontra o executável python correto na virtualenv
$python_paths = [
    getcwd() . "/.venv/bin/python",
    "/home/" . get_current_user() . "/virtualenv/" . basename(getcwd()) . "/3.10/bin/python",
    "/home/" . get_current_user() . "/virtualenv/public_html/api/3.10/bin/python",
    "python3",
    "python"
];

$python = null;
foreach ($python_paths as $path) {
    if (file_exists($path)) {
        $python = $path;
        echo "Python encontrado em: $path\n";
        break;
    }
}

if (!$python) {
    $python = "python3";
    echo "Usando fallback padrão: python3\n";
}

// Executa o app.py para ver o erro de importação/inicialização
echo "\n--- Executando teste de inicialização do app.py ---\n";
$cmd = "$python app.py 2>&1";
echo "Comando: $cmd\n";
$output = shell_exec($cmd);
echo "Saída:\n";
echo "--------------------------------------------------\n";
echo $output ? $output : "(Sem saída de erro ou sucesso)\n";
echo "--------------------------------------------------\n";

?>
