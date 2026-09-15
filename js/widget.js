(function () {
    const ANO_ELEICAO = 2022;
    const API_PRODUCAO = 'https://backend-eleicoes.enzo-eleicoes-backend.workers.dev';

    function obterApiBaseUrl() {
        const ambienteLocal = window.location.hostname === '127.0.0.1'
            || window.location.hostname === 'localhost';

        if (ambienteLocal) {
            const host = window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
            return `http://${host}:8787`;
        }

        return API_PRODUCAO;
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
        return correspondencia ? correspondencia[0] : '';
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

    function iniciar(opcoes = {}) {
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

        if (!selectTurno || !selectCargo || !selectUf || !lista || !textoPercurso || !barraPercurso || !ultimaAtualizacao || !raizWidget) {
            console.error('Não foi possível iniciar o widget: elementos obrigatórios não encontrados.');
            return;
        }

        const estado = {
            quantidadeVisivel: loteDeputados,
            ultimaApuracao: null,
            ultimaConsultaApuracao: 0,
            pausado: false,
            iniciarAutoScrollEm: Date.now() + 1600
        };

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
            localStorage.setItem('filtro2022Turno', selectTurno.value);
            localStorage.setItem('filtro2022Cargo', selectCargo.value);
            localStorage.setItem('filtro2022Uf', selectUf.value);
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
            const turnoSalvo = localStorage.getItem('filtro2022Turno');
            const cargoSalvo = localStorage.getItem('filtro2022Cargo');
            const ufSalva = localStorage.getItem('filtro2022Uf');

            if (turnoSalvo) selectTurno.value = turnoSalvo;
            if (cargoSalvo) selectCargo.value = cargoSalvo;
            if (ufSalva) selectUf.value = ufSalva;
            ajustarUfAoCargo();
        }

        function atualizarResumo(resumo) {
            const campos = {
                'votos-validos': resumo ? `${resumo.validos || '--'}\n(${resumo.pctValidos || '0,00'}%)` : '--',
                'votos-brancos': resumo ? `${resumo.brancos || '--'}\n(${resumo.pctBrancos || '0,00'}%)` : '--',
                'votos-nulos': resumo ? `${resumo.nulos || '--'}\n(${resumo.pctNulos || '0,00'}%)` : '--',
                'votos-abstencoes': resumo ? `${resumo.abstencoes || '--'}\n(${resumo.pctAbstencoes || '0,00'}%)` : '--'
            };

            Object.entries(campos).forEach(([id, valor]) => {
                const elemento = document.getElementById(id);
                if (elemento) elemento.innerText = valor;
            });
        }

        function limparProgresso() {
            textoPercurso.innerText = '0%';
            barraPercurso.style.width = '0%';
            if (barraProgresso) barraProgresso.setAttribute('aria-valuenow', '0');
            atualizarResumo(null);
        }

        function mostrarErro(mensagem) {
            estado.ultimaApuracao = null;
            definirCarregando(false);
            limparProgresso();
            ultimaAtualizacao.innerText = 'Não foi possível atualizar a apuração.';
            lista.innerHTML = `
                <div class="estado-eleicao estado-erro" role="alert">
                    <strong>${escaparHtml(mensagem || 'Erro ao carregar os dados da eleição.')}</strong>
                </div>
            `;
        }

        function atualizarStatus(data) {
            const percurso = String(data.percurso || '0,00');
            const percentualApurado = percentualNumerico(percurso);
            textoPercurso.innerText = `${percurso.endsWith(',00') ? percurso.slice(0, -3) : percurso}%`;
            barraPercurso.style.width = `${percentualApurado}%`;
            if (barraProgresso) barraProgresso.setAttribute('aria-valuenow', String(percentualApurado));

            const andamento = percentualApurado >= 100 ? 'Finalizado' : 'Em andamento';
            const horarioAtualizacao = extrairHorario(data.atualizacao);
            ultimaAtualizacao.innerText = horarioAtualizacao
                ? `${andamento} · ${horarioAtualizacao}`
                : andamento;
            atualizarResumo(data.resumo || {});
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
            const numero = candidato.numero != null ? `Nº ${escaparHtml(candidato.numero)}` : 'S/N';
            const partido = escaparHtml(candidato.partido || 'N/A');
            const foto = candidato.foto ? escaparHtml(candidato.foto) : '';
            const votos = escaparHtml(formatarPercentual(candidato.votos));
            const total = escaparHtml(candidato.total || 0);
            const iniciais = escaparHtml(obterIniciais(candidato.nome));

            return `
                <article class="card-cand" aria-label="${nome}, ${votos}% dos votos">
                    <span class="ranking-cand" aria-label="${indice + 1}ª posição">${indice + 1}</span>
                    <div class="foto-container">
                        <span class="candidato-iniciais" aria-hidden="true">${iniciais}</span>
                        ${foto ? `<img src="${foto}" class="foto-cand" onerror="this.remove()" alt="Foto de ${nome}">` : ''}
                    </div>
                    <div class="info-cand">
                        <div class="card-topo">
                            <span class="card-nome">${numero} · ${nome}</span>
                            <span class="card-pct">${votos}%</span>
                        </div>
                        <div class="card-barra-bg" role="progressbar" aria-label="Percentual de votos de ${nome}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentualNumerico(candidato.votos)}">
                            <div class="card-barra-fill" style="width: ${percentualNumerico(candidato.votos)}%"></div>
                        </div>
                        <div class="card-votos">${total} votos · ${partido}</div>
                    </div>
                    ${criarBadgeSituacao(candidato)}
                </article>
            `;
        }

        function criarMetadados(data, cargo) {
            const totalCandidatos = data.totalCandidatos ?? (Array.isArray(data.candidatos) ? data.candidatos.length : 0);
            const vagas = data.vagas ?? (cargo === '5' ? 1 : null);
            const partes = [`${totalCandidatos} candidato${totalCandidatos === 1 ? '' : 's'}`];

            if (vagas != null) partes.push(`${vagas} vaga${Number(vagas) === 1 ? '' : 's'}`);

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
            ultimaAtualizacao.innerText = 'Buscando dados...';

            try {
                const caminho = `/api/apuracao?ano=${ANO_ELEICAO}&turno=${turno}&cargo=${cargo}&uf=${uf}`;
                const { response, data } = await requisitarJson(caminho);
                if (numeroConsulta !== estado.ultimaConsultaApuracao) return;

                if (!response.ok || data.erro) {
                    mostrarErro(data.mensagem || `A API respondeu com status ${response.status}.`);
                    return;
                }

                const anoResposta = Number(data.ano || ANO_ELEICAO);
                if (anoResposta !== ANO_ELEICAO) {
                    mostrarErro('A API retornou dados de um ano diferente do solicitado.');
                    return;
                }

                estado.ultimaApuracao = data;
                atualizarStatus(data);
                renderizarCandidatos(data);
            } catch (error) {
                if (numeroConsulta !== estado.ultimaConsultaApuracao) return;
                console.error('Erro ao consultar a apuração de 2022:', error);
                mostrarErro('Não foi possível conectar ao backend da eleição.');
            }
        }

        function aoAlterarFiltro() {
            ajustarUfAoCargo();
            salvarFiltros();
            estado.quantidadeVisivel = loteDeputados;
            atualizarApuracao();
        }

        [selectTurno, selectCargo, selectUf].forEach((select) => select.addEventListener('change', aoAlterarFiltro));

        if (layoutHorizontal) {
            let ultimoFrame = performance.now();
            const velocidadeDesktop = 72;
            const velocidadeMobile = 88;
            const permiteAutoScroll = window.matchMedia('(min-width: 761px)');

            lista.addEventListener('mouseenter', () => {
                if (permiteAutoScroll.matches) estado.pausado = true;
            });
            lista.addEventListener('mouseleave', () => {
                if (!permiteAutoScroll.matches) return;
                estado.pausado = false;
                estado.iniciarAutoScrollEm = Date.now() + 500;
            });
            lista.addEventListener('touchstart', () => {
                estado.pausado = true;
            }, { passive: true });

            function liberarAposToque() {
                estado.pausado = false;
                estado.iniciarAutoScrollEm = Date.now() + 700;
            }

            lista.addEventListener('touchend', liberarAposToque, { passive: true });
            lista.addEventListener('touchcancel', liberarAposToque, { passive: true });
            lista.addEventListener('wheel', () => {
                estado.iniciarAutoScrollEm = Date.now() + 700;
            }, { passive: true });

            function animarAutoScroll(tempoAtual) {
                const tempoDecorrido = Math.min(tempoAtual - ultimoFrame, 50);
                ultimoFrame = tempoAtual;
                const velocidadeAtual = permiteAutoScroll.matches
                    ? velocidadeDesktop
                    : velocidadeMobile;

                if (!estado.pausado && Date.now() >= estado.iniciarAutoScrollEm && lista.scrollWidth > lista.clientWidth) {
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
        atualizarApuracao();
        window.setInterval(atualizarApuracao, 120000);
    }

    window.toggleResumo = toggleResumo;
    window.EleicoesWidget = { iniciar };
})();
