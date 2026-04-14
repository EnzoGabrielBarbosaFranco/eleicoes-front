async function atualizarApuracao() {
    // ADICIONADO: Capturando o turno
    const turno = document.getElementById('select-turno').value;
    const cargo = document.getElementById('select-cargo').value;
    const uf = document.getElementById('select-uf').value;
    
    const ufFinal = (cargo === '1') ? 'br' : uf;
    if(cargo === '1') document.getElementById('select-uf').value = 'br';

    try {
        // ADICIONADO: Passando turno=${turno} na URL
        const response = await fetch(`http://localhost:3000/api/apuracao?turno=${turno}&cargo=${cargo}&uf=${ufFinal}`);
        const data = await response.json();

        document.getElementById('txt-percurso').innerText = `${data.percurso}%`;
        document.getElementById('barra-percurso').style.width = `${data.percurso}%`;
        document.getElementById('ultima-atualizacao').innerText = `Atualizado em: ${data.atualizacao}`;

        const lista = document.getElementById('lista-candidatos');
        lista.innerHTML = ''; 

        if (!data.candidatos || data.candidatos.length === 0) {
            lista.innerHTML = '<p style="text-align:center">Nenhum dado disponível.</p>';
            return;
        }

        data.candidatos.forEach(cand => {
            lista.innerHTML += `
                <div class="candidato-card">
                    <div class="candidato-info">
                        <div>
                            <span class="nome-cand">${cand.nome}</span>
                            <span class="partido-tag">| ${cand.partido}</span>
                        </div>
                        <span class="percentual">${cand.votos}%</span>
                    </div>
                    <div class="barra-cand-bg">
                        <div class="barra-cand-fill" style="width: ${cand.votos}%"></div>
                    </div>
                    <div class="votos-absolutos">
                        <span>${cand.total} votos</span>
                        ${cand.eleito ? '<span class="eleito-badge">MATEMATICAMENTE ELEITO</span>' : ''}
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Erro no Front-end:", error);
        document.getElementById('ultima-atualizacao').innerText = "Erro ao carregar dados reais.";
    }
}