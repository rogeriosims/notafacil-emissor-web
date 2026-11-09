<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Nota Fácil Emissor Web</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        <div class="text-center mb-8">
            <h1 class="text-2xl font-bold tracking-tight text-white">Nota Fácil Emissor Web</h1>
            <p class="text-sm text-slate-400 mt-2">Acesso ao ambiente administrativo e emissão</p>
        </div>

        @if ($errors->any())
            <div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                {{ $errors->first() }}
            </div>
        @endif

        <form action="/login" method="POST" class="space-y-4">
            @csrf
            <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">E-mail</label>
                <input type="email" name="email" value="{{ old('email', 'admin@notafacil.local') }}" required autofocus
                       class="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">Senha</label>
                <input type="password" name="password" value="password" required
                       class="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="pt-2">
                <button type="submit"
                        class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-md transition duration-150">
                    Entrar no Sistema
                </button>
            </div>
        </form>

        <div class="mt-6 pt-4 border-t border-slate-700/60 text-xs text-center text-slate-400">
            Credenciais padrão preenchidas para ambiente local
        </div>
    </div>
</body>
</html>
