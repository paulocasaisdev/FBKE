<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== FORÇAR DELEÇÃO E REINSTALAÇÃO DO PYDANTIC (PHP) ===\n";
echo "Diretório Atual: " . getcwd() . "\n\n";

$python_bin = getcwd() . "/.venv/bin/python";
$target_lib = getcwd() . "/.venv/lib/python3.9/site-packages";
$target_lib64 = getcwd() . "/.venv/lib64/python3.9/site-packages";

// Função para deletar uma pasta recursivamente
function deletar_pasta($dir) {
    if (!file_exists($dir)) return;
    $files = array_diff(scandir($dir), array('.','..'));
    foreach ($files as $file) {
        (is_dir("$dir/$file")) ? deletar_pasta("$dir/$file") : unlink("$dir/$file");
    }
    return rmdir($dir);
}

if (file_exists($python_bin)) {
    echo "1. Python da virtualenv encontrado em: $python_bin\n";
    @chmod($python_bin, 0755);
    
    // Apaga completamente as pastas corrompidas de lib e lib64
    echo "2. Deletando permanentemente pastas antigas de ambos os pacotes:\n";
    
    $paths_to_delete = array(
        $target_lib . "/pydantic",
        $target_lib . "/pydantic_core",
        $target_lib . "/annotated_types",
        $target_lib . "/typing_extensions.py",
        $target_lib . "/typing_inspection",
        $target_lib64 . "/pydantic",
        $target_lib64 . "/pydantic_core",
        $target_lib64 . "/annotated_types",
        $target_lib64 . "/typing_extensions.py",
        $target_lib64 . "/typing_inspection"
    );
    
    foreach ($paths_to_delete as $path) {
        if (file_exists($path)) {
            if (is_dir($path)) {
                deletar_pasta($path);
                echo "  -> Diretório '$path' excluído com sucesso.\n";
            } else {
                unlink($path);
                echo "  -> Arquivo '$path' excluído com sucesso.\n";
            }
        }
    }
    
    // Usa o pip global do sistema apontando para a pasta site-packages da virtualenv
    // Contorna a quebra de sintaxe interna na ferramenta pip da própria virtualenv
    echo "\n3. Instalando pacotes novos e limpos usando o Python do Sistema na pasta da .venv:\n";
    echo "----------------------------------------------------------------------\n";
    $cmd = "python3 -m pip install --target=" . escapeshellarg($target_lib) . " --no-cache-dir pydantic pydantic-core 2>&1";
    echo "Comando Executado: $cmd\n\n";
    
    $output = shell_exec($cmd);
    echo $output ? $output : "(Sem resposta do comando pip)\n";
    echo "----------------------------------------------------------------------\n";
    
    // 4. Testa a importação do app
    echo "\n4. Testando importação final do Flask:\n";
    echo "----------------------------------------------------------------------\n";
    $test_cmd = "./.venv/bin/python diagnostico.fcgi 2>&1";
    $test_output = shell_exec($test_cmd);
    echo $test_output ? $test_output : "(Sem resposta do teste de importação)\n";
    echo "----------------------------------------------------------------------\n";
    
} else {
    echo "❌ Erro Crítico: Python da virtualenv não encontrado em: $python_bin\n";
}

echo "\nProcedimento concluído!";
?>
