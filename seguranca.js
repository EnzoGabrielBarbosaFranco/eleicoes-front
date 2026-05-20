// Arquivo: seguranca.js
(function() {
    // 1. Lista Centralizada de Clientes (Adicione os novos domínios aqui)
    const clientesAutorizados = [
        'angular-transportes.vercel.app', // Cliente Exemplo
        'g1.globo.com',                   // Cliente Exemplo
        'localhost'                       // Para você testar no seu PC
    ];

    // 2. Descobre quem está tentando carregar o Iframe
    const urlSitePai = (window.location !== window.parent.location) ? document.referrer : null;

    if (urlSitePai) {
        try {
            const dominioPai = new URL(urlSitePai).hostname;
            
            // 3. Se o domínio do site não estiver na lista VIP, aciona o bloqueio
            if (!clientesAutorizados.some(cliente => dominioPai.includes(cliente))) {
                acionarBloqueio(dominioPai);
            }
        } catch (erro) {
            // Se o navegador tentar esconder ou mascarar o site original, bloqueia por precaução
            acionarBloqueio("Origem Desconhecida");
        }
    }

    // 4. Função que destrói a tela e exibe o aviso
    function acionarBloqueio(dominioPai) {
        // Substitui todo o HTML da página (destrói o layout do widget)
        document.documentElement.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background:#2d3436; color:#ff7675; font-family:sans-serif; text-align:center; padding: 20px; box-sizing: border-box;">
                <h3 style="margin: 0 0 10px 0;">⚠️ Acesso Negado</h3>
                <p style="margin: 0; font-size: 14px;">O site <b>${dominioPai}</b> não possui licença ativa.</p>
            </div>
        `;
        // Trava o JavaScript para impedir que ele busque os votos no Back-end
        throw new Error("Execução interrompida: Widget bloqueado por falta de licença.");
    }
})();