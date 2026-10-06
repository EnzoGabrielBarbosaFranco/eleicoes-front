(function () {
    'use strict';

    // Cadastro publico: nunca incluir tokens, senhas ou dados privados aqui.
    // A chave identifica a mesma marca em todos os dez formatos.
    const clientes = {
        'correio-do-estado': {
            nome: 'Correio do Estado',
            logo: '/personalizados/logos/correiodoestado.png',
            icone: '/personalizados/logos/correiodoestado.png',
            cores: { primaria: '#134282', destaque: '#246AB5', clara: '#E8F1FC' },
            // Identidade local. Cadastrar/autorizar o dominio antes da entrega.
            dominios: []
        },
        'cliente-x': {
            nome: 'Cliente Exemplo',
            logo: '/personalizados/logos/cliente-x.svg',
            icone: '/personalizados/logos/cliente-x.svg',
            cores: { primaria: '#15243B', destaque: '#D97706', clara: '#FDE8C8' },
            // Informativo. Autorizar dominios em seguranca.js e na CSP tambem.
            dominios: [],
            demonstracao: true
        }
    };

    if (typeof module === 'object' && module.exports) module.exports = clientes;
    else window.ClientesPersonalizados2026 = clientes;
})();
