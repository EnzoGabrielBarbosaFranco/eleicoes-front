(function() {
    const clientesAutorizados = [
        'angular-transportes.vercel.app', 
        'paineleitoral.vercel.app', // <-- Novo site adicionado aqui
        'localhost',
        '127.0.0.1'
    ];

    const urlSitePai = (window.location !== window.parent.location) ? document.referrer : null;

    if (urlSitePai) {
        try {
            const dominioPai = new URL(urlSitePai).hostname;
            
            if (!clientesAutorizados.some(cliente => dominioPai.includes(cliente))) {
                bloquear();
            }
        } catch (erro) {
            bloquear();
        }
    }

    function bloquear() {
        // Apaga o widget da tela e interrompe o script silenciosamente
        document.documentElement.innerHTML = "";
        throw new Error("Acesso negado: Domínio sem licença.");
    }
})();