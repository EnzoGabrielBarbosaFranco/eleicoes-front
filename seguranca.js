(function() {
    const dominiosAutorizados = [
		'apuracao.paineleleitoralnews.com.br',
		'eleicoes-front.vercel.app',
        'angular-transportes.vercel.app',
        'paineleleitoral2026.vercel.app',
        'www.paineleleitoralnews.com.br',
        'tpc.googlesyndication.com',
        'pagead2.googlesyndication.com',
        'securepubads.g.doubleclick.net',
        'googleads.g.doubleclick.net',
        'safeframe.googlesyndication.com',
        'localhost',
        '127.0.0.1'
    ];

    const urlSitePai = (window.location !== window.parent.location) ? document.referrer : null;

    if (urlSitePai) {
        try {
            const dominioPai = new URL(urlSitePai).hostname.toLowerCase();
            const autorizado = dominiosAutorizados.some((dominio) => (
                dominioPai === dominio || dominioPai.endsWith(`.${dominio}`)
            ));

            if (!autorizado) {
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
