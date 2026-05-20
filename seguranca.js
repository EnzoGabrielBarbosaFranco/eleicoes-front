// Arquivo: seguranca.js
(function() {
    const clientesAutorizados = [
        'angular-transportes.vercel.app', 
        'localhost',
        '127.0.0.1'
    ];

    const urlSitePai = (window.location !== window.parent.location) ? document.referrer : null;

    if (urlSitePai) {
        try {
            const dominioPai = new URL(urlSitePai).hostname;
            
            if (!clientesAutorizados.some(cliente => dominioPai.includes(cliente))) {
                acionarBloqueio(dominioPai);
            }
        } catch (erro) {
            acionarBloqueio("Origem Desconhecida");
        }
    }

    function acionarBloqueio(dominioPai) {
        // Estilização Premium para o erro
        document.documentElement.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                width: 100vw;
                background-color: #1a1a1a; 
                color: #ffffff; 
                font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; 
                text-align: center; 
                padding: 20px; 
                box-sizing: border-box;
                margin: 0;
            ">
                <div style="
                    background: #2d2d2d; 
                    padding: 25px 20px; 
                    border-radius: 12px; 
                    border-top: 4px solid #ff4757;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    max-width: 90%;
                ">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #ff4757;">Acesso Restrito</h3>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #b2bec3; line-height: 1.4;">
                        Este widget não possui licença para ser exibido neste site:
                    </p>
                    <div style="background: #1a1a1a; padding: 8px; border-radius: 6px; font-family: monospace; color: #ff6b81; font-size: 12px; word-break: break-all;">
                        ${dominioPai}
                    </div>
                </div>
            </div>
        `;
        throw new Error("Widget bloqueado: Domínio sem licença.");
    }
})();