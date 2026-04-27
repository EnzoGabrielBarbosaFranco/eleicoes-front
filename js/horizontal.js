// Memória global para o alerta de virada
let liderAnterior = null; 

async function atualizarApuracao() {
    const selectTurno = document.getElementById('select-turno');
    const selectCargo = document.getElementById('select-cargo');
    const selectUf = document.getElementById('select-uf');

    if (!selectTurno || !selectCargo || !selectUf) return;

    const turno = selectTurno.value;
    const cargo = selectCargo.value;
    let uf = selectUf.value;
    
    // INÍCIO: White-label (Customização de Cor via URL)
    const parametrosUrl = new URLSearchParams(window.location.search);
    const corCustomizada = parametrosUrl.get('cor');
    if (corCustomizada) {
        document.documentElement.style.setProperty('--cor-principal', `#${corCustomizada}`);
    }
    // FIM: White-label

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
        const url = `https://backend-eleicoes.enzoddos7.workers.dev/api/apuracao?turno=${turno}&cargo=${cargo}&uf=${uf}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.erro) {
            document.getElementById('txt-percurso').innerText = "0%";
            document.getElementById('barra-percurso').style.width = "0%";
            document.getElementById('ultima-atualizacao').innerText = ""; 
            document.getElementById('lista-candidatos').innerHTML = `<span class="loading-msg" style="color: #d63031;">${data.mensagem}</span>`;
            return;
        }

        const percursoBruto = data.percurso || "0,00";
        let percursoCss = percursoBruto.replace(',', '.'); 
        document.getElementById('barra-percurso').style.width = `${percursoCss}%`;

        let textoPercurso = percursoBruto.endsWith(',00') 
            ? percursoBruto.replace(',00', '') 
            : percursoBruto;
        
        document.getElementById('txt-percurso').innerText = `${textoPercurso}%`;
        document.getElementById('ultima-atualizacao').innerText = `Atualizado: ${data.atualizacao || '--:--'}`;

        let candidatosParaRenderizar = [...(data.candidatos || [])];
        if (candidatosParaRenderizar.length === 0) return;

        // INÍCIO: Lógica da Virada
        const liderAtual = candidatosParaRenderizar[0].nome;
        let houveVirada = false;

        if (liderAnterior !== null && liderAnterior !== liderAtual) {
            houveVirada = true;
        }
        liderAnterior = liderAtual;
        // FIM: Lógica da Virada

        if (turno === '1' && (cargo === '1' || cargo === '3')) {
            const temAlguemEleito = candidatosParaRenderizar.some(c => c.eleito);
            const apiJaMarcouSegundoTurno = candidatosParaRenderizar.some(c => c.segundoTurno);
            
            if (!temAlguemEleito && !apiJaMarcouSegundoTurno && candidatosParaRenderizar.length >= 2) {
                const top2 = candidatosParaRenderizar.slice(0, 2);
                top2.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
                top2[0].passouTurno = true;
                top2[1].passouTurno = true;
                candidatosParaRenderizar = [...top2, ...candidatosParaRenderizar.slice(2)];
            }
        }

        const lista = document.getElementById('lista-candidatos');
        let scrollPosition = lista.scrollLeft;
        lista.innerHTML = ''; 

        candidatosParaRenderizar.forEach((cand, index) => {
            let badgeHTML = '';
            let percentualVotos = parseFloat(cand.votos || 0);

            // Verificação hierárquica das tags: Virada ganha prioridade no index 0
            if (index === 0 && houveVirada) {
                badgeHTML = '<div class="eleito-badge badge-virada">🔥 NOVA VIRADA!</div>';
            } else if (turno === '1' && (cargo === '1' || cargo === '3')) {
                if (cand.eleito && percentualVotos > 50) {
                    badgeHTML = '<div class="eleito-badge badge-verde">Eleito no 1º T</div>';
                } else if (cand.segundoTurno || cand.passouTurno || (cand.eleito && percentualVotos <= 50)) {
                    badgeHTML = '<div class="eleito-badge badge-amarelo">2º Turno</div>';
                }
            } else {
                if (cand.eleito) {
                    badgeHTML = '<div class="eleito-badge badge-verde">Eleito</div>';
                }
            }

            lista.innerHTML += `
                <div class="card-cand">
                    <div class="foto-container">
                        <img src="${cand.foto}" 
                            class="foto-cand" 
                            onerror="this.src='https://via.placeholder.com/40?text=👤'" 
                            alt="${cand.nome || 'Candidato'}">
                    </div>
                    <div class="info-cand">
                        <div class="card-topo">
                            <span class="card-nome" title="${cand.nome || ''}">${cand.nome || 'N/D'}</span>
                            <span class="card-pct">${cand.votos || '0,00'}%</span>
                        </div>
                        <div class="card-barra-bg">
                            <div class="card-barra-fill" style="width: ${cand.votos || 0}%; background-color: var(--cor-principal, #2563eb);"></div>
                        </div>
                        <div class="card-votos">${cand.total || 0} votos</div>
                    </div>
                    ${badgeHTML}
                </div>
            `;
        });

        lista.scrollLeft = scrollPosition;

    } catch (error) {
        console.error("Erro no Front-end:", error);
        document.getElementById('ultima-atualizacao').innerText = "Erro na conexão";
    }
}

// Mecanismo de Auto-scroll mantido intacto
const carrossel = document.getElementById('lista-candidatos');
let isPaused = false;

carrossel.addEventListener('mouseenter', () => isPaused = true);
carrossel.addEventListener('mouseleave', () => isPaused = false);
carrossel.addEventListener('touchstart', () => isPaused = true);
carrossel.addEventListener('touchend', () => { setTimeout(() => isPaused = false, 2000); });

function autoScroll() {
    if (!isPaused && carrossel.scrollWidth > carrossel.clientWidth) {
        carrossel.scrollLeft += 1; 
        
        if (carrossel.scrollLeft >= (carrossel.scrollWidth - carrossel.clientWidth - 1)) {
            isPaused = true;
            setTimeout(() => {
                carrossel.scrollLeft = 0;
                isPaused = false;
            }, 1000);
        }
    }
}

setInterval(autoScroll, 35); 

function sugerirLocalizacao() {
    atualizarApuracao();
}

sugerirLocalizacao();
setInterval(atualizarApuracao, 120000);