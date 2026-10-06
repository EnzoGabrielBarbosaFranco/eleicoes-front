(function () {
    const ANO_ELEICAO = 2026;
    const INICIO_RESULTADOS_2026 = Date.parse('2026-10-04T08:00:00-03:00');
    const CODIGO_AGUARDANDO_TSE = 'ELEICAO_AGUARDANDO_TSE';
    const MENSAGEM_AGUARDANDO = 'Aguardando os resultados de 2026';
    const MENSAGEM_INICIO_APURACAO = 'Aguardando os primeiros resultados';
    const MENSAGEM_INDISPONIVEL = 'Os resultados das Eleições 2026 estão temporariamente indisponíveis.';
    const API_PRODUCAO = 'https://backend-eleicoes-2026.enzo-eleicoes-backend.workers.dev';
    const breakpoint = window.PreEleicao2026?.breakpoint || 760;
    const consultaMobile = window.PreEleicao2026?.consultaMobile || `(max-width: ${breakpoint}px)`;
    const consultaDesktop = window.PreEleicao2026?.consultaDesktop || `(min-width: ${breakpoint + 1}px)`;
    const formatadorDiaAtual = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
    });

    function obterApiBaseUrl() {
        const ambienteLocal = window.location.hostname === '127.0.0.1'
            || window.location.hostname === 'localhost';

        if (ambienteLocal) {
            const host = window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
            return `http://${host}:8788`;
        }

        return API_PRODUCAO;
    }

    function horarioDaApuracaoIniciado() {
        return Boolean(window.PreEleicao2026?.forcarDadosOficiais)
            || Date.now() >= INICIO_RESULTADOS_2026;
    }

    function escaparHtml(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function percentualNumerico(valor) {
        const numero = Number.parseFloat(String(valor ?? '0').replace(',', '.'));
        if (!Number.isFinite(numero)) return 0;
        return Math.min(100, Math.max(0, numero));
    }

    function formatarPercentual(valor) {
        return String(valor ?? '0,00').replace('.', ',');
    }

    function extrairHorario(atualizacao) {
        const correspondencia = String(atualizacao || '').match(/\b(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\b/);
        return correspondencia ? correspondencia[0].slice(0, 5) : '';
    }

    function obterIniciais(nome) {
        const partes = String(nome || 'Candidato').trim().split(/\s+/).filter(Boolean);
        if (partes.length === 0) return 'CD';
        if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
        return `${partes[0][0]}${partes.at(-1)[0]}`.toUpperCase();
    }

    async function requisitarJson(caminho) {
        const response = await fetch(`${obterApiBaseUrl()}${caminho}`, {
            headers: { Accept: 'application/json' }
        });

        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            data = { mensagem: 'A API retornou uma resposta inválida.' };
        }

        return { response, data };
    }

    function toggleResumo() {
        const bloco = document.getElementById('bloco-resumo');
        const texto = document.getElementById('txt-toggle');
        const botao = document.querySelector('.resumo-toggle');
        if (!bloco || !texto) return;

        bloco.classList.toggle('oculto');
        const estaOculto = bloco.classList.contains('oculto');
        texto.innerText = estaOculto ? 'Ver resumo de votos' : 'Ocultar resumo';
        if (botao) botao.setAttribute('aria-expanded', String(!estaOculto));
    }

    // Mantido igual nas tres versoes: sem recurso extra nem nova requisicao.
    function configurarArrasteCandidatos(lista, estado) {
        let ponteiroDentro = false;
        let arraste = null;
        let bloquearCliqueAte = 0;
        let disponivel = false;

        function retomarAutomatico(atraso = 500) {
            estado.pausado = false;
            estado.iniciarAutoScrollEm = Date.now() + atraso;
        }

        function finalizarArraste(evento) {
            if (!arraste || (evento?.pointerId != null && evento.pointerId !== arraste.id)) return;
            const anterior = arraste;
            arraste = null;
            lista.classList.remove('arrastando-candidatos');
            if (lista.hasPointerCapture(anterior.id)) lista.releasePointerCapture(anterior.id);
            if (anterior.moveu) {
                // O click gerado ao soltar um arraste nao deve acionar um card/botao.
                bloquearCliqueAte = performance.now() + 400;
                retomarAutomatico();
            } else if (!ponteiroDentro || evento?.type === 'pointercancel' || evento?.type === 'blur') {
                retomarAutomatico();
            }
        }

        lista.addEventListener('pointerenter', (evento) => {
            if (evento.pointerType === 'touch') return;
            ponteiroDentro = true;
            estado.pausado = true;
        });
        lista.addEventListener('pointerleave', (evento) => {
            if (evento.pointerType === 'touch') return;
            ponteiroDentro = false;
            if (!arraste) retomarAutomatico();
        });
        lista.addEventListener('pointerdown', (evento) => {
            if (evento.pointerType === 'touch' || !evento.isPrimary || evento.button !== 0
                || lista.scrollWidth <= lista.clientWidth + 1) return;
            bloquearCliqueAte = 0;
            estado.pausado = true;
            arraste = { id: evento.pointerId, x: evento.clientX, scroll: lista.scrollLeft, moveu: false };
        });
        window.addEventListener('pointermove', (evento) => {
            if (!arraste || evento.pointerId !== arraste.id) return;
            if (!(evento.buttons & 1)) {
                finalizarArraste(evento);
                return;
            }
            const distancia = evento.clientX - arraste.x;
            if (!arraste.moveu && Math.abs(distancia) < 5) return;
            if (!arraste.moveu) {
                arraste.moveu = true;
                // Capturar so depois do limiar preserva o alvo dos cliques normais.
                lista.setPointerCapture(arraste.id);
                lista.classList.add('arrastando-candidatos');
            }
            evento.preventDefault();
            lista.scrollLeft = arraste.scroll - distancia;
        }, { passive: false });
        window.addEventListener('pointerup', finalizarArraste);
        window.addEventListener('pointercancel', finalizarArraste);
        lista.addEventListener('lostpointercapture', finalizarArraste);
        window.addEventListener('blur', finalizarArraste);
        lista.addEventListener('click', (evento) => {
            if (evento.detail !== 0 && performance.now() < bloquearCliqueAte) {
                evento.preventDefault();
                evento.stopImmediatePropagation();
                bloquearCliqueAte = 0;
            }
        }, true);
        lista.addEventListener('dragstart', (evento) => {
            if (disponivel) evento.preventDefault();
        });
        // O toque continua usando a rolagem nativa, sem captura ou preventDefault.
        lista.addEventListener('touchstart', () => {
            estado.pausado = true;
        }, { passive: true });
        function liberarAposToque(evento) {
            if (!evento.touches.length) retomarAutomatico(700);
        }
        lista.addEventListener('touchend', liberarAposToque, { passive: true });
        lista.addEventListener('touchcancel', liberarAposToque, { passive: true });
        lista.addEventListener('wheel', () => {
            estado.iniciarAutoScrollEm = Date.now() + 700;
        }, { passive: true });

        return function atualizarDisponibilidade() {
            const podeArrastar = lista.scrollWidth > lista.clientWidth + 1;
            if (podeArrastar !== disponivel) {
                disponivel = podeArrastar;
                lista.classList.toggle('arraste-disponivel', disponivel);
                if (!disponivel) finalizarArraste();
            }
            return disponivel;
        };
    }

    function iniciar(opcoes = {}) {
        if (window.PreEleicao2026?.ativo) return;

        const tipo = opcoes.tipo || 'padrao';
        const loteDeputados = opcoes.loteDeputados || 20;
        const selectTurno = document.getElementById('select-turno');
        const selectCargo = document.getElementById('select-cargo');
        const selectUf = document.getElementById('select-uf');
        const lista = document.getElementById('lista-candidatos');
        const textoPercurso = document.getElementById('txt-percurso');
        const barraPercurso = document.getElementById('barra-percurso');
        const ultimaAtualizacao = document.getElementById('ultima-atualizacao');
        const barraProgresso = barraPercurso.parentElement;
        const raizWidget = document.querySelector('.widget-container, .widget-horizontal');
        const layoutHorizontal = tipo === 'horizontal' || tipo === '970x250';
        const formato970x90 = document.body.classList.contains('formato-970x90');
        const formatoCompacto100 = document.body.classList.contains('formato-compacto-100');
        const formato320x100 = document.body.classList.contains('formato-320x100');

        if (!selectTurno || !selectCargo || !selectUf || !lista || !textoPercurso || !barraPercurso || !ultimaAtualizacao || !raizWidget) {
            console.error('Não foi possível iniciar o widget: elementos obrigatórios não encontrados.');
            return;
        }

        const avisoDados = document.createElement('div');
        avisoDados.className = 'aviso-fonte-dados';
        avisoDados.setAttribute('role', 'status');
        avisoDados.setAttribute('aria-live', 'polite');
        avisoDados.hidden = true;
        raizWidget.insertBefore(avisoDados, lista);

        const estado = {
            resultadosDisponiveis: false,
            anoExibido: ANO_ELEICAO,
            quantidadeVisivel: loteDeputados,
            ultimaApuracao: null,
            ultimaConsultaApuracao: 0,
            ultimaConsultaStatus: 0,
            pausado: false,
            iniciarAutoScrollEm: Date.now() + 1600
        };

        function removerAvisoDados() {
            avisoDados.hidden = true;
            avisoDados.className = 'aviso-fonte-dados';
            avisoDados.textContent = '';
            raizWidget.classList.remove('tem-aviso-dados');
        }

        function atualizarAvisoDados(data) {
            const fase = String(data.fase || '').toLowerCase();
            let mensagem = '';
            let modificador = '';

            if (fase === 'simulado') {
                mensagem = 'SIMULAÇÃO DO TSE — DADOS DE TESTE';
                modificador = 'aviso-fonte-dados--simulacao';
            }

            removerAvisoDados();
            if (!mensagem) return;

            avisoDados.classList.add(modificador);
            avisoDados.textContent = mensagem;
            avisoDados.hidden = false;
            raizWidget.classList.add('tem-aviso-dados');
        }

        function definirAnoExibido() {
            raizWidget.dataset.ano = String(ANO_ELEICAO);
            const titulo = document.querySelector('.widget-header h2, .bloco-header h2');
            if (!titulo) return;

            const tituloCompacto = tipo === '300x250' || layoutHorizontal;
            titulo.innerText = tituloCompacto
                ? `Apuração ${ANO_ELEICAO}`
                : `Apuração das Eleições de ${ANO_ELEICAO}`;
        }

        function definirCarregando(carregando) {
            lista.setAttribute('aria-busy', String(carregando));
            if (raizWidget) raizWidget.classList.toggle('is-loading', carregando);
        }

        function salvarFiltros() {
            localStorage.setItem('filtro2026Turno', selectTurno.value);
            localStorage.setItem('filtro2026Cargo', selectCargo.value);
            localStorage.setItem('filtro2026Uf', selectUf.value);
        }

        function ajustarUfAoCargo() {
            if (selectCargo.value === '1') {
                selectUf.value = 'br';
                selectUf.disabled = true;
                return;
            }

            selectUf.disabled = false;
            if (selectUf.value === 'br') selectUf.value = 'sp';
        }

        function carregarFiltros() {
            const cargoSalvo = localStorage.getItem('filtro2026Cargo');
            const ufSalva = localStorage.getItem('filtro2026Uf');

            selectTurno.value = '1';
            localStorage.setItem('filtro2026Turno', '1');
            if (cargoSalvo) selectCargo.value = cargoSalvo;
            if (ufSalva) selectUf.value = ufSalva;
            ajustarUfAoCargo();
        }

        function atualizarResumo(resumo) {
            const resumoCompactoMobile = formato320x100
                || (window.matchMedia(consultaMobile).matches && (formato970x90 || formatoCompacto100));
            const valorResumo = (total, percentual) => resumoCompactoMobile
                ? `${percentual || '0,00'}%`
                : `${total || '--'} (${percentual || '0,00'}%)`;
            const campos = {
                'votos-validos': resumo ? valorResumo(resumo.validos, resumo.pctValidos) : '--',
                'votos-brancos': resumo ? valorResumo(resumo.brancos, resumo.pctBrancos) : '--',
                'votos-nulos': resumo ? valorResumo(resumo.nulos, resumo.pctNulos) : '--',
                'votos-abstencoes': resumo ? valorResumo(resumo.abstencoes, resumo.pctAbstencoes) : '--'
            };

            Object.entries(campos).forEach(([id, valor]) => {
                const elemento = document.getElementById(id);
                if (elemento) elemento.innerText = valor;
            });
        }

        function limparProgresso() {
            ultimaAtualizacao.removeAttribute('title');
            ultimaAtualizacao.removeAttribute('aria-label');
            textoPercurso.innerText = '0%';
            barraPercurso.style.width = '0%';
            if (barraProgresso) barraProgresso.setAttribute('aria-valuenow', '0');
            atualizarResumo(null);
        }

        function mostrarAguardando() {
            estado.resultadosDisponiveis = false;
            definirCarregando(false);
            if (estado.ultimaApuracao) return;

            limparProgresso();
            removerAvisoDados();
            ultimaAtualizacao.innerText = 'Aguardando resultados de 2026';
            lista.innerHTML = criarEstadoAguardando(MENSAGEM_AGUARDANDO);
        }

        function criarEstadoAguardando(titulo) {
            return `
                <div class="estado-eleicao estado-aguardando" role="status">
                    <span class="estado-icone" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="8.5" />
                            <path d="M12 7.5V12l3 2" />
                        </svg>
                    </span>
                    <div class="estado-copy">
                        <strong>${escaparHtml(titulo)}</strong>
                        <span class="estado-descricao">Atualização automática pelo TSE</span>
                    </div>
                </div>
            `;
        }

        function numeroInteiro(valor) {
            const numero = Number.parseInt(String(valor ?? '').replace(/\D/g, ''), 10);
            return Number.isFinite(numero) ? numero : 0;
        }

        function possuiVotosComputados(data) {
            if (percentualNumerico(data.percurso) > 0) return true;
            if (numeroInteiro(data.resumo?.validos) > 0) return true;

            const candidatos = Array.isArray(data.candidatos) ? data.candidatos : [];
            return candidatos.some((candidato) => (
                Number(candidato.votosNumero || 0) > 0
                || numeroInteiro(candidato.total) > 0
                || percentualNumerico(candidato.votos) > 0
            ));
        }

        function mostrarInicioApuracao(data = null) {
            estado.resultadosDisponiveis = Boolean(data);
            if (data) estado.ultimaApuracao = data;
            definirCarregando(false);
            atualizarAvisoDados(data || {});
            limparProgresso();
            ultimaAtualizacao.innerText = 'Aguardando os primeiros resultados';
            lista.innerHTML = criarEstadoAguardando(MENSAGEM_INICIO_APURACAO);
        }

        function preservarUltimaRespostaOuMostrarIndisponivel() {
            if (estado.ultimaApuracao) {
                estado.resultadosDisponiveis = true;
                definirCarregando(false);
                return;
            }

            estado.resultadosDisponiveis = false;
            definirCarregando(false);
            limparProgresso();
            removerAvisoDados();
            ultimaAtualizacao.innerText = 'Serviço temporariamente indisponível';
            lista.innerHTML = `
                <div class="estado-eleicao estado-erro" role="alert">
                    <strong>${MENSAGEM_INDISPONIVEL}</strong>
                </div>
            `;
        }

        function atualizarStatus(data) {
            const percurso = String(data.percurso || '0,00');
            const percentualApurado = percentualNumerico(percurso);
            textoPercurso.innerText = `${percurso.endsWith(',00') ? percurso.slice(0, -3) : percurso}%`;
            barraPercurso.style.width = `${percentualApurado}%`;
            if (barraProgresso) barraProgresso.setAttribute('aria-valuenow', String(percentualApurado));

            atualizarFonteDados(data);
            atualizarResumo(data.resumo || {});
        }

        function atualizarFonteDados(data) {
            const diaAtual = formatadorDiaAtual.format(new Date());
            const horarioAtualizacao = extrairHorario(data.atualizacao);
            ultimaAtualizacao.innerText = `Fonte: TSE · ${diaAtual} · ${horarioAtualizacao || '--:--'}`;
            // A data visivel e o dia da exibicao, nao uma nova publicacao do TSE.
            const descricao = `Fonte: Tribunal Superior Eleitoral. Data de exibição: ${diaAtual} (Brasília). `
                + `Última atualização dos dados do TSE: ${data.atualizacao || 'horário não informado'}.`;
            ultimaAtualizacao.title = descricao;
            ultimaAtualizacao.setAttribute('aria-label', descricao);
        }

        function criarBadgeSituacao(candidato) {
            const situacao = candidato.situacao || (candidato.eleito ? 'Eleito' : 'Situação não informada');
            let classe = 'badge-neutro';
            if (candidato.eleito) classe = 'badge-verde';
            else if (/2º turno|segundo turno/i.test(situacao)) classe = 'badge-amarelo';
            return `<span class="eleito-badge ${classe}">${escaparHtml(situacao)}</span>`;
        }

        function criarCardVertical(candidato, indice) {
            const nome = escaparHtml(candidato.nome || 'Nome indisponível');
            const numero = candidato.numero != null ? `Nº ${escaparHtml(candidato.numero)}` : 'Número não informado';
            const partido = escaparHtml(candidato.partido || 'Partido não informado');
            const foto = candidato.foto ? escaparHtml(candidato.foto) : '';
            const votos = escaparHtml(formatarPercentual(candidato.votos));
            const total = escaparHtml(candidato.total || 0);
            const iniciais = escaparHtml(obterIniciais(candidato.nome));

            return `
                <article class="candidato-card" aria-label="${nome}, ${votos}% dos votos">
                    <span class="ranking-cand" aria-label="${indice + 1}ª posição">${indice + 1}</span>
                    <div class="candidato-info">
                        <div class="candidato-flex">
                            <div class="foto-container">
                                <span class="candidato-iniciais" aria-hidden="true">${iniciais}</span>
                                ${foto ? `<img src="${foto}" class="foto-cand" onerror="this.remove()" alt="Foto de ${nome}">` : ''}
                            </div>
                            <div class="info-textos">
                                <span class="nome-cand">${nome}</span>
                                <span class="numero-cand">${numero} · ${partido}</span>
                                ${criarBadgeSituacao(candidato)}
                            </div>
                        </div>
                        <div class="percentual">${votos}%</div>
                    </div>
                    <div class="barra-cand-bg" role="progressbar" aria-label="Percentual de votos de ${nome}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentualNumerico(candidato.votos)}">
                        <div class="barra-cand-fill" style="width: ${percentualNumerico(candidato.votos)}%"></div>
                    </div>
                    <div class="votos-absolutos">
                        <span>${total} votos</span>
                    </div>
                </article>
            `;
        }

        function criarCardHorizontal(candidato, indice) {
            const nome = escaparHtml(candidato.nome || 'Nome indisponível');
            const numeroPuro = candidato.numero != null ? escaparHtml(candidato.numero) : 'S/N';
            const numero = candidato.numero != null ? `Nº ${numeroPuro}` : numeroPuro;
            const partido = escaparHtml(candidato.partido || 'N/A');
            const foto = candidato.foto ? escaparHtml(candidato.foto) : '';
            const votos = escaparHtml(formatarPercentual(candidato.votos));
            const total = escaparHtml(candidato.total || 0);
            const iniciais = escaparHtml(obterIniciais(candidato.nome));
            const cargoCompacto = escaparHtml(selectCargo.options[selectCargo.selectedIndex]?.textContent || 'Candidato');

            return `
                <article class="card-cand" aria-label="${nome}, ${votos}% dos votos">
                    <span class="ranking-cand" aria-label="${indice + 1}ª posição">${indice + 1}</span>
                    <div class="foto-container">
                        <span class="candidato-iniciais" aria-hidden="true">${iniciais}</span>
                        ${foto ? `<img src="${foto}" class="foto-cand" onerror="this.remove()" alt="Foto de ${nome}">` : ''}
                    </div>
                    <div class="info-cand">
                        <div class="card-topo">
                            <span class="card-cargo-compacto">${cargoCompacto}</span>
                            <span class="card-nome"><span class="card-identificacao">${numero} · </span><span class="card-nome-texto">${nome}</span></span>
                            <span class="card-pct">${votos}%</span>
                        </div>
                        <div class="card-barra-bg" role="progressbar" aria-label="Percentual de votos de ${nome}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentualNumerico(candidato.votos)}">
                            <div class="card-barra-fill" style="width: ${percentualNumerico(candidato.votos)}%"></div>
                        </div>
                        <div class="card-votos">${total} votos · ${partido}</div>
                        <span class="card-partido-compacto">${partido}</span>
                    </div>
                    <span class="card-numero-compacto" aria-label="Número ${numeroPuro}">${numeroPuro}</span>
                    ${criarBadgeSituacao(candidato)}
                </article>
            `;
        }

        function criarMetadados(data, cargo) {
            const totalCandidatos = data.totalCandidatos ?? (Array.isArray(data.candidatos) ? data.candidatos.length : 0);
            const anoDosDados = Number(data.ano || estado.anoExibido);
            const vagas = cargo === '5'
                ? (anoDosDados === 2026 ? 2 : 1)
                : data.vagas;
            const partes = [`${totalCandidatos} candidato${totalCandidatos === 1 ? '' : 's'}`];

            if (cargo === '5' && anoDosDados === 2026) partes.push('2 vagas para o Senado em 2026');
            else if (vagas != null) partes.push(`${vagas} vaga${Number(vagas) === 1 ? '' : 's'}`);

            return `<div class="eleicao-meta">${partes.map(escaparHtml).join('<span aria-hidden="true">•</span>')}</div>`;
        }

        function renderizarCandidatos(data) {
            const cargo = selectCargo.value;
            const candidatos = Array.isArray(data.candidatos) ? data.candidatos : [];
            const cargoDeputado = cargo === '6' || cargo === '7';
            const candidatosVisiveis = cargoDeputado
                ? candidatos.slice(0, estado.quantidadeVisivel)
                : candidatos;
            const posicaoScroll = lista.scrollLeft;
            const criarCard = layoutHorizontal ? criarCardHorizontal : criarCardVertical;

            let conteudo = criarMetadados(data, cargo);
            if (candidatosVisiveis.length === 0) {
                conteudo += '<div class="estado-eleicao"><strong>Nenhum candidato disponível para esta consulta.</strong></div>';
            } else {
                conteudo += candidatosVisiveis.map(criarCard).join('');
            }

            if (cargoDeputado && candidatosVisiveis.length < candidatos.length) {
                const restantes = candidatos.length - candidatosVisiveis.length;
                conteudo += `<button type="button" class="carregar-mais">Carregar mais (${restantes})</button>`;
            }

            lista.innerHTML = conteudo;
            lista.scrollLeft = posicaoScroll;
            definirCarregando(false);
            if (layoutHorizontal) estado.iniciarAutoScrollEm = Date.now() + 1600;

            const botaoCarregarMais = lista.querySelector('.carregar-mais');
            if (botaoCarregarMais) {
                botaoCarregarMais.addEventListener('click', () => {
                    estado.quantidadeVisivel += loteDeputados;
                    renderizarCandidatos(data);
                });
            }
        }

        async function atualizarApuracao() {
            ajustarUfAoCargo();
            const turno = selectTurno.value;
            const cargo = selectCargo.value;
            const uf = selectUf.value;
            const numeroConsulta = ++estado.ultimaConsultaApuracao;

            definirCarregando(true);
            if (!estado.ultimaApuracao) {
                ultimaAtualizacao.innerText = 'Buscando dados de 2026...';
            }

            try {
                const caminho = `/api/apuracao?ano=${ANO_ELEICAO}&turno=${turno}&cargo=${cargo}&uf=${uf}`;
                const { response, data } = await requisitarJson(caminho);
                if (numeroConsulta !== estado.ultimaConsultaApuracao) return;

                if ((response.status === 503 && data.codigo === CODIGO_AGUARDANDO_TSE) || data.fase === 'aguardando_tse') {
                    mostrarAguardando();
                    return;
                }

                if (!response.ok || data.erro) {
                    preservarUltimaRespostaOuMostrarIndisponivel();
                    return;
                }

                const anoResposta = Number(data.ano);
                if (anoResposta !== ANO_ELEICAO || String(data.fase || '').toLowerCase() === 'historico') {
                    preservarUltimaRespostaOuMostrarIndisponivel();
                    return;
                }

                if (!data.finalizado && !possuiVotosComputados(data)) {
                    if (horarioDaApuracaoIniciado()) mostrarInicioApuracao(data);
                    else mostrarAguardando();
                    return;
                }

                estado.resultadosDisponiveis = true;
                estado.ultimaApuracao = data;
                atualizarAvisoDados(data);
                atualizarStatus(data);
                renderizarCandidatos(data);
            } catch (error) {
                if (numeroConsulta !== estado.ultimaConsultaApuracao) return;
                console.warn(`Não foi possível atualizar a base eleitoral de ${ANO_ELEICAO}.`, error);
                preservarUltimaRespostaOuMostrarIndisponivel();
            }
        }

        async function consultarStatusEleicao() {
            const numeroConsulta = ++estado.ultimaConsultaStatus;
            const aindaSemDados = !estado.ultimaApuracao;
            if (aindaSemDados) {
                definirCarregando(true);
                ultimaAtualizacao.innerText = 'Consultando disponibilidade dos resultados...';
            }

            try {
                const { response, data } = await requisitarJson(`/api/status-eleicao?ano=${ANO_ELEICAO}`);
                if (numeroConsulta !== estado.ultimaConsultaStatus) return;

                const anoResposta = Number(data.ano);
                if (!response.ok || anoResposta !== ANO_ELEICAO || String(data.fase || '').toLowerCase() === 'historico') {
                    preservarUltimaRespostaOuMostrarIndisponivel();
                    return;
                }

                if (!data.resultadosDisponiveis || data.fase === 'aguardando_tse') {
                    if (estado.ultimaApuracao) preservarUltimaRespostaOuMostrarIndisponivel();
                    else if (horarioDaApuracaoIniciado()) mostrarInicioApuracao();
                    else mostrarAguardando();
                    return;
                }

                estado.resultadosDisponiveis = true;
                await atualizarApuracao();
            } catch (error) {
                if (numeroConsulta !== estado.ultimaConsultaStatus) return;
                console.warn('Não foi possível consultar o status da eleição de 2026.', error);
                preservarUltimaRespostaOuMostrarIndisponivel();
            }
        }

        function aoAlterarFiltro() {
            ajustarUfAoCargo();
            salvarFiltros();
            estado.quantidadeVisivel = loteDeputados;
            if (estado.resultadosDisponiveis) atualizarApuracao();
            else consultarStatusEleicao();
        }

        [selectTurno, selectCargo, selectUf].forEach((select) => select.addEventListener('change', aoAlterarFiltro));

        window.matchMedia(consultaMobile).addEventListener('change', () => {
            atualizarResumo(estado.ultimaApuracao?.resumo || null);
        });

        if (layoutHorizontal) {
            let ultimoFrame = performance.now();
            const velocidadeDesktop = 72;
            const velocidadeMobile = formato970x90
                ? 32
                : (formatoCompacto100 ? 34 : 88);
            const permiteAutoScroll = window.matchMedia(consultaDesktop);

            const atualizarArraste = configurarArrasteCandidatos(lista, estado);

            function animarAutoScroll(tempoAtual) {
                const tempoDecorrido = Math.min(tempoAtual - ultimoFrame, 50);
                ultimoFrame = tempoAtual;
                const velocidadeAtual = permiteAutoScroll.matches && !formato320x100
                    ? velocidadeDesktop
                    : velocidadeMobile;

                const podeRolar = atualizarArraste();
                if (!estado.pausado && Date.now() >= estado.iniciarAutoScrollEm && podeRolar) {
                    lista.scrollLeft += (velocidadeAtual * tempoDecorrido) / 1000;

                    if (lista.scrollLeft >= lista.scrollWidth - lista.clientWidth - 1) {
                        lista.scrollLeft = 0;
                        estado.iniciarAutoScrollEm = Date.now() + 900;
                    }
                }

                window.requestAnimationFrame(animarAutoScroll);
            }

            window.requestAnimationFrame(animarAutoScroll);
        }

        carregarFiltros();
        definirAnoExibido();
        consultarStatusEleicao();
        window.setInterval(consultarStatusEleicao, 120000);
        const atualizarDiaExibido = () => {
            if (estado.ultimaApuracao) atualizarFonteDados(estado.ultimaApuracao);
        };
        // A virada do dia nao precisa consultar novamente a API.
        window.setInterval(atualizarDiaExibido, 60000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) atualizarDiaExibido();
        });
    }

    window.toggleResumo = toggleResumo;
    window.EleicoesWidget = { iniciar };
})();
