const formatoIndex = document.body.dataset.widget === '300x250' ? '300x250' : 'padrao';

window.EleicoesWidget.iniciar({
    tipo: formatoIndex,
    loteDeputados: formatoIndex === '300x250' ? 6 : 20
});
