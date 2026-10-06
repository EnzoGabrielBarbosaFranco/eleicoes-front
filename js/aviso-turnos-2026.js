(function () {
    'use strict';

    // Apenas informativo: nao troca turno, filtros, calendario ou consultas.
    function aplicar(cabecalho, consultaMobile) {
        const copia = cabecalho?.querySelector('.header-copy');
        if (!copia) return;

        document.body.classList.add('com-aviso-turnos');
        if (!copia.querySelector('.aviso-turnos')) {
            const aviso = document.createElement('span');
            aviso.className = 'aviso-turnos';
            const descricao = 'Resultados exibidos: 1º turno. Calendário do TSE: 2º turno em 25/10/2026, onde houver disputa.';
            aviso.title = descricao;
            aviso.setAttribute('aria-label', descricao);
            aviso.innerHTML = '<span>1º turno</span><span aria-hidden="true">·</span>'
                + '<span>2º<span class="aviso-turnos-extenso"> turno</span>: <time datetime="2026-10-25">25/10</time></span>';
            copia.append(aviso);
        }

        // Seguir o modo real do embed, nao apenas a largura interna do iframe.
        if (cabecalho.dataset.avisoTurnosPreparado) return;
        cabecalho.dataset.avisoTurnosPreparado = '1';
        const formatoCompacto = document.body.matches('.formato-compacto-100, .formato-970x90, .formato-320x100');
        const fixo = document.body.classList.contains('formato-320x100');
        const media = window.matchMedia(consultaMobile);
        const atualizar = () => document.body.classList.toggle('turnos-mobile-compacto', formatoCompacto && (fixo || media.matches));
        atualizar();
        media.addEventListener('change', atualizar);
    }

    window.AvisoTurnos2026 = Object.freeze({ aplicar });
})();
