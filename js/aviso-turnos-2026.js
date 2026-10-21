(function () {
    'use strict';

    // A partir da preparacao de 20/10, mostrar somente candidatos do segundo
    // turno. Em 25/10 00h Brasilia, habilitar os resultados publicados pelo TSE.
    const INICIO_SEGUNDO_TURNO = Date.parse('2026-10-20T00:00:00-03:00');
    const VIRADA_SEGUNDO_TURNO = Date.parse('2026-10-25T00:00:00-03:00');
    const observadores = new Set();
    let ultimoEstado = `${turnoAtual()}:${resultadosLiberados()}`;
    let temporizador;

    function turnoAtual() {
        return Date.now() >= INICIO_SEGUNDO_TURNO ? '2' : '1';
    }

    function resultadosLiberados() {
        return Date.now() >= VIRADA_SEGUNDO_TURNO;
    }

    function verificarCalendario() {
        const turno = turnoAtual();
        const estado = `${turno}:${resultadosLiberados()}`;
        if (estado !== ultimoEstado) {
            ultimoEstado = estado;
            for (const atualizar of observadores) atualizar(turno);
        }
        window.clearTimeout(temporizador);
        const restante = (Date.now() < INICIO_SEGUNDO_TURNO ? INICIO_SEGUNDO_TURNO : VIRADA_SEGUNDO_TURNO) - Date.now();
        if (restante > 0) temporizador = window.setTimeout(verificarCalendario, Math.min(restante, 60000));
    }

    function observar(atualizar) {
        observadores.add(atualizar);
        verificarCalendario();
    }

    window.addEventListener('focus', verificarCalendario);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) verificarCalendario();
    });

    function aplicar(cabecalho, consultaMobile) {
        const copia = cabecalho?.querySelector('.header-copy');
        if (!copia) return;

        document.body.classList.add('com-aviso-turnos');
        if (!copia.querySelector('.aviso-turnos')) {
            const aviso = document.createElement('span');
            aviso.className = 'aviso-turnos';
            copia.append(aviso);
        }

        const atualizarAviso = () => {
            const aviso = copia.querySelector('.aviso-turnos');
            const segundo = turnoAtual() === '2';
            const descricao = segundo
                ? 'Candidatos e apuração do 2º turno das Eleições 2026, em 25/10/2026, onde houver disputa.'
                : 'Resultados exibidos: 1º turno. Calendário do TSE: 2º turno em 25/10/2026, onde houver disputa.';
            aviso.title = descricao;
            aviso.setAttribute('aria-label', descricao);
            aviso.innerHTML = segundo
                ? '<span>2º turno</span><span aria-hidden="true">·</span><time datetime="2026-10-25">25/10</time>'
                : '<span>1º turno</span><span aria-hidden="true">·</span>'
                    + '<span>2º<span class="aviso-turnos-extenso"> turno</span>: <time datetime="2026-10-25">25/10</time></span>';
        };
        atualizarAviso();

        // Seguir o modo real do embed, nao apenas a largura interna do iframe.
        if (cabecalho.dataset.avisoTurnosPreparado) return;
        cabecalho.dataset.avisoTurnosPreparado = '1';
        observar(atualizarAviso);
        const formatoCompacto = document.body.matches('.formato-compacto-100, .formato-970x90, .formato-320x100');
        const fixo = document.body.classList.contains('formato-320x100');
        const media = window.matchMedia(consultaMobile);
        const atualizar = () => document.body.classList.toggle('turnos-mobile-compacto', formatoCompacto && (fixo || media.matches));
        atualizar();
        media.addEventListener('change', atualizar);
    }

    window.AvisoTurnos2026 = Object.freeze({ aplicar, turnoAtual, resultadosLiberados, observar });
})();
