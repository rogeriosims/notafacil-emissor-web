#!/usr/bin/env bash
set -e

REPO_DIR="/home/rogerio/Projetos/1 - nota facil emissor web"
cd "$REPO_DIR"

SPEC_FILE=$(find specs/planned -name "spec.md" | head -n 1)

if [ -z "$SPEC_FILE" ]; then
    echo "❌ Nenhuma spec em estado 'planned' encontrada para despachar."
    exit 1
fi

SPEC_SLUG=$(basename $(dirname "$SPEC_FILE"))
echo "=========================================================="
echo "🚀 Despachando Jules para a spec ativa: $SPEC_SLUG"
echo "=========================================================="

PROMPT="Leia o arquivo JULES.md na raiz do repositório e execute a especificação $SPEC_FILE.
Siga rigorosamente as tarefas TDD (T001 a T009) descritas na seção 14 da spec.
Escreva os testes com a tag SPECSFY:, garanta 100% de cobertura nos cenários BDD e abra uma Pull Request."

echo "Prompt a ser enviado para o Jules:"
echo "$PROMPT"
echo ""

# Verifica se o repositório remoto está configurado
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo "⚠️  Aviso: Repositório remoto (GitHub) ainda não configurado neste repo local."
    echo "Para o Jules clonar e abrir a PR na nuvem, adicione o remote:"
    echo "   git remote add origin git@github.com:seu-usuario/seu-repo.git"
    echo "   git push -u origin main"
    echo ""
    echo "Depois execute:"
    echo "   jules new --repo seu-usuario/seu-repo \"$PROMPT\""
    exit 0
fi

# Se houver remote e login no Jules:
jules new "$PROMPT"
