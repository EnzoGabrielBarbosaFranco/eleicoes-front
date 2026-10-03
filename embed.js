(function () {
    'use strict';

    const scriptAtual = document.currentScript;
    const basePublicacao = new URL('.', scriptAtual?.src || window.location.href);
    const BREAKPOINT_ESTRUTURAL = 760;
    const BREAKPOINT_INFORMADO_PADRAO = 1050;

    const formatos = {
        index: {
            arquivo: 'index.html',
            desktop: { largura: 1180, altura: 680 },
            mobile: { altura: 250 },
            anos: [2022, 2026],
            titulo: 'Painel eleitoral'
        },
        horizontal: {
            arquivo: 'horizontal.html',
            desktop: { largura: 1200, altura: 100 },
            mobile: { altura: 250 },
            anos: [2022, 2026],
            titulo: 'Painel eleitoral horizontal'
        },
        '970x90': {
            arquivo: '970x90.html',
            desktop: { largura: 970, altura: 90 },
            mobile: { altura: 90 },
            anos: [2026],
            titulo: 'Painel eleitoral 970 por 90'
        },
        '970x250': {
            arquivo: '970x250.html',
            desktop: { largura: 970, altura: 250 },
            mobile: { altura: 250 },
            anos: [2022, 2026],
            titulo: 'Painel eleitoral 970 por 250'
        },
        '970x250x100': {
            arquivo: '970x250x100.html',
            desktop: { largura: 970, altura: 250 },
            mobile: { altura: 100 },
            anos: [2026],
            titulo: 'Painel eleitoral 970 por 250, compacto em 100'
        },
        '1260x100': {
            arquivo: '1260x100.html',
            desktop: { largura: 1260, altura: 100 },
            mobile: { altura: 100 },
            anos: [2026],
            titulo: 'Painel eleitoral 1260 por 100'
        },
        '1260x200': {
            arquivo: '1260x200.html',
            desktop: { largura: 1260, altura: 200 },
            mobile: { altura: 100 },
            anos: [2026],
            titulo: 'Painel eleitoral 1260 por 200, compacto em 100'
        },
        '320x100': {
            arquivo: '320x100.html',
            desktop: { largura: 320, altura: 100 },
            mobile: { altura: 100 },
            anos: [2026],
            fixo: true,
            titulo: 'Painel eleitoral mobile 320 por 100'
        },
        '300x600': {
            arquivo: '300x600.html',
            desktop: { largura: 300, altura: 600 },
            mobile: { altura: 600 },
            anos: [2022, 2026],
            fixo: true,
            titulo: 'Painel eleitoral 300 por 600'
        },
        '300x250': {
            arquivo: '300x250.html',
            desktop: { largura: 300, altura: 250 },
            mobile: { altura: 250 },
            anos: [2022, 2026],
            fixo: true,
            titulo: 'Painel eleitoral 300 por 250'
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
            `[Painel Eleitoral] O formato "${formato}" não possui página de ${ano}. `
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

    function obterLarguraUtil(elemento) {
        let pai = elemento.parentElement;

        while (pai) {
            const estilo = window.getComputedStyle(pai);
            if (estilo.display === 'none' || estilo.visibility === 'collapse') return 0;
            if (estilo.display === 'contents') {
                pai = pai.parentElement;
                continue;
            }

            const larguraCliente = pai.clientWidth;
            if (larguraCliente <= 0) return 0;

            const larguraConteudo = larguraCliente
                - numeroCss(estilo.paddingLeft)
                - numeroCss(estilo.paddingRight);
            return Math.max(0, larguraConteudo);
        }

        return 0;
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
                    margin: 0 auto !important;
                    padding: 0 !important;
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
            this.observador.observe(alvo);
        }

        agendarDimensoes() {
            if (this.quadroAgendado) return;
            this.quadroAgendado = window.requestAnimationFrame(() => {
                this.quadroAgendado = 0;
                this.atualizarDimensoes();
            });
        }

        obterBreakpointInformado() {
            const informado = Number.parseInt(this.getAttribute('breakpoint'), 10);
            return Number.isFinite(informado) && informado > 0
                ? informado
                : BREAKPOINT_INFORMADO_PADRAO;
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
            const larguraDisponivel = obterLarguraUtil(this);
            const breakpointInformado = this.obterBreakpointInformado();

            this.dataset.embedEstado = larguraDisponivel > 0 ? 'visivel' : 'aguardando-largura';
            this.dataset.embedBreakpoint = String(breakpointInformado);
            this.dataset.embedBreakpointEstrutural = String(BREAKPOINT_ESTRUTURAL);
            if (larguraDisponivel <= 0) return;

            const largura = definicao.fixo
                ? definicao.desktop.largura
                : Math.min(definicao.desktop.largura, Math.max(1, larguraDisponivel));
            const modoMobile = !definicao.fixo && largura <= BREAKPOINT_ESTRUTURAL;
            const altura = this.obterAltura(definicao, modoMobile);
            const assinatura = `${largura}x${altura}:${modoMobile}`;
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
            definirEstilo(this, 'max-width', definicao.fixo ? 'none' : '100%');
            definirEstilo(this, 'height', `${altura}px`);
            definirEstilo(this, 'min-height', `${altura}px`);
            definirEstilo(this, 'max-height', `${altura}px`);
            if (moldura) moldura.style.height = `${altura}px`;
            if (iframe) {
                iframe.width = String(Math.max(1, Math.round(largura)));
                iframe.height = String(altura);
            }
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
            return adicionarPersonalizacao(new URL(`${prefixo}${definicao.arquivo}`, basePublicacao), this);
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
            return adicionarPersonalizacao(new URL(`2026/${definicao.arquivo}`, basePublicacao), this);
        }
    }

    if (!customElements.get('previa-eleitoral-2026')) {
        customElements.define('previa-eleitoral-2026', PreviaEleitoral2026);
    }
})();
