'use strict';

// Funcoes reais do calendario com relogio/timers locais, sem navegador ou rede.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fonte = fs.readFileSync(path.join(__dirname, '..', 'js', 'aviso-turnos-2026.js'), 'utf8');
const virada = Date.parse('2026-10-25T00:00:00-03:00');

function ambiente(instante) {
    let agora = instante;
    let id = 0;
    const timers = new Map();
    const eventos = {};
    const documento = { hidden: false, addEventListener: (nome, fn) => { eventos[nome] = fn; } };
    const janela = {
        addEventListener: (nome, fn) => { eventos[nome] = fn; },
        setTimeout: (fn, ms) => { const chave = ++id; timers.set(chave, { fn, ms }); return chave; },
        clearTimeout: chave => timers.delete(chave)
    };
    vm.runInNewContext(fonte, {
        window: janela, document: documento,
        Date: class extends Date { static now() { return agora; } }
    });
    return { api: janela.AvisoTurnos2026, eventos, timers, documento, mudar: valor => { agora = valor; } };
}

assert.equal(virada, Date.parse('2026-10-25T03:00:00Z'));
const preparacao = Date.parse('2026-10-20T00:00:00-03:00');
for (const [instante, esperado] of [[preparacao - 1, '1'], [preparacao, '2'], [virada - 1, '2'], [virada, '2'], [virada + 86400000, '2']]) {
    assert.equal(ambiente(instante).api.turnoAtual(), esperado);
}
assert.equal(ambiente(virada - 1).api.resultadosLiberados(), false);
assert.equal(ambiente(virada).api.resultadosLiberados(), true);
const a = ambiente(virada - 1000);
const mudancas = [];
a.api.observar(turno => mudancas.push(turno));
assert.equal(a.timers.size, 1);
const timer = [...a.timers.values()][0];
assert.equal(timer.ms, 1000, 'Agendar exatamente a meia-noite, nao esperar o proximo polling');
a.mudar(virada);
timer.fn();
assert.deepEqual(mudancas, ['2']);
assert.equal(a.timers.size, 0);
a.eventos.focus();
assert.deepEqual(mudancas, ['2'], 'Nao repetir a virada ja aplicada');

const b = ambiente(virada - 86400000);
const eventosAposSuspensao = [];
b.api.observar(turno => eventosAposSuspensao.push(turno));
assert.equal([...b.timers.values()][0].ms, 60000);
b.mudar(virada + 3600000);
b.documento.hidden = true;
b.eventos.visibilitychange();
assert.deepEqual(eventosAposSuspensao, []);
b.documento.hidden = false;
b.eventos.visibilitychange();
assert.deepEqual(eventosAposSuspensao, ['2'], 'Aba suspensa deve sincronizar ao voltar');
console.log('Calendario: virada exata 25/10 00h Brasilia/03h UTC, antes/depois, timer, foco e retorno de aba suspensa: OK. Sem rede/publicacao.');
