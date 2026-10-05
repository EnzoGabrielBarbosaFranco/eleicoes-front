(function () {
    'use strict';

    const scriptAtual = document.currentScript;
    const basePublicacao = new URL('.', scriptAtual?.src || window.location.href);
    const BREAKPOINT_ESTRUTURAL = 760;
    const BREAKPOINT_INFORMADO_PADRAO = BREAKPOINT_ESTRUTURAL;

    const formatos = {
        index: {
            arquivo: 'index.html',
            desktop: { largura: 1180, altura: 680 },
            mobile: { altura: 250 },
            anos: [2022, 2026],
            titulo: 'Placar das Urnas'
        },
        horizontal: {
            arquivo: 'horizontal.html',
            desktop: { largura: 1200, altura: 100 },
            mobile: { altura: 250 },
            anos: [2022, 2026],
            titulo: 'Placar das Urnas horizontal'
        },
        '970x90': {
            arquivo: '970x90.html',
            desktop: { largura: 970, altura: 90 },
            mobile: { altura: 90 },
            anos: [2026],
            titulo: 'Placar das Urnas 970 por 90'
        },
        '970x250': {
            arquivo: '970x250.html',
            desktop: { largura: 970, altura: 250 },
            mobile: { altura: 250 },
            anos: [2022, 2026],
            titulo: 'Placar das Urnas 970 por 250'
        },
        '970x250x100': {
            arquivo: '970x250x100.html',
            desktop: { largura: 970, altura: 250 },
            mobile: { altura: 100 },
            anos: [2026],
            titulo: 'Placar das Urnas 970 por 250, compacto em 100'
        },
        '1260x100': {
            arquivo: '1260x100.html',
            desktop: { largura: 1260, altura: 100 },
            mobile: { altura: 100 },
            anos: [2026],
            titulo: 'Placar das Urnas 1260 por 100'
        },
        '1260x200': {
            arquivo: '1260x200.html',
            desktop: { largura: 1260, altura: 200 },
            mobile: { altura: 100 },
            anos: [2026],
            titulo: 'Placar das Urnas 1260 por 200, compacto em 100'
        },
        '320x100': {
            arquivo: '320x100.html',
            desktop: { largura: 320, altura: 100 },
            mobile: { altura: 100 },
            anos: [2026],
            fixo: true,
            titulo: 'Placar das Urnas mobile 320 por 100'
        },
        '300x600': {
            arquivo: '300x600.html',
            desktop: { largura: 300, altura: 600 },
            mobile: { altura: 600 },
            anos: [2022, 2026],
            fixo: true,
            titulo: 'Placar das Urnas 300 por 600'
        },
        '300x250': {
            arquivo: '300x250.html',
            desktop: { largura: 300, altura: 250 },
            mobile: { altura: 250 },
            anos: [2022, 2026],
            fixo: true,
            titulo: 'Placar das Urnas 300 por 250'
        }
    };

    const atributosPersonalizacao = [
        'visao', 'view', 'marca', 'nome',
        'cor-primaria', 'cor-destaque', 'cor-clara',
        'cor1', 'cor2', 'cor3'
    ];

    const aliasesConsulta = [
        { atributos: ['visao', 'view'], parametros: ['visao', 'view'] },
        { atributos: ['marca', 'nome'], parametros: ['marca', 'nome'] },
        { atributos: ['cor-primaria', 'cor1'], parametros: ['corPrimaria', 'cor1'] },
        { atributos: ['cor-destaque', 'cor2'], parametros: ['corDestaque', 'cor2'] },
        { atributos: ['cor-clara', 'cor3'], parametros: ['corClara', 'cor3'] }
    ];

    function normalizarAno(valor) {
        return String(valor) === '2022' ? 2022 : 2026;
    }

    function normalizarFormato(valor) {
        const informado = String(valor || 'index').toLowerCase();
        if (informado === 'padrao') return 'index';
        return Object.hasOwn(formatos, informado) ? informado : 'index';
    }

    function formatoAlternativo2022(formato) {
        if (formato === '970x250x100' || formato === '1260x200') return '970x250';
        if (formato === '320x100') return '300x250';
        return 'horizontal';
    }

    function resolverFormato(valor, ano) {
        const formato = normalizarFormato(valor);
        const definicao = formatos[formato];
        if (definicao.anos.includes(ano)) return formato;

        const alternativo = ano === 2022 ? formatoAlternativo2022(formato) : 'index';
        console.warn(
            `[Placar das Urnas] O formato "${formato}" não possui página de ${ano}. `
            + `Usando "${alternativo}" sem criar uma rota inexistente.`
        );
        return alternativo;
    }

    function primeiroAtributo(elemento, nomes) {
        for (const nome of nomes) {
            const valor = elemento.getAttribute(nome);
            if (valor != null && valor !== '') return valor;
        }
        return '';
    }

    function adicionarPersonalizacao(endereco, elemento) {
        aliasesConsulta.forEach(({ atributos, parametros }) => {
            const valor = primeiroAtributo(elemento, atributos);
            if (!valor) return;
            parametros.forEach((parametro) => endereco.searchParams.set(parametro, valor));
        });
        return endereco;
    }

    function numeroCss(valor) {
        const numero = Number.parseFloat(valor);
        return Number.isFinite(numero) ? numero : 0;
    }

    function obterLarguraViewport() {
        return document.documentElement.clientWidth || window.innerWidth;
    }

    function obterLarguraUtil(elemento) {
        let pai = elemento.parentElement;
        const larguraViewport = obterLarguraViewport();
        let inicio = 0;
        let fim = larguraViewport;
        let conteudoPai = null;

        while (pai) {
            const estilo = window.getComputedStyle(pai);
            if (estilo.display === 'none' || estilo.visibility === 'collapse') return { largura: 0 };
            if (estilo.display === 'contents') {
                pai = pai.parentElement;
                continue;
            }

            const larguraCliente = pai.clientWidth;
            if (larguraCliente <= 0) return { largura: 0 };

            const larguraConteudo = larguraCliente
                - numeroCss(estilo.paddingLeft)
                - numeroCss(estilo.paddingRight);
            const inicioConteudo = pai.getBoundingClientRect().left + pai.clientLeft
                + numeroCss(estilo.paddingLeft);
            if (!conteudoPai) conteudoPai = { inicio: inicioConteudo, largura: larguraConteudo };
            inicio = Math.max(inicio, inicioConteudo);
            fim = Math.min(fim, inicioConteudo + larguraConteudo);
            pai = pai.parentElement;
        }

        const largura = Math.max(0, fim - inicio);
        return {
            largura,
            // Nao centralizar em um pai largo quando so parte dele esta visivel.
            margemEsquerda: conteudoPai && conteudoPai.largura > largura + 1
                ? Math.max(0, inicio - conteudoPai.inicio) : null
        };
    }

    function definirEstilo(elemento, propriedade, valor) {
        if (!elemento) return;
        if (elemento.style.getPropertyValue(propriedade) === valor
            && elemento.style.getPropertyPriority(propriedade) === 'important') return;
        elemento.style.setProperty(propriedade, valor, 'important');
    }

    class IncorporadorBase extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.elementoObservado = null;
            this.quadroAgendado = 0;
            this.ultimaMedida = '';
            this.observador = new ResizeObserver(() => this.agendarDimensoes());
            this.aoRedimensionar = () => this.agendarDimensoes();
        }

        connectedCallback() {
            this.criarEstrutura();
            this.atualizarFonte();
            this.atualizarMetadados();
            this.reservarDimensoes();
            this.observarContainer();
            this.atualizarDimensoes();
            window.addEventListener('resize', this.aoRedimensionar, { passive: true });
        }

        disconnectedCallback() {
            window.removeEventListener('resize', this.aoRedimensionar);
            this.observador.disconnect();
            this.elementoObservado = null;
            if (this.quadroAgendado) window.cancelAnimationFrame(this.quadroAgendado);
            this.quadroAgendado = 0;
        }

        attributeChangedCallback(nome, valorAnterior, valorAtual) {
            if (!this.isConnected || valorAnterior === valorAtual) return;

            if (nome === 'titulo' || nome === 'loading') {
                this.atualizarMetadados();
                return;
            }

            if (nome === 'breakpoint' || nome === 'altura') {
                if (nome === 'breakpoint') this.atualizarFonte();
                this.atualizarDimensoes();
                return;
            }

            this.atualizarFonte();
            this.atualizarMetadados();
            this.reservarDimensoes();
            this.atualizarDimensoes();
        }

        criarEstrutura() {
            if (this.shadowRoot.querySelector('iframe')) return;

            const estilo = document.createElement('style');
            estilo.textContent = `
                :host {
                    box-sizing: border-box !important;
                    display: block !important;
                    isolation: isolate !important;
                    contain: layout style !important;
                    margin: 0 auto;
                    padding: 0 !important;
                    min-width: 0 !important;
                    border: 0 !important;
                    background: transparent !important;
                    line-height: 0 !important;
                }

                *, *::before, *::after {
                    box-sizing: border-box !important;
                }

                .moldura,
                iframe {
                    display: block !important;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    border: 0 !important;
                    background: transparent !important;
                    line-height: 0 !important;
                }
            `;

            const moldura = document.createElement('div');
            moldura.className = 'moldura';
            const iframe = document.createElement('iframe');
            iframe.scrolling = 'no';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            moldura.append(iframe);
            this.shadowRoot.append(estilo, moldura);
        }

        observarContainer() {
            const alvo = this.parentElement;
            if (!alvo || alvo === this.elementoObservado) return;
            this.observador.disconnect();
            this.elementoObservado = alvo;
            for (let pai = alvo; pai; pai = pai.parentElement) this.observador.observe(pai);
        }

        agendarDimensoes() {
            if (this.quadroAgendado) return;
            this.quadroAgendado = window.requestAnimationFrame(() => {
                this.quadroAgendado = 0;
                this.atualizarDimensoes();
            });
        }

        obterBreakpointInformado() {
            const informado = Number(this.getAttribute('breakpoint'));
            return Number.isInteger(informado) && informado > 0 && informado <= 10000
                ? informado
                : BREAKPOINT_INFORMADO_PADRAO;
        }

        obterBreakpointEfetivo() {
            const { ano, definicao } = this.obterConfiguracao();
            return ano === 2026 && !definicao.fixo
                ? this.obterBreakpointInformado() : BREAKPOINT_ESTRUTURAL;
        }

        adicionarBreakpoint(endereco) {
            const { ano, definicao } = this.obterConfiguracao();
            const breakpoint = this.obterBreakpointEfetivo();
            if (breakpoint !== BREAKPOINT_ESTRUTURAL) endereco.searchParams.set('breakpoint', String(breakpoint));
            if (ano === 2026 && !definicao.fixo && this.isConnected) {
                const area = obterLarguraUtil(this);
                const largura = Math.min(definicao.desktop.largura,
                    Math.max(1, Math.floor(area.largura || definicao.desktop.largura)));
                endereco.searchParams.set('embed-modo', this.usarModoMobile(largura) ? 'mobile' : 'desktop');
            }
            // A pagina local de teste pode forcar as capas sem alterar o relogio.
            // Nunca aceitar esse atalho quando o iframe aponta para producao.
            if (['localhost', '127.0.0.1'].includes(endereco.hostname)
                && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
                const consulta = new URLSearchParams(window.location.search);
                for (const nome of ['pre-eleicao', 'duracao', 'reiniciar']) {
                    if (consulta.has(nome)) endereco.searchParams.set(nome, consulta.get(nome));
                }
            }
            return endereco;
        }

        usarModoMobile(largura) {
            const { ano, definicao } = this.obterConfiguracao();
            if (definicao.fixo) return false;
            // Um banner de 970px nao vira mobile em uma pagina de 1400px
            // somente porque o cliente informou breakpoint=1050.
            return largura <= BREAKPOINT_ESTRUTURAL
                || (ano === 2026 && obterLarguraViewport() <= this.obterBreakpointEfetivo());
        }

        reservarDimensoes() {
            const { definicao } = this.obterConfiguracao();
            const largura = definicao.desktop.largura;
            const altura = definicao.desktop.altura;
            const iframe = this.shadowRoot.querySelector('iframe');
            const moldura = this.shadowRoot.querySelector('.moldura');

            this.ultimaMedida = '';

            definirEstilo(this, 'width', `${largura}px`);
            definirEstilo(this, 'max-width', definicao.fixo ? 'none' : '100%');
            definirEstilo(this, 'height', `${altura}px`);
            definirEstilo(this, 'min-height', `${altura}px`);
            definirEstilo(this, 'max-height', `${altura}px`);
            if (moldura) moldura.style.height = `${altura}px`;
            if (iframe) {
                iframe.width = String(largura);
                iframe.height = String(altura);
            }
        }

        obterAltura(definicao, modoMobile) {
            return modoMobile ? definicao.mobile.altura : definicao.desktop.altura;
        }

        atualizarDimensoes() {
            const configuracao = this.obterConfiguracao();
            const { formato, ano, definicao } = configuracao;
            const area = obterLarguraUtil(this);
            const larguraDisponivel = area.largura;
            const breakpointInformado = this.obterBreakpointInformado();
            const breakpointEfetivo = this.obterBreakpointEfetivo();

            this.dataset.embedEstado = larguraDisponivel > 0 ? 'visivel' : 'aguardando-largura';
            this.dataset.embedBreakpoint = String(breakpointInformado);
            this.dataset.embedBreakpointEstrutural = String(breakpointEfetivo);
            if (larguraDisponivel <= 0) return;

            const largura = definicao.fixo
                ? definicao.desktop.largura
                : Math.min(definicao.desktop.largura, Math.max(1, Math.floor(larguraDisponivel)));
            const modoMobile = this.usarModoMobile(largura);
            const altura = this.obterAltura(definicao, modoMobile);
            const margemEsquerda = !definicao.fixo && area.margemEsquerda != null
                ? `${area.margemEsquerda}px` : 'auto';
            const assinatura = `${largura}x${altura}:${modoMobile}:${margemEsquerda}`;
            const iframe = this.shadowRoot.querySelector('iframe');
            const moldura = this.shadowRoot.querySelector('.moldura');

            this.dataset.formato = formato;
            this.dataset.ano = String(ano);
            this.dataset.mobile = String(modoMobile);
            this.dataset.embedModo = modoMobile ? 'mobile' : 'desktop';
            this.dataset.embedLargura = String(Math.round(largura));
            this.dataset.embedAltura = String(altura);

            if (assinatura === this.ultimaMedida) return;
            this.ultimaMedida = assinatura;

            definirEstilo(this, 'width', `${Math.round(largura)}px`);
            definirEstilo(this, 'margin-left', margemEsquerda);
            definirEstilo(this, 'margin-right', 'auto');
            definirEstilo(this, 'max-width', definicao.fixo ? 'none' : '100%');
            definirEstilo(this, 'height', `${altura}px`);
            definirEstilo(this, 'min-height', `${altura}px`);
            definirEstilo(this, 'max-height', `${altura}px`);
            if (moldura) moldura.style.height = `${altura}px`;
            if (iframe) {
                iframe.width = String(Math.max(1, Math.round(largura)));
                iframe.height = String(altura);
            }
            // Recarregar somente ao mudar o modo/atributos, nunca a cada pixel.
            // Os filtros ja sao persistidos pela pagina; o modo fica no URL
            // para continuar correto inclusive apos a transicao automatica.
            this.atualizarFonte();
        }

        atualizarFonte() {
            const iframe = this.shadowRoot.querySelector('iframe');
            if (!iframe) return;
            const endereco = this.criarEndereco();
            if (iframe.src !== endereco.href) iframe.src = endereco.href;
        }

        atualizarMetadados() {
            const iframe = this.shadowRoot.querySelector('iframe');
            if (!iframe) return;
            const { ano, definicao } = this.obterConfiguracao();
            iframe.title = this.getAttribute('titulo') || `${definicao.titulo} — Eleições ${ano}`;
            iframe.loading = this.getAttribute('loading') === 'lazy' ? 'lazy' : 'eager';
        }
    }

    class EleicoesWidget extends IncorporadorBase {
        static get observedAttributes() {
            return ['ano', 'formato', 'altura', 'breakpoint', 'titulo', 'loading', ...atributosPersonalizacao];
        }

        obterConfiguracao() {
            const ano = normalizarAno(this.getAttribute('ano') || '2026');
            const formato = resolverFormato(this.getAttribute('formato') || 'index', ano);
            return { ano, formato, definicao: formatos[formato] };
        }

        criarEndereco() {
            const { ano, definicao } = this.obterConfiguracao();
            const prefixo = ano === 2026 ? '2026/' : '';
            return this.adicionarBreakpoint(adicionarPersonalizacao(new URL(`${prefixo}${definicao.arquivo}`, basePublicacao), this));
        }

        obterAltura(definicao, modoMobile) {
            const alturaInformada = Number.parseInt(this.getAttribute('altura'), 10);
            const formato = this.obterConfiguracao().formato;
            if (!modoMobile && formato === 'index' && Number.isFinite(alturaInformada) && alturaInformada >= 320) {
                return alturaInformada;
            }
            return super.obterAltura(definicao, modoMobile);
        }
    }

    if (!customElements.get('eleicoes-widget')) {
        customElements.define('eleicoes-widget', EleicoesWidget);
    }

    class PreviaEleitoral2026 extends IncorporadorBase {
        static get observedAttributes() {
            return ['formato', 'breakpoint', 'titulo', 'loading', ...atributosPersonalizacao];
        }

        obterConfiguracao() {
            const ano = 2026;
            const formato = resolverFormato(this.getAttribute('formato') || 'index', ano);
            return { ano, formato, definicao: formatos[formato] };
        }

        criarEndereco() {
            const { definicao } = this.obterConfiguracao();
            return this.adicionarBreakpoint(adicionarPersonalizacao(new URL(`2026/${definicao.arquivo}`, basePublicacao), this));
        }
    }

    if (!customElements.get('previa-eleitoral-2026')) {
        customElements.define('previa-eleitoral-2026', PreviaEleitoral2026);
    }
})();
