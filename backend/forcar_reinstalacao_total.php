<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== RECONSTRUÇÃO COMPLETA DA VIRTUALENV (.venv) ===\n";
echo "Diretório Atual: " . getcwd() . "\n\n";

$venv_dir = getcwd() . "/.venv";

// Função para deletar uma pasta inteira recursivamente
function deletar_pasta_recursiva($dir) {
    if (!file_exists($dir)) return;
    $files = array_diff(scandir($dir), array('.','..'));
    foreach ($files as $file) {
        (is_dir("$dir/$file")) ? deletar_pasta_recursiva("$dir/$file") : unlink("$dir/$file");
    }
    return rmdir($dir);
}

// 1. Exclui a virtualenv antiga completamente
echo "1. Excluindo virtualenv corrompida antiga (.venv)...\n";
if (file_exists($venv_dir)) {
    if (deletar_pasta_recursiva($venv_dir)) {
        echo "  -> .venv excluída com sucesso!\n";
    } else {
        echo "  -> Erro ao excluir .venv. Tentando remover via shell...\n";
        shell_exec("rm -rf " . escapeshellarg($venv_dir));
    }
} else {
    echo "  -> .venv não existia localmente.\n";
}

// 2. Cria uma nova virtualenv limpa no Linux
echo "\n2. Criando nova virtualenv limpa...\n";
$criado = false;
$cmds_criar = array(
    "python3 -m venv .venv 2>&1",
    "virtualenv -p python3 .venv 2>&1",
    "python3 -m virtualenv .venv 2>&1"
);

foreach ($cmds_criar as $cmd) {
    echo "   Executando: $cmd\n";
    $output = shell_exec($cmd);
    echo $output ? "   Saída: " . trim($output) . "\n" : "   Sucesso (sem saída).\n";
    
    $py_exec = "";
    if (file_exists($venv_dir . "/bin/python")) {
        $py_exec = $venv_dir . "/bin/python";
    } elseif (file_exists($venv_dir . "/bin/python3")) {
        $py_exec = $venv_dir . "/bin/python3";
        // Cria link simbólico ou copia para 'python'
        @symlink("python3", $venv_dir . "/bin/python");
        if (!file_exists($venv_dir . "/bin/python")) {
            @copy($venv_dir . "/bin/python3", $venv_dir . "/bin/python");
        }
    }

    if ($py_exec !== "") {
        echo "   -> Virtualenv criada com sucesso usando este comando!\n";
        $criado = true;
        break;
    }
    echo "   -> Falhou. Tentando próxima alternativa...\n";
}

if (!$criado) {
    echo "❌ Erro Crítico: Não foi possível criar a virtualenv no servidor.\n";
    exit;
}

// Garante permissões de execução dos executáveis recém-criados
@chmod($venv_dir . "/bin/python", 0755);
@chmod($venv_dir . "/bin/python3", 0755);
@chmod($venv_dir . "/bin/pip", 0755);
@chmod($venv_dir . "/bin/pip3", 0755);

// 3. Instala as dependências limpas do requirements.txt
echo "\n3. Instalando dependências estáveis a partir do 'requirements.txt'...\n";
echo "   (Isso pode levar de 30 a 60 segundos porque instalará Flask, Supabase, etc. do zero)\n";
echo "----------------------------------------------------------------------\n";

$requirements_file = getcwd() . "/requirements.txt";
if (file_exists($requirements_file)) {
    // Usa o pip da nova virtualenv criada localmente no Linux (sem dar Permission Denied)
    $install_cmd = "./.venv/bin/python -m pip install --no-cache-dir -r requirements.txt 2>&1";
    echo "Executando: $install_cmd\n\n";
    
    $output_install = shell_exec($install_cmd);
    echo $output_install ? $output_install : "(Sem resposta do instalador pip)\n";
} else {
    echo "Erro: requirements.txt não encontrado no diretório atual!\n";
}
echo "----------------------------------------------------------------------\n";

// 4. Garante que os arquivos .fcgi do deploy estejam limpos e executáveis
echo "\n4. Aplicando correções finais de arquivos e permissões (index.fcgi e diagnostico.fcgi)...\n";
$scripts = array('index.fcgi', 'diagnostico.fcgi');
foreach ($scripts as $script) {
    $script_path = getcwd() . "/" . $script;
    if (file_exists($script_path)) {
        $content = file_get_contents($script_path);
        if (strpos($content, "\r\n") !== false) {
            file_put_contents($script_path, str_replace("\r\n", "\n", $content));
            echo "  -> '$script' convertido para LF.\n";
        }
        @chmod($script_path, 0755);
        echo "  -> '$script' permissão definida para 755.\n";
    }
}

// 5. Testando importação final do Flask
echo "\n5. Testando se o Flask e rotas iniciam sem erros:\n";
echo "----------------------------------------------------------------------\n";
$test_cmd = "./.venv/bin/python diagnostico.fcgi 2>&1";
$test_output = shell_exec($test_cmd);
echo $test_output ? $test_output : "(Sem resposta do teste)\n";
echo "----------------------------------------------------------------------\n";

echo "\nProcedimento concluído!";
?>
