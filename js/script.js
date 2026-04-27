const selectTurno = document.getElementById('select-turno');
const selectCargo = document.getElementById('select-cargo');
const selectUf = document.getElementById('select-uf');

function salvarFiltros() {
    if (selectTurno) localStorage.setItem('filtroTurno', selectTurno.value);
    if (selectCargo) localStorage.setItem('filtroCargo', selectCargo.value);
    if (selectUf) localStorage.setItem('filtroUf', selectUf.value);
}

function carregarFiltros() {
    const turnoSalvo = localStorage.getItem('filtroTurno');
    const cargoSalvo = localStorage.getItem('filtroCargo');
    const ufSalva = localStorage.getItem('filtroUf');

    // Restaura os valores salvos
    if (turnoSalvo && selectTurno) selectTurno.value = turnoSalvo;
    if (cargoSalvo && selectCargo) selectCargo.value = cargoSalvo;
    if (ufSalva && selectUf) selectUf.value = ufSalva;

    // Reaplica a regra: Se for Presidente, trava a UF em "BR"
    if (selectCargo && selectCargo.value === '1') {
        if (selectUf) {
            selectUf.value = 'br';
            selectUf.disabled = true;
        }
    } else if (selectUf) {
        selectUf.disabled = false;
    }
}

if (selectTurno && selectCargo && selectUf) {
    selectTurno.addEventListener('change', () => { salvarFiltros(); atualizarApuracao(); });
    selectCargo.addEventListener('change', () => { salvarFiltros(); atualizarApuracao(); });
    selectUf.addEventListener('change', () => { salvarFiltros(); atualizarApuracao(); });
}

async function atualizarApuracao() {
    const selectTurno = document.getElementById('select-turno');
    const selectCargo = document.getElementById('select-cargo');
    const selectUf = document.getElementById('select-uf');

    if (!selectTurno || !selectCargo || !selectUf) return;

    const turno = selectTurno.value;
    const cargo = selectCargo.value;
    let uf = selectUf.value;
    
    if (cargo === '1') {
        selectUf.value = 'br'; 
        uf = 'br';
        selectUf.disabled = true; 
    } else {
        selectUf.disabled = false; 
        if (uf === 'br') {
            selectUf.value = 'sp'; 
            uf = 'sp';
        }
    }

    try {
        document.getElementById('ultima-atualizacao').innerText = "Buscando dados...";
        
        // Link atualizado para o ambiente de produção na Cloudflare
        const url = `https://backend-eleicoes.enzoddos7.workers.dev/api/apuracao?turno=${turno}&cargo=${cargo}&uf=${uf}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.erro) {
            document.getElementById('txt-percurso').innerText = "0%";
            document.getElementById('barra-percurso').style.width = "0%";
            document.getElementById('ultima-atualizacao').innerText = ""; 
            document.getElementById('lista-candidatos').innerHTML = `<p style="text-align:center; padding:20px; font-weight:bold; color:#d63031;">${data.mensagem}</p>`;
            return;
        }

        // Tratamento seguro do percurso para evitar erros no CSS
        const percursoBruto = data.percurso || "0,00";
        let percursoCss = percursoBruto.replace(',', '.'); 
        document.getElementById('barra-percurso').style.width = `${percursoCss}%`;

        let textoPercurso = percursoBruto.endsWith(',00') 
            ? percursoBruto.replace(',00', '') 
            : percursoBruto;
        
        document.getElementById('txt-percurso').innerText = `${textoPercurso}%`;
        document.getElementById('ultima-atualizacao').innerText = `Atualizado em: ${data.atualizacao || 'Sem informação de hora'}`;

        // Injeta os votos com proteções contra dados ausentes
        const resumo = data.resumo || {};
        document.getElementById('votos-validos').innerText = `${resumo.validos || '--'}\n(${resumo.pctValidos || '0,00'}%)`;
        document.getElementById('votos-brancos').innerText = `${resumo.brancos || '--'}\n(${resumo.pctBrancos || '0,00'}%)`;
        document.getElementById('votos-nulos').innerText = `${resumo.nulos || '--'}\n(${resumo.pctNulos || '0,00'}%)`;
        document.getElementById('votos-abstencoes').innerText = `${resumo.abstencoes || '--'}\n(${resumo.pctAbstencoes || '0,00'}%)`;

        let candidatosParaRenderizar = [...(data.candidatos || [])];

        if (turno === '1' && (cargo === '1' || cargo === '3')) {
            const temAlguemEleito = candidatosParaRenderizar.some(c => c.eleito);
            const apiJaMarcouSegundoTurno = candidatosParaRenderizar.some(c => c.segundoTurno);
            
            if (!temAlguemEleito && !apiJaMarcouSegundoTurno && candidatosParaRenderizar.length >= 2) {
                const top2 = candidatosParaRenderizar.slice(0, 2);
                top2.sort((a, b) => a.nome.localeCompare(b.nome));
                
                top2[0].passouTurno = true;
                top2[1].passouTurno = true;

                candidatosParaRenderizar = [...top2, ...candidatosParaRenderizar.slice(2)];
            }
        }

        const lista = document.getElementById('lista-candidatos');
        lista.innerHTML = ''; 

        candidatosParaRenderizar.forEach(cand => {
            let badgeHTML = '';
            let percentualVotos = parseFloat(cand.votos || 0);

            if (turno === '1' && (cargo === '1' || cargo === '3')) {
                if (cand.eleito && percentualVotos > 50) {
                    badgeHTML = '<span class="eleito-badge badge-verde">Eleito no 1º Turno</span>';
                } else if (cand.segundoTurno || cand.passouTurno || (cand.eleito && percentualVotos <= 50)) {
                    badgeHTML = '<span class="eleito-badge badge-amarelo">Vai para o 2º Turno</span>';
                }
            } else {
                if (cand.eleito) {
                    badgeHTML = '<span class="eleito-badge badge-verde">Eleito</span>';
                }
            }

            lista.innerHTML += `
                <div class="candidato-card">
                    <div class="candidato-info">
                        <div class="candidato-flex">
                            <div class="foto-container">
                                <img src="${cand.foto}" 
                                    class="foto-cand" 
                                    onerror="this.src='https://via.placeholder.com/50?text=👤'" 
                                    alt="${cand.nome || 'Candidato'}">
                            </div>
                            <div class="info-textos">
                                <span class="nome-cand">${cand.nome || 'Nome Indisponível'}</span>
                                <span class="partido-tag">${cand.partido || 'N/A'}</span>
                                ${badgeHTML}
                            </div>
                        </div>
                        <div class="percentual">${cand.votos || '0,00'}%</div>
                    </div>
                    <div class="barra-cand-bg">
                        <div class="barra-cand-fill" style="width: ${cand.votos || 0}%"></div>
                    </div>
                    <div class="votos-absolutos">
                        <span>${cand.total || 0} votos</span>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Erro no Front-end:", error);
        document.getElementById('ultima-atualizacao').innerText = "Erro ao carregar dados reais.";
    }
}

function sugerirLocalizacao() {
    atualizarApuracao();
}

carregarFiltros();
sugerirLocalizacao();
setInterval(atualizarApuracao, 120000);