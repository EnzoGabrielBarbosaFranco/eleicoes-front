(function () {
    'use strict';

    const site = new URLSearchParams(window.location.search).get('site') || '';
    const cadastro = window.ClientesPersonalizados2026 || {};
    const cliente = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(site) && Object.hasOwn(cadastro, site)
        ? cadastro[site] : null;
    const corValida = valor => /^#[a-f0-9]{6}$/i.test(valor || '');
    const logoValida = valor => /^\/personalizados\/logos\/[a-z0-9][a-z0-9_./-]*\.(?:svg|png|webp|jpg|jpeg)$/i.test(valor || '')
        && !valor.includes('..') && !valor.includes('//');

    // Sem cliente valido, nao usar nossa marca nem consultar a API.
    if (!cliente || typeof cliente.nome !== 'string' || !cliente.nome.trim() || cliente.nome.length > 80
        || !logoValida(cliente.logo) || (cliente.icone && !logoValida(cliente.icone))
        || !['primaria', 'destaque', 'clara'].every(c => corValida(cliente.cores?.[c]))) {
        document.body.classList.add('cliente-indisponivel');
        const painel = document.querySelector('.widget-container,.widget-horizontal');
        const aviso = document.createElement('p');
        aviso.className = 'cliente-aviso';
        aviso.textContent = 'Personalização não disponível. Confira o código fornecido para este cliente.';
        if (painel) painel.replaceChildren(aviso);
        document.title = 'Personalização não disponível';
        window.EleicoesWidget = { iniciar() {} };
        return;
    }

    window.ClientePersonalizado2026 = Object.freeze({ ...cliente, site, cores: Object.freeze({ ...cliente.cores }) });
    document.body.classList.add('cliente-personalizado');
    document.body.dataset.cliente = site;
    document.title = `${cliente.nome} — Apuração 2026`;
    const icone = document.createElement('link');
    icone.rel = 'icon';
    icone.href = cliente.icone || cliente.logo;
    document.head.append(icone);

    // Logo servida no proprio Pages: sem chamadas a hospedagem do cliente.
    window.aplicarLogoCliente2026 = function (escopo = document) {
        for (const marca of escopo.querySelectorAll('.brand-mark')) {
            if (marca.classList.contains('cliente-logo')) continue;
            marca.classList.add('cliente-logo');
            marca.removeAttribute('aria-hidden');
            const imagem = document.createElement('img');
            imagem.src = cliente.logo;
            imagem.alt = cliente.nome;
            imagem.decoding = 'async';
            imagem.addEventListener('error', () => {
                const iniciais = document.createElement('span');
                iniciais.className = 'cliente-iniciais';
                iniciais.textContent = cliente.nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
                iniciais.setAttribute('aria-label', cliente.nome);
                marca.replaceChildren(iniciais);
            }, { once: true });
            marca.replaceChildren(imagem);
        }
    };
})();
