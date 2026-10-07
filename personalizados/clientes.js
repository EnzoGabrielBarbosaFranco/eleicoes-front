(function () {
    'use strict';

    // Cadastro publico: nunca incluir tokens, senhas ou dados privados aqui.
    // A chave identifica a mesma marca em todos os dez formatos.
    const clientes = {
        'idest': {
            nome: 'Idest',
            logo: '/personalizados/logos/idest.png',
            icone: '/personalizados/logos/idest.png',
            cores: { primaria: '#0F3E63', destaque: '#0B7AC4', clara: '#FFFFFF' },
            // Informar/autorizar os dominios antes de distribuir o embed.
            dominios: []
        },
        'campograndenews': {
            nome: 'Campo Grande News',
            logo: '/personalizados/logos/campograndenews.webp',
            icone: '/personalizados/logos/campograndenews.webp',
            cores: { primaria: '#68B817', destaque: '#FE8503', clara: '#FFFFFF' },
            // Informar/autorizar os dominios antes de distribuir o embed.
            dominios: []
        },
        'midiamax': {
            nome: 'Midiamax',
            logo: '/personalizados/logos/midiamax.png',
            icone: '/personalizados/logos/midiamax.png',
            cores: { primaria: '#032C45', destaque: '#032C45', clara: '#FFFFFF' },
            // Informar/autorizar os dominios antes de distribuir o embed.
            dominios: []
        },
        'diariodolitoral': {
            nome: 'Diário do Litoral',
            logo: '/personalizados/logos/diariodolitoral.webp',
            icone: '/personalizados/logos/diariodolitoral.webp',
            cores: { primaria: '#002B8E', destaque: '#0093E7', clara: '#FFFFFF' },
            // Informar/autorizar os dominios antes de distribuir o embed.
            dominios: []
        },
        'gazetasp': {
            nome: 'Gazeta SP',
            logo: '/personalizados/logos/gazetasp.webp',
            icone: '/personalizados/logos/gazetasp.webp',
            // O mesmo azul ocupa os dois papeis; identidade somente azul e branco.
            cores: { primaria: '#0093E7', destaque: '#0093E7', clara: '#FFFFFF' },
            dominios: []
        },
        'diariodoestadoms': {
            nome: 'Diário do Estado MS',
            logo: '/personalizados/logos/diariodoestadoms.png',
            icone: '/personalizados/logos/diariodoestadoms.png',
            // Azul informado como #0067B: aguardar o codigo completo.
            // Por enquanto, usar somente os dois tons confirmados.
            cores: { primaria: '#23252A', destaque: '#666666', clara: '#FFFFFF' },
            dominios: []
        },
        'jd1noticias': {
            nome: 'JD1 Notícias',
            logo: '/personalizados/logos/jd1noticias.png',
            icone: '/personalizados/logos/jd1noticias.png',
            cores: { primaria: '#102539', destaque: '#66B7FC', clara: '#FFFFFF' },
            // Informar/autorizar os dominios antes de distribuir o embed.
            dominios: []
        },
        'pixnewsms': {
            nome: 'Pix News MS',
            logo: '/personalizados/logos/pixnewsms.png',
            icone: '/personalizados/logos/pixnewsms.png',
            cores: { primaria: '#000000', destaque: '#C6FF02', clara: '#FFFFFF' },
            dominios: []
        },
        'pulsoms': {
            nome: 'Pulso MS',
            logo: '/personalizados/logos/pulsoms.png',
            icone: '/personalizados/logos/pulsoms.png',
            cores: { primaria: '#1F3761', destaque: '#84C767', clara: '#FFFFFF' },
            dominios: []
        },
        'acritica': {
            nome: 'A Crítica',
            logo: '/personalizados/logos/acritica.webp',
            icone: '/personalizados/logos/acritica.webp',
            cores: { primaria: '#004F95', destaque: '#1F7FD4', clara: '#FFFFFF' },
            // Informar/autorizar os dominios antes de distribuir o embed.
            dominios: []
        },
        'agenciacidades': {
            nome: 'Agência Cidades',
            logo: '/personalizados/logos/agenciacidades.png',
            icone: '/personalizados/logos/agenciacidades.png',
            cores: { primaria: '#000F3D', destaque: '#245CB8', clara: '#EEF2FA' },
            dominios: []
        },
        'capitaldopantanal': {
            nome: 'Capital do Pantanal',
            logo: '/personalizados/logos/capitaldopantanal.png',
            icone: '/personalizados/logos/capitaldopantanal.png',
            cores: { primaria: '#740E18', destaque: '#CB1225', clara: '#FCECEF' },
            dominios: []
        },
        'primeira-pagina': {
            nome: 'Primeira Página',
            logo: '/personalizados/logos/primeira-pagina.webp',
            icone: '/personalizados/logos/primeira-pagina.webp',
            cores: { primaria: '#9C27B0', destaque: '#FF5722', clara: '#F9EBF4' },
            // Cadastrar/autorizar o dominio antes da entrega ao portal.
            dominios: []
        },
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
