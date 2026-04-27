// Variável global para armazenar quem estava ganhando na última checagem
let liderAnterior = null; 

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

        const percursoBruto = data.percurso || "0,00";
        let percursoCss = percursoBruto.replace(',', '.'); 
        document.getElementById('barra-percurso').style.width = `${percursoCss}%`;

        let textoPercurso = percursoBruto.endsWith(',00') 
            ? percursoBruto.replace(',00', '') 
            : percursoBruto;
        
        document.getElementById('txt-percurso').innerText = `${textoPercurso}%`;
        document.getElementById('ultima-atualizacao').innerText = `Atualizado em: ${data.atualizacao || 'Sem informação de hora'}`;

        const resumo = data.resumo || {};
        document.getElementById('votos-validos').innerText = `${resumo.validos || '--'}\n(${resumo.pctValidos || '0,00'}%)`;
        document.getElementById('votos-brancos').innerText = `${resumo.brancos || '--'}\n(${resumo.pctBrancos || '0,00'}%)`;
        document.getElementById('votos-nulos').innerText = `${resumo.nulos || '--'}\n(${resumo.pctNulos || '0,00'}%)`;
        document.getElementById('votos-abstencoes').innerText = `${resumo.abstencoes || '--'}\n(${resumo.pctAbstencoes || '0,00'}%)`;

        let candidatosParaRenderizar = [...(data.candidatos || [])];
        if (candidatosParaRenderizar.length === 0) return;

        // FUNCIONALIDADE: Alerta de Virada
        const liderAtual = candidatosParaRenderizar[0].nome;
        let houveVirada = false;

        // Verifica se o líder mudou em relação à última vez
        if (liderAnterior !== null && liderAnterior !== liderAtual) {
            houveVirada = true;
        }
        liderAnterior = liderAtual; // Atualiza a memória

        // Regra de top 2 (que você já tinha feito)
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

        candidatosParaRenderizar.forEach((cand, index) => {
            let badgeHTML = '';
            let percentualVotos = parseFloat(cand.votos || 0);

            // Verifica as tags na ordem: Virada -> Eleito 1ºT -> 2ºT -> Eleito
            if (index === 0 && houveVirada) {
                badgeHTML = '<span class="eleito-badge badge-virada">🔥 NOVA VIRADA!</span>';
            } else if (turno === '1' && (cargo === '1' || cargo === '3')) {
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

sugerirLocalizacao();
setInterval(atualizarApuracao, 120000);