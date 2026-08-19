(function () {
    const ANO_ELEICAO_ATUAL = 2026;
    const ANO_DEMONSTRACAO = 2022;
    const CODIGO_AGUARDANDO_TSE = 'ELEICAO_AGUARDANDO_TSE';
    const MENSAGEM_AGUARDANDO = 'Os resultados de 2026 ainda não foram liberados pelo TSE.';
    const API_PRODUCAO = 'https://backend-eleicoes.enzo-eleicoes-backend.workers.dev/';

    function obterApiBaseUrl() {
        if (window.location.hostname === '127.0.0.1') return 'http://127.0.0.1:8787';
        if (window.location.hostname === 'localhost') return 'http://localhost:8787';
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

    function rotuloFase(fase) {
        const rotulos = {
            simulado: 'Simulado',
            oficial: 'Oficial',
            historico: 'Histórico',
            aguardando_tse: 'Aguardando TSE'
        };
        return rotulos[fase] || fase || 'Não informada';
    }

    function percentualNumerico(valor) {
        const numero = Number.parseFloat(String(valor ?? '0').replace(',', '.'));
        if (!Number.isFinite(numero)) return 0;
        return Math.min(100, Math.max(0, numero));
    }

    function formatarPercentual(valor) {
        return String(valor ?? '0,00').replace('.', ',');
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
        const anoBadge = document.getElementById('ano-badge');

        if (!selectTurno || !selectCargo || !selectUf || !lista || !textoPercurso || !barraPercurso || !ultimaAtualizacao) {
            console.error('Não foi possível iniciar o widget: elementos obrigatórios não encontrados.');
            return;
        }

        const estado = {
            resultadosDisponiveis: false,
            anoExibido: ANO_ELEICAO_ATUAL,
            usandoDemonstracao: false,
            quantidadeVisivel: loteDeputados,
            ultimaApuracao: null,
            ultimaConsulta: 0,
            pausado: false,
            iniciarAutoScrollEm: Date.now() + 1600
        };

        function definirAnoExibido(ano) {
            estado.anoExibido = Number(ano);
            estado.usandoDemonstracao = estado.anoExibido === ANO_DEMONSTRACAO;

            if (raizWidget) raizWidget.dataset.ano = String(estado.anoExibido);
            if (anoBadge) {
                anoBadge.innerText = estado.usandoDemonstracao ? 'Demo 2022' : String(estado.anoExibido);
                anoBadge.classList.toggle('is-demo', estado.usandoDemonstracao);
            }

            const titulo = document.querySelector('.widget-header h2, .bloco-header h2');
            if (!titulo) return;

            const tituloCompacto = tipo === '300x250' || tipo === 'horizontal';
            titulo.innerText = tituloCompacto
                ? `Apuração ${estado.anoExibido}`
                : `Apuração das Eleições de ${estado.anoExibido}`;
        }

        function definirCarregando(carregando) {
            lista.setAttribute('aria-busy', String(carregando));
            if (raizWidget) raizWidget.classList.toggle('is-loading', carregando);
        }

        function salvarFiltros() {
            localStorage.setItem('filtroTurno', selectTurno.value);
            localStorage.setItem('filtroCargo', selectCargo.value);
            localStorage.setItem('filtroUf', selectUf.value);
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
            const turnoSalvo = localStorage.getItem('filtroTurno');
            const cargoSalvo = localStorage.getItem('filtroCargo');
            const ufSalva = localStorage.getItem('filtroUf');

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

        function mostrarAguardando() {
            estado.resultadosDisponiveis = false;
            estado.ultimaApuracao = null;
            definirCarregando(false);
            limparProgresso();
            ultimaAtualizacao.innerText = 'Fase: Aguardando TSE';
            lista.innerHTML = `
                <div class="estado-eleicao estado-aguardando" role="status">
                    <span class="estado-icone" aria-hidden="true">◷</span>
                    <strong>${MENSAGEM_AGUARDANDO}</strong>
                </div>
            `;
        }

        function mostrarErro(mensagem) {
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
            textoPercurso.innerText = `${percurso.endsWith(',00') ? percurso.slice(0, -3) : percurso}%`;
            barraPercurso.style.width = `${percentualNumerico(percurso)}%`;
            if (barraProgresso) barraProgresso.setAttribute('aria-valuenow', String(percentualNumerico(percurso)));

            const andamento = data.finalizado
                ? 'Finalizado'
                : data.andamento
                    ? String(data.andamento)
                    : 'Em andamento';
            ultimaAtualizacao.innerText = `Fase: ${rotuloFase(data.fase)} · ${andamento} · Atualizado: ${data.atualizacao || 'sem horário'}`;
            atualizarResumo(data.resumo || {});
        }

        function criarBadgeSituacao(candidato) {
            const situacao = candidato.situacao || (candidato.eleito ? 'Eleito' : 'Situação não informada');
            let classe = 'badge-neutro';
            if (candidato.eleito) classe = 'badge-verde';
            else if (/2º turno|segundo turno/i.test(situacao)) classe = 'badge-amarelo';
            return `<span class="eleito-badge ${classe}">${escaparHtml(situacao)}</span>`;
        }

        function textoViceSuplentes(candidato) {
            if (!Array.isArray(candidato.viceSuplentes) || candidato.viceSuplentes.length === 0) return '';
            return candidato.viceSuplentes
                .map((pessoa) => {
                    const tipoPessoa = pessoa.tipo || 'Vice/Suplente';
                    const partido = pessoa.partido ? ` (${pessoa.partido})` : '';
                    return `${tipoPessoa}: ${pessoa.nome || 'Nome não informado'}${partido}`;
                })
                .join(' · ');
        }

        function criarCardVertical(candidato, indice) {
            const nome = escaparHtml(candidato.nome || 'Nome indisponível');
            const numero = candidato.numero != null ? `Nº ${escaparHtml(candidato.numero)}` : 'Número não informado';
            const partido = escaparHtml(candidato.partido || 'Partido não informado');
            const foto = candidato.foto ? escaparHtml(candidato.foto) : '';
            const votos = escaparHtml(formatarPercentual(candidato.votos));
            const total = escaparHtml(candidato.total || 0);
            const viceSuplentes = escaparHtml(textoViceSuplentes(candidato));
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
                        ${viceSuplentes ? `<span class="vice-suplentes">${viceSuplentes}</span>` : ''}
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
            const viceSuplentes = escaparHtml(textoViceSuplentes(candidato));
            const iniciais = escaparHtml(obterIniciais(candidato.nome));

            return `
                <article class="card-cand" title="${viceSuplentes}" aria-label="${nome}, ${votos}% dos votos">
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
                        ${viceSuplentes ? `<div class="card-complemento">${viceSuplentes}</div>` : ''}
                    </div>
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

            partes.push(`Fase: ${rotuloFase(data.fase)}`);
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
            const criarCard = tipo === 'horizontal' ? criarCardHorizontal : criarCardVertical;

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
            if (tipo === 'horizontal') estado.iniciarAutoScrollEm = Date.now() + 1600;

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
            const numeroConsulta = ++estado.ultimaConsulta;

            definirCarregando(true);
            ultimaAtualizacao.innerText = 'Buscando dados...';

            try {
                const caminho = `/api/apuracao?ano=${estado.anoExibido}&turno=${turno}&cargo=${cargo}&uf=${uf}`;
                const { response, data } = await requisitarJson(caminho);
                if (numeroConsulta !== estado.ultimaConsulta) return;

                if ((response.status === 503 && data.codigo === CODIGO_AGUARDANDO_TSE) || data.fase === 'aguardando_tse') {
                    if (estado.anoExibido === ANO_ELEICAO_ATUAL) {
                        definirAnoExibido(ANO_DEMONSTRACAO);
                        estado.resultadosDisponiveis = true;
                        await atualizarApuracao();
                        return;
                    }
                    mostrarAguardando();
                    return;
                }

                if (!response.ok || data.erro) {
                    mostrarErro(data.mensagem || `A API respondeu com status ${response.status}.`);
                    return;
                }

                estado.resultadosDisponiveis = true;
                estado.ultimaApuracao = data;
                atualizarStatus(data);
                renderizarCandidatos(data);
            } catch (error) {
                console.error('Erro ao consultar a apuração:', error);
                mostrarErro('Não foi possível conectar ao backend da eleição.');
            }
        }

        async function consultarStatusEleicao() {
            const numeroConsulta = ++estado.ultimaConsulta;
            definirCarregando(true);
            ultimaAtualizacao.innerText = 'Consultando disponibilidade dos resultados...';

            try {
                const { response, data } = await requisitarJson(`/api/status-eleicao?ano=${ANO_ELEICAO_ATUAL}`);
                if (numeroConsulta !== estado.ultimaConsulta) return;

                if (!response.ok) {
                    mostrarErro(data.mensagem || `A API respondeu com status ${response.status}.`);
                    return;
                }

                if (!data.resultadosDisponiveis || data.fase === 'aguardando_tse') {
                    definirAnoExibido(data.amostra?.ano || ANO_DEMONSTRACAO);
                    estado.resultadosDisponiveis = true;
                    await atualizarApuracao();
                    return;
                }

                definirAnoExibido(ANO_ELEICAO_ATUAL);
                estado.resultadosDisponiveis = true;
                await atualizarApuracao();
            } catch (error) {
                console.error('Erro ao consultar o status da eleição:', error);
                mostrarErro('Não foi possível consultar a disponibilidade dos resultados.');
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

        if (tipo === 'horizontal') {
            let ultimoFrame = performance.now();
            const velocidadePixelsPorSegundo = 72;

            lista.addEventListener('mouseenter', () => { estado.pausado = true; });
            lista.addEventListener('mouseleave', () => {
                estado.pausado = false;
                estado.iniciarAutoScrollEm = Date.now() + 500;
            });
            lista.addEventListener('touchstart', () => { estado.pausado = true; }, { passive: true });
            lista.addEventListener('touchend', () => {
                window.setTimeout(() => {
                    estado.pausado = false;
                    estado.iniciarAutoScrollEm = Date.now() + 500;
                }, 900);
            }, { passive: true });
            lista.addEventListener('wheel', () => {
                estado.iniciarAutoScrollEm = Date.now() + 700;
            }, { passive: true });

            function animarAutoScroll(tempoAtual) {
                const tempoDecorrido = Math.min(tempoAtual - ultimoFrame, 50);
                ultimoFrame = tempoAtual;

                if (!estado.pausado && Date.now() >= estado.iniciarAutoScrollEm && lista.scrollWidth > lista.clientWidth) {
                    lista.scrollLeft += (velocidadePixelsPorSegundo * tempoDecorrido) / 1000;

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
        definirAnoExibido(ANO_ELEICAO_ATUAL);
        consultarStatusEleicao();
        window.setInterval(consultarStatusEleicao, 120000);
    }

    window.toggleResumo = toggleResumo;
    window.EleicoesWidget = { iniciar };
})();
