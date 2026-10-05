(function () {
    'use strict';

    const FUSO_BRASILIA = 'America/Sao_Paulo';
    const DATA_VESPERA = '2026-10-03';
    const DATA_ELEICAO = '2026-10-04';
    const HORA_INICIO_VOTACAO = 8;
    const INTERVALO_ATUALIZACAO = 30000;
    const DURACAO_TESTE_TRANSICAO = 10 * 1000;
    const PREFIXO_TESTE_TRANSICAO = 'pre26-teste-transicao:';
    const BREAKPOINT_PADRAO = 760;
    const modoEmbed = new URLSearchParams(window.location.search).get('embed-modo');
    const breakpoint = configurarBreakpoint();
    const consultaMobile = modoEmbed === 'mobile' ? 'all'
        : modoEmbed === 'desktop' ? 'not all' : `(max-width: ${breakpoint}px)`;
    const consultaDesktop = modoEmbed === 'desktop' ? 'all'
        : modoEmbed === 'mobile' ? 'not all' : `(min-width: ${breakpoint + 1}px)`;
    const LINK_TSE = 'https://resultados.tse.jus.br/';
    const LINK_LOCAL_VOTACAO = 'https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral#/onde-votar';
    const LINK_ADQUIRIR = 'https://placardasurnas.com.br/';

    const configuracaoVisual = obterConfiguracaoVisual();
    aplicarCoresPersonalizadas(configuracaoVisual);

    const formatoOriginal = document.body.dataset.widget || '';
    const indexCompacto = prepararIndexResponsivo();
    const testeTransicao = prepararTesteTransicao();
    const modoForcado = obterModoForcado();
    let modoAtual = testeTransicao.ativo ? 'dia' : (testeTransicao.concluido ? '' : obterModo());

    window.PreEleicao2026 = {
        breakpoint,
        consultaMobile,
        consultaDesktop,
        ativo: Boolean(modoAtual),
        modo: modoAtual,
        testeTransicao: testeTransicao.ativo,
        forcarDadosOficiais: testeTransicao.concluido
    };

    if (modoAtual) {
        renderizar(modoAtual);
        if (testeTransicao.ativo) iniciarContagemTeste(testeTransicao.terminaEm);
    } else {
        aplicarIdentidadeNormal();
        document.addEventListener('DOMContentLoaded', aplicarIdentidadeNormal, { once: true });
    }

    if (!modoForcado && !testeTransicao.solicitado) {
        window.setInterval(atualizarModo, INTERVALO_ATUALIZACAO);
        agendarProximaTransicao();
        window.addEventListener('focus', atualizarModo);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) atualizarModo();
        });
    }

    window.addEventListener('resize', () => {
        if (formatoOriginal !== 'padrao') return;
        const deveUsarFormatoCompacto = window.matchMedia(consultaMobile).matches;
        if (deveUsarFormatoCompacto !== indexCompacto) window.location.reload();
    });

    function configurarBreakpoint() {
        // Alinhar CSS e JS internos com o breakpoint do embed, sem tocar no
        // portal cliente nem nas media queries menores de cada formato.
        const informado = Number(new URLSearchParams(window.location.search).get('breakpoint'));
        const efetivo = Number.isInteger(informado) && informado > 0 && informado <= 10000
            ? informado : BREAKPOINT_PADRAO;
        document.documentElement.dataset.embedBreakpoint = String(efetivo);
        const incorporado = modoEmbed === 'mobile' || modoEmbed === 'desktop';
        if (efetivo === BREAKPOINT_PADRAO && !incorporado) return efetivo;
        const limiteMobile = incorporado ? (modoEmbed === 'mobile' ? 10000 : 0) : efetivo;
        const inicioDesktop = incorporado ? (modoEmbed === 'desktop' ? 0 : 10001) : efetivo + 1;
        const adaptar = regras => {
            for (const regra of regras) {
                if (regra.type === CSSRule.MEDIA_RULE) {
                    regra.media.mediaText = regra.media.mediaText
                        .replace(/\(max-width:\s*760px\)/g, `(max-width: ${limiteMobile}px)`)
                        .replace(/\(min-width:\s*761px\)/g, `(min-width: ${inicioDesktop}px)`);
                }
                if (regra.cssRules) adaptar(regra.cssRules);
            }
        };
        for (const folha of document.styleSheets) {
            if (folha.href && new URL(folha.href).origin !== window.location.origin) continue;
            adaptar(folha.cssRules);
        }
        return efetivo;
    }

    function obterPrimeiroParametro(parametros, nomes) {
        for (const nome of nomes) {
            const valor = parametros.get(nome);
            if (valor != null && valor.trim()) return valor.trim();
        }
        return '';
    }

    function obterConfiguracaoVisual() {
        const parametros = new URLSearchParams(window.location.search);
        const corValida = (...nomes) => {
            const valor = obterPrimeiroParametro(parametros, nomes);
            return /^#[0-9a-f]{6}$/i.test(valor || '') ? valor : '';
        };
        const marca = obterPrimeiroParametro(parametros, ['marca', 'nome']).slice(0, 60);
        const visao = obterPrimeiroParametro(parametros, ['visao', 'view']).toLowerCase();

        return {
            marca,
            visao: visao === 'geral' || visao === 'candidatos' ? visao : 'candidatos',
            primaria: corValida('corPrimaria', 'cor1'),
            destaque: corValida('corDestaque', 'cor2'),
            clara: corValida('corClara', 'cor3')
        };
    }

    function aplicarCoresPersonalizadas(configuracao) {
        const { primaria, destaque, clara } = configuracao;
        const estilo = document.documentElement.style;

        document.body.dataset.visaoInicial = configuracao.visao;
        if (configuracao.marca) document.body.dataset.marcaPersonalizada = configuracao.marca;

        if (primaria) {
            estilo.setProperty('--ink', primaria);
            estilo.setProperty('--ink-soft', primaria);
            estilo.setProperty('--brand-950', primaria);
            estilo.setProperty('--brand-900', primaria);
            estilo.setProperty('--brand-800', primaria);
        }
        if (destaque) {
            estilo.setProperty('--mint-strong', destaque);
            estilo.setProperty('--mint-dark', destaque);
            estilo.setProperty('--brand-700', destaque);
            estilo.setProperty('--success-700', destaque);
            estilo.setProperty('--success-600', destaque);
        }
        if (clara) {
            estilo.setProperty('--mint', clara);
            estilo.setProperty('--brand-100', clara);
            estilo.setProperty('--brand-50', `color-mix(in srgb, ${clara} 24%, #fff)`);
            estilo.setProperty('--success-100', `color-mix(in srgb, ${clara} 48%, #fff)`);
        }
    }

    function prepararIndexResponsivo() {
        const deveUsarFormatoCompacto = formatoOriginal === 'padrao'
            && window.matchMedia(consultaMobile).matches;
        if (!deveUsarFormatoCompacto) return false;

        document.body.dataset.widget = '300x250';
        document.body.classList.add('index-mobile-300x250');

        const statusLabel = document.querySelector('.status-label');
        const statusDot = statusLabel?.querySelector('.status-dot');
        const ultimaAtualizacao = document.getElementById('ultima-atualizacao');
        if (statusLabel && statusDot && ultimaAtualizacao) {
            statusLabel.replaceChildren(statusDot, document.createTextNode('Apuradas '), ultimaAtualizacao);
        }

        const resumo = document.querySelector('.resumo-votos');
        if (resumo && !document.querySelector('.resumo-toggle')) {
            resumo.id = 'bloco-resumo';
            resumo.classList.add('oculto');

            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'resumo-toggle';
            botao.setAttribute('aria-expanded', 'false');
            botao.setAttribute('aria-controls', 'bloco-resumo');
            botao.innerHTML = '<span id="txt-toggle">Ver resumo de votos</span>';
            botao.addEventListener('click', () => window.toggleResumo?.());
            resumo.before(botao);
        }

        return true;
    }

    function obterDataHoraBrasilia() {
        const partes = new Intl.DateTimeFormat('en-CA', {
            timeZone: FUSO_BRASILIA,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        }).formatToParts(new Date());
        const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
        return {
            data: `${valores.year}-${valores.month}-${valores.day}`,
            hora: Number(valores.hour),
            minuto: Number(valores.minute),
            segundo: Number(valores.second)
        };
    }

    function agendarProximaTransicao() {
        const { data, hora, minuto, segundo } = obterDataHoraBrasilia();
        const segundosDoDia = (hora * 60 * 60) + (minuto * 60) + segundo;
        let segundosRestantes = 0;

        if (data === DATA_VESPERA) {
            segundosRestantes = (24 * 60 * 60) - segundosDoDia;
        } else if (data === DATA_ELEICAO && hora < HORA_INICIO_VOTACAO) {
            segundosRestantes = (HORA_INICIO_VOTACAO * 60 * 60) - segundosDoDia;
        }

        if (segundosRestantes <= 0) return;

        window.setTimeout(() => {
            atualizarModo();
            agendarProximaTransicao();
        }, (segundosRestantes * 1000) + 250);
    }

    function obterModoForcado() {
        const ambienteLocal = window.location.hostname === '127.0.0.1'
            || window.location.hostname === 'localhost';
        if (!ambienteLocal) return '';

        const modo = new URLSearchParams(window.location.search).get('pre-eleicao');
        return modo === 'vespera' || modo === 'dia' ? modo : '';
    }

    function prepararTesteTransicao() {
        const ambienteLocal = window.location.hostname === '127.0.0.1'
            || window.location.hostname === 'localhost';
        const parametros = new URLSearchParams(window.location.search);
        const solicitado = ambienteLocal && parametros.get('pre-eleicao') === 'teste';

        if (!solicitado) {
            return { solicitado: false, ativo: false, concluido: false, terminaEm: 0 };
        }

        const chave = `${PREFIXO_TESTE_TRANSICAO}${window.location.pathname}`;
        if (parametros.get('reiniciar') === '1') {
            window.sessionStorage.removeItem(chave);
            parametros.delete('reiniciar');
            const consulta = parametros.toString();
            window.history.replaceState(null, '', `${window.location.pathname}${consulta ? `?${consulta}` : ''}${window.location.hash}`);
        }

        let estado = null;
        try {
            estado = JSON.parse(window.sessionStorage.getItem(chave) || 'null');
        } catch {
            window.sessionStorage.removeItem(chave);
        }

        if (!estado || (!estado.terminaEm && !estado.concluido)) {
            const segundosInformados = Number(parametros.get('duracao'));
            const duracao = Number.isFinite(segundosInformados) && segundosInformados >= 2 && segundosInformados <= 120
                ? segundosInformados * 1000
                : DURACAO_TESTE_TRANSICAO;
            estado = { terminaEm: Date.now() + duracao, concluido: false };
            window.sessionStorage.setItem(chave, JSON.stringify(estado));
        }

        if (estado.concluido || Number(estado.terminaEm) <= Date.now()) {
            const concluido = { terminaEm: Number(estado.terminaEm) || Date.now(), concluido: true };
            window.sessionStorage.setItem(chave, JSON.stringify(concluido));
            return { solicitado: true, ativo: false, concluido: true, terminaEm: concluido.terminaEm };
        }

        return {
            solicitado: true,
            ativo: true,
            concluido: false,
            terminaEm: Number(estado.terminaEm),
            chave
        };
    }

    function iniciarContagemTeste(terminaEm) {
        document.body.classList.add('modo-teste-transicao-2026');
        const horario = document.querySelector('.pre26-horario');
        if (!horario) return;

        const atualizarContagem = () => {
            const restante = Math.max(0, terminaEm - Date.now());
            const segundosTotais = Math.ceil(restante / 1000);
            const minutos = Math.floor(segundosTotais / 60);
            const segundos = String(segundosTotais % 60).padStart(2, '0');
            horario.textContent = `TESTE — ABRINDO OFICIAL EM ${minutos}:${segundos}`;

            if (restante > 0) return;

            window.clearInterval(intervalo);
            window.sessionStorage.setItem(testeTransicao.chave, JSON.stringify({
                terminaEm,
                concluido: true
            }));
            window.location.reload();
        };

        const intervalo = window.setInterval(atualizarContagem, 250);
        atualizarContagem();
    }

    function obterModo() {
        const forcar = obterModoForcado();
        if (forcar) return forcar;

        const { data, hora } = obterDataHoraBrasilia();
        if (data === DATA_VESPERA) return 'vespera';
        if (data === DATA_ELEICAO && hora < HORA_INICIO_VOTACAO) return 'dia';
        return '';
    }

    function atualizarModo() {
        if (modoForcado) return;
        const proximoModo = obterModo();
        if (proximoModo === modoAtual) return;

        if (!modoAtual || !proximoModo) {
            window.location.reload();
            return;
        }

        modoAtual = proximoModo;
        window.PreEleicao2026.ativo = true;
        window.PreEleicao2026.modo = proximoModo;
        renderizar(proximoModo);
    }

    function aplicarIdentidadeNormal() {
        const cabecalho = document.querySelector('.header-brand');
        if (!cabecalho) return;

        const tituloMarca = cabecalho.querySelector('.header-copy h1, .header-copy h2');
        if (tituloMarca) {
            tituloMarca.textContent = configuracaoVisual.marca
                ? `${configuracaoVisual.marca} · 2026` : 'Placar das Urnas';
        }

        if (!cabecalho.querySelector('.brand-mark')) {
            const marca = document.createElement('span');
            marca.className = 'brand-mark';
            marca.setAttribute('aria-hidden', 'true');
            cabecalho.prepend(marca);
        }
        document.body.classList.add('identidade-2026');
    }

    function escaparHtml(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function icone(tipo) {
        const icones = {
            tse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18L12 3Z"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18"/></svg>',
            local: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-13a7 7 0 1 0-14 0c0 6.8 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
            painel: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3M8 9h8M8 13h5"/></svg>'
        };
        return icones[tipo] || '';
    }

    function renderizar(modo) {
        const diaEleicao = modo === 'dia';
        const titulo = diaEleicao
            ? 'Hoje começam as Eleições 2026'
            : '1 dia para as Eleições 2026';
        const descricao = diaEleicao
            ? 'A votação começa às 8h e segue até as 17h.'
            : 'Domingo, 4 de outubro de 2026';
        const destaque = diaEleicao ? '8h' : '1';
        const rotuloDestaque = diaEleicao ? 'início' : 'dia';
        const nomeMarca = escaparHtml(configuracaoVisual.marca || 'Placar das Urnas');

        document.documentElement.classList.add('pre26-ativo');
        document.body.classList.add('modo-pre-eleicao-2026');
        document.title = `${titulo} — Placar das Urnas`;
        document.body.innerHTML = `
            <main class="pre26-painel pre26-painel--${modo}" aria-labelledby="pre26-titulo">
                <header class="pre26-marca">
                    <span class="brand-mark" aria-hidden="true"></span>
                    <span class="pre26-nome">${nomeMarca}</span>
                    <strong>2026</strong>
                    <span class="pre26-turno">1º turno</span>
                </header>

                <section class="pre26-conteudo">
                    <div class="pre26-hero">
                        <div class="pre26-destaque" aria-label="${diaEleicao ? 'Início às 8 horas' : 'Falta 1 dia'}">
                            <strong>${destaque}</strong>
                            <span>${rotuloDestaque}</span>
                        </div>
                        <div class="pre26-texto">
                            <span class="pre26-sobrelinha">Eleições 2026</span>
                            <h1 id="pre26-titulo">${titulo}</h1>
                            <p>${descricao}</p>
                            ${diaEleicao ? '<span class="pre26-horario">Horário de Brasília</span>' : ''}
                        </div>
                    </div>

                    <nav class="pre26-acoes" aria-label="Links úteis para as eleições">
                        <a class="pre26-acao pre26-acao--secundaria" href="${LINK_TSE}" target="_blank" rel="noopener noreferrer">
                            ${icone('tse')}<span>Acompanhe no TSE</span>
                        </a>
                        <a class="pre26-acao pre26-acao--secundaria" href="${LINK_LOCAL_VOTACAO}" target="_blank" rel="noopener noreferrer">
                            ${icone('local')}<span>Consulte seu local</span>
                        </a>
                        <a class="pre26-acao pre26-acao--principal" href="${LINK_ADQUIRIR}" target="_blank" rel="noopener noreferrer">
                            ${icone('painel')}<span>Adquira este painel</span>
                        </a>
                    </nav>

                    <footer class="pre26-faixa" aria-label="Informações da votação">
                        <div><strong>4 de outubro</strong><span>1º turno</span></div>
                        <div><strong>8h às 17h</strong><span>votação</span></div>
                        <div><strong>Brasília</strong><span>horário oficial</span></div>
                    </footer>
                </section>
            </main>
        `;
    }
})();
