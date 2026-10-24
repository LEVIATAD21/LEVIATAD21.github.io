/* mesa. sistema — app principal */
(function () {
  'use strict';

  const D = window.MesaData;
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastEl = document.getElementById('toast');

  let db = D.loadDB();
  let session = D.getSession();

  const state = {
    loginRole: 'client',
    cart: {},
    cartClient: null,
    cartOpen: false,
    checkoutStep: 'cart',
    lastOrder: null,
    activeCategory: 'Todos',
    inboxSelected: null,
    inboxFilterClient: 'all',
    inboxFilterStatus: 'all',
    ordersFilter: 'all',
    keepScroll: false
  };

  /* ============================ utilitários ============================ */
  function save() { D.saveDB(db); }
  function go(hash) { if (location.hash === hash) router(); else location.hash = hash; }
  function esc(v) { return D.escapeHTML(v); }
  function money(v) { return D.money(v); }
  function settings() { return db.settings; }
  function clientById(id) { return db.clients.find(c => c.id === id) || null; }
  function productById(id) { return db.products.find(p => p.id === id) || null; }
  function messageById(id) { return db.messages.find(m => m.id === id) || null; }

  function render(html) {
    const y = state.keepScroll ? window.scrollY : 0;
    app.innerHTML = html;
    state.keepScroll = false;
    window.scrollTo(0, y);
  }

  let toastTimer = null;
  function toast(msg, type) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (type === 'err' ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3800);
  }

  function openModal(html, large) {
    modalRoot.innerHTML = '<div class="modal-overlay" onclick="App.backdrop(event)"><div class="modal ' + (large ? 'modal-lg' : '') + '" onclick="event.stopPropagation()">' + html + '</div></div>';
  }
  function closeModal() { if (modalRoot) modalRoot.innerHTML = ''; }

  function ico(name, size) {
    const s = size || 16;
    const paths = {
      grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
      wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
      chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      store: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
      edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
      trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
      eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
      check: '<polyline points="20 6 9 17 4 12"/>',
      arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
      whats: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
      bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
      logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
    };
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }

  function statusBadge(status) {
    const map = {
      novo: ['Novo', 'status-novo'], preparando: ['Preparando', 'status-preparando'],
      entregue: ['Entregue', 'status-entregue'], cancelado: ['Cancelado', 'status-cancelado'],
      new: ['Nova', 'status-novo'], read: ['Lida', 'status-lida'], replied: ['Respondida', 'status-respondida']
    };
    const x = map[status] || [status, 'status-lida'];
    return '<span class="status ' + x[1] + '">' + x[0] + '</span>';
  }

  function planBadge(plan) {
    return plan === 'rent'
      ? '<span class="badge badge-lime">Aluguel</span>'
      : '<span class="badge badge-warn">Compra</span>';
  }

  function sourceBadge(source) {
    return source === 'site'
      ? '<span class="badge badge-muted">Site</span>'
      : '<span class="badge">Painel</span>';
  }

  function unreadFor(clientId) {
    return db.messages.filter(m => m.status === 'new' && (!clientId || m.clientId === clientId)).length;
  }

  /* ============================ roteador ============================ */
  function router() {
    closeModal();
    const raw = location.hash.replace(/^#/, '');
    if (!raw || raw === '/') { render(viewLanding()); return; }
    if (raw.charAt(0) !== '/') {
      if (!document.getElementById('landing-root')) render(viewLanding());
      setTimeout(function () {
        const el = document.getElementById(raw);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }
    const parts = raw.split('/').filter(Boolean);
    const route = parts[0];
    if (route === 'cardapio') { render(viewCardapio(parts[1])); return; }
    if (route === 'login') { render(viewLogin()); return; }
    if (route === 'proposta') { render(viewProposal()); return; }
    if (route === 'admin') { render(viewSuper(parts[1] || 'visao')); return; }
    if (route === 'painel') { render(viewClient(parts[1] || 'visao')); return; }
    render(viewLanding());
  }

  /* ============================ landing ============================ */
  function viewLanding() {
    const s = settings();
    const demos = db.clients.filter(c => c.status === 'active').slice(0, 3);
    const bars = [42, 58, 35, 72, 64, 88, 76].map(function (h) {
      return '<i style="height:' + h + '%"></i>';
    }).join('');

    const demoCards = demos.map(function (c) {
      const count = D.clientProducts(db, c.id).filter(p => p.active).length;
      return '<a class="demo-card" href="#/cardapio/' + esc(c.slug) + '">' +
        '<div class="demo-cover"><img src="' + esc(c.cover) + '" alt="' + esc(c.name) + '" loading="lazy"><span class="demo-logo">' + esc(c.logo) + '</span></div>' +
        '<div class="demo-body"><div class="row-between"><h3>' + esc(c.name) + '</h3>' + planBadge(c.plan) + '</div>' +
        '<p>' + esc(c.tagline) + '</p>' +
        '<div class="demo-meta"><span>' + count + ' itens no cardápio</span><span>Ver demo ' + ico('arrow', 12) + '</span></div></div></a>';
    }).join('');

    return '<div class="landing" id="landing-root">' +
      '<header class="nav"><div class="container nav-inner">' +
        '<a class="brand" href="#/"><span class="brand-mark">m<span>.</span></span><span>mesa.<small>sistema de cardápio</small></span></a>' +
        '<nav class="nav-links"><a href="#recursos">Recursos</a><a href="#demonstracao">Demonstração</a><a href="#planos">Planos</a><a href="#duvidas">Dúvidas</a><a href="#/proposta">Proposta</a></nav>' +
        '<div class="nav-actions"><a class="btn btn-ghost btn-sm mobile-keep" href="#/login">Entrar</a><a class="btn btn-primary btn-sm" href="#/cardapio/pizzaria-do-ze">Ver demo ' + ico('arrow', 13) + '</a><button class="nav-burger" type="button" aria-label="Abrir menu" onclick="App.openNav()">☰</button></div>' +
      '</div></header>' +
      '<main>' +
        '<section class="hero"><div class="container hero-grid">' +
          '<div><p class="eyebrow">CARDÁPIO DIGITAL + GESTÃO</p>' +
          '<h1>Seu cardápio digital.<br>Seu negócio <em>sob controle.</em></h1>' +
          '<p class="lead">Cardápio online, painel para trocar preços e fotos, dashboard de lucro e um canal direto de suporte. Feito para restaurantes, pizzarias, botecos e docerias da Baixada.</p>' +
          '<div class="hero-actions"><a class="btn btn-primary" href="#/cardapio/pizzaria-do-ze">Ver demonstração ' + ico('arrow', 14) + '</a><a class="btn btn-light" href="#planos">Conhecer os planos</a></div>' +
          '<div class="hero-proof"><span><b>Painel admin</b> incluso</span><span><b>Dashboard</b> de lucro e perda</span><span><b>Suporte</b> via WhatsApp</span></div></div>' +
          '<div class="mockup" aria-hidden="true"><div class="mockup-top"><i></i><i></i><i></i><span>PAINEL DO CLIENTE</span></div>' +
            '<div class="mockup-body"><div class="mock-kpis"><div class="mock-kpi"><small>Hoje</small><b>R$ 486</b></div><div class="mock-kpi"><small>Lucro 7d</small><b>R$ 1.240</b></div><div class="mock-kpi"><small>Pedidos</small><b>32</b></div></div>' +
            '<div class="mock-chart">' + bars + '</div>' +
            '<div class="mock-list"><div class="mock-line"><span class="mock-avatar">🍕</span><span><b>Pizza Margherita</b> · 2x</span><span>R$ 99,80</span></div><div class="mock-line"><span class="mock-avatar">🥤</span><span><b>Limonada</b> · 1x</span><span>R$ 14,90</span></div><div class="mock-line"><span class="mock-avatar">✉</span><span><b>Nova mensagem</b> · Pizzaria do Zé</span><span>agora</span></div></div>' +
            '</div></div>' +
        '</div></section>' +
        '<section class="section" id="recursos"><div class="container"><div class="section-head"><div><p class="eyebrow">O QUE VEM JUNTO</p><h2>Tudo que o restaurante precisa,<br>em um só lugar.</h2></div><p>O cliente vê o cardápio. Você vê os números. E o dono do restaurante consegue atualizar tudo sozinho, sem depender de programador.</p></div>' +
          '<div class="feature-grid">' +
            '<div class="feature"><div class="feature-icon">🍽</div><h3>Cardápio digital</h3><p>Categorias, busca, sacola e checkout via WhatsApp. Leve, rápido e bonito no celular.</p></div>' +
            '<div class="feature"><div class="feature-icon">⚙️</div><h3>Painel admin</h3><p>Troque preço, foto, descrição e disponibilidade dos itens em poucos cliques.</p></div>' +
            '<div class="feature"><div class="feature-icon">📊</div><h3>Dashboard completo</h3><p>Pedidos, faturamento, custos, ticket médio e lucro/prejuízo dos últimos 7 dias.</p></div>' +
            '<div class="feature"><div class="feature-icon">🔔</div><h3>Notificações com origem</h3><p>Cada mensagem chega com o nome do cliente e o canal: site, painel ou WhatsApp.</p></div>' +
            '<div class="feature"><div class="feature-icon">🏪</div><h3>Multi-clientes</h3><p>Cada restaurante com seu painel isolado. Você com a visão geral de todos.</p></div>' +
            '<div class="feature"><div class="feature-icon">📈</div><h3>Relatórios simples</h3><p>Produtos mais vendidos, evolução diária e resumo financeiro sem planilha.</p></div>' +
          '</div></div></section>' +
        '<section class="section" id="demonstracao"><div class="container"><div class="section-head"><div><p class="eyebrow">VEJA FUNCIONANDO</p><h2>Três operações de exemplo.</h2></div><p>Clique em uma casa para abrir o cardápio. Depois entre no painel e veja o dashboard, os pedidos e a caixa de mensagens.</p></div>' +
          '<div class="demo-grid">' + demoCards + '</div>' +
          '<div class="row mt-3" style="justify-content:center"><a class="btn btn-primary" href="#/login">Entrar no painel de demonstração ' + ico('arrow', 14) + '</a></div>' +
        '</div></section>' +
        '<section class="section" id="planos"><div class="container"><div class="section-head"><div><p class="eyebrow">DOIS JEITOS DE TER</p><h2>Alugue ou compre.<br>O painel é seu nos dois.</h2></div><p>Sem taxa escondida. No aluguel, você paga só a mensalidade e o domínio. Na compra, o sistema fica seu.</p></div>' +
          '<div class="pricing-grid">' +
            '<div class="plan featured"><span class="plan-tag">MAIS ESCOLHIDO</span><h3>Aluguel</h3><p class="plan-sub">Para quem quer o sistema no ar sem se preocupar com manutenção.</p><div class="plan-price"><b>' + money(s.rentPrice) + '</b><span>/mês</span></div>' +
              '<ul><li>Cardápio digital completo</li><li>Painel admin para preços e fotos</li><li>Dashboard de pedidos, custos e lucro</li><li>Hospedagem inclusa</li><li>Atualizações, mudanças de design e suporte</li><li>Você paga apenas o domínio</li></ul>' +
              '<a class="btn btn-primary" href="' + D.waLink(s.supportWhatsApp, 'Olá! Quero saber mais sobre o aluguel do sistema mesa. (R$ 1.000/mês)') + '" target="_blank" rel="noopener">Quero alugar ' + ico('whats', 14) + '</a>' +
              '<div class="plan-note">Sem taxa de implantação. A mensalidade cobre o serviço e a hospedagem padrão. O domínio é registrado no seu nome.</div></div>' +
            '<div class="plan"><h3>Compra</h3><p class="plan-sub">Para quem quer o sistema como patrimônio e autonomia total.</p><div class="plan-price range"><b style="font-size:30px">' + money(s.buyMin) + ' a ' + money(s.buyMax) + '</b></div>' +
              '<ul><li>Cardápio digital completo</li><li>Painel admin para preços e fotos</li><li>Dashboard de pedidos, custos e lucro</li><li>Entrega do sistema e do código</li><li>O sistema fica seu</li><li>Você paga o domínio e a hospedagem</li></ul>' +
              '<a class="btn btn-light" href="' + D.waLink(s.supportWhatsApp, 'Olá! Quero saber mais sobre a compra do sistema mesa. (R$ 3.000 a R$ 5.000)') + '" target="_blank" rel="noopener">Quero comprar ' + ico('whats', 14) + '</a>' +
              '<div class="plan-note">Atualizações depois da entrega ficam por sua conta (outro técnico ou um novo orçamento comigo). O domínio é registrado no seu nome.</div></div>' +
          '</div>' +
          '<div class="table-wrap mt-3"><table class="compare"><thead><tr><th>O que está incluso</th><th>Aluguel</th><th>Compra</th></tr></thead><tbody>' +
            '<tr><td>Cardápio digital + sacola</td><td class="yes">Sim</td><td class="yes">Sim</td></tr>' +
            '<tr><td>Painel admin (preços e imagens)</td><td class="yes">Sim</td><td class="yes">Sim</td></tr>' +
            '<tr><td>Dashboard de lucro e perda</td><td class="yes">Sim</td><td class="yes">Sim</td></tr>' +
            '<tr><td>Hospedagem</td><td class="yes">Inclusa</td><td class="no">Por sua conta</td></tr>' +
            '<tr><td>Atualizações e mudanças de design</td><td class="yes">Inclusas</td><td class="no">Outro técnico ou avulso</td></tr>' +
            '<tr><td>Domínio</td><td class="no">Você paga</td><td class="no">Você paga</td></tr>' +
            '<tr><td>O sistema é seu</td><td class="no">Uso enquanto assinar</td><td class="yes">Sim</td></tr>' +
          '</tbody></table></div>' +
        '</div></section>' +
        '<section class="section" id="duvidas"><div class="container"><div class="section-head"><div><p class="eyebrow">PERGUNTAS FREQUENTES</p><h2>O que todo dono pergunta.</h2></div><p>Se ficar alguma dúvida, chama no WhatsApp. Respondo sem compromisso.</p></div>' +
          '<div class="faq">' +
            '<details open><summary>O domínio fica no meu nome?</summary><p>Sim. Você registra o domínio (ex.: seurestaurante.com.br) no seu CPF ou CNPJ. Eu configuro o apontamento para o sistema. O domínio é a única despesa que fica fora do meu serviço.</p></details>' +
            '<details><summary>Consigo trocar preços e fotos sozinho?</summary><p>Sim. O painel admin tem uma aba de cardápio onde você edita nome, descrição, preço, categoria, foto e disponibilidade. As mudanças aparecem no site na hora.</p></details>' +
            '<details><summary>O dashboard mostra lucro de verdade?</summary><p>Ele mostra o faturamento dos pedidos menos os custos que você lança (ingredientes, embalagens, equipe, entrega etc.). É um painel gerencial simples, não uma contabilidade fiscal.</p></details>' +
            '<details><summary>Qual a diferença entre alugar e comprar?</summary><p>No aluguel, eu cuido da hospedagem, das atualizações e do suporte, e você paga R$ 1.000/mês + domínio. Na compra, você paga de R$ 3.000 a R$ 5.000, o sistema fica seu e a manutenção futura é sua (ou contratada à parte).</p></details>' +
            '<details><summary>Tem fidelidade?</summary><p>O aluguel é mensal. A proposta comercial sugere aviso prévio de 30 dias para cancelar, para dar tempo de exportar seus dados e desligar o sistema com tranquilidade.</p></details>' +
            '<details><summary>Quanto tempo leva para ficar pronto?</summary><p>Para o pacote padrão, a estimativa é de 7 a 10 dias úteis depois da aprovação do layout e do envio dos dados (cardápio, fotos, contatos).</p></details>' +
            '<details><summary>Você atende fora da Baixada?</summary><p>Sim. O atendimento é remoto, por WhatsApp e chamada de vídeo. A entrega e o suporte não dependem de estar presencialmente no restaurante.</p></details>' +
          '</div></div></section>' +
        '<section class="section"><div class="container"><div class="cta-band"><div><h2>Quer ver o seu cardápio no ar?</h2><p>Me chama no WhatsApp. Eu mostro o demo, entendo o seu cardápio e te passo um orçamento sem compromisso.</p></div><a class="btn btn-lime" href="' + D.waLink(s.supportWhatsApp, 'Olá! Quero colocar o cardápio digital do meu restaurante no ar.') + '" target="_blank" rel="noopener">Falar no WhatsApp ' + ico('whats', 15) + '</a></div></div></section>' +
      '</main>' +
      '<footer class="footer"><div class="container footer-inner"><div><strong style="color:var(--forest)">mesa.</strong> — cardápio digital + gestão. Feito por Kawã Developer.</div><div class="footer-links"><a href="#/proposta">Proposta</a><a href="#/login">Entrar</a><a href="#/cardapio/pizzaria-do-ze">Demo</a><a href="#recursos">Recursos</a></div></div></footer>' +
    '</div>';
  }

  /* ============================ proposta ============================ */
  function viewProposal() {
    const s = settings();
    return '<div class="landing" id="landing-root">' +
      '<header class="nav"><div class="container nav-inner"><a class="brand" href="#/"><span class="brand-mark">m<span>.</span></span><span>mesa.<small>proposta comercial</small></span></a><div class="nav-actions"><a class="btn btn-ghost btn-sm" href="#/">Voltar ao site</a><button class="btn btn-light btn-sm" type="button" onclick="window.print()">Imprimir / PDF</button><a class="btn btn-primary btn-sm" href="' + D.waLink(s.supportWhatsApp, 'Olá! Recebi a proposta do mesa. e quero conversar.') + '" target="_blank" rel="noopener">Falar no WhatsApp</a></div></div></header>' +
      '<main class="section"><div class="container" style="max-width:900px">' +
        '<p class="eyebrow">PROPOSTA COMERCIAL</p><h1 style="margin:0;color:var(--forest);font-size:clamp(32px,4vw,48px);letter-spacing:-2.4px;line-height:1.06">Cardápio digital + gestão<br>para o seu restaurante.</h1>' +
        '<p class="lead" style="max-width:680px;color:var(--muted);font-size:14px;line-height:1.8">Uma solução completa: cardápio online, painel para o dono atualizar preços e fotos, dashboard de pedidos, custos e lucro, e um canal direto de suporte. Escolha entre alugar ou comprar.</p>' +
        '<div class="pricing-grid mt-3">' +
          '<div class="plan featured"><span class="plan-tag">RECOMENDADO</span><h3>Aluguel mensal</h3><p class="plan-sub">O sistema no ar, com manutenção e suporte inclusos.</p><div class="plan-price"><b>' + money(s.rentPrice) + '</b><span>/mês</span></div>' +
            '<ul><li>Cardápio digital completo + sacola</li><li>Painel admin de produtos, preços e imagens</li><li>Dashboard de pedidos, faturamento, custos e lucro</li><li>Hospedagem padrão inclusa</li><li>Atualizações, ajustes de design e suporte</li><li>Você paga apenas o domínio</li></ul>' +
            '<div class="plan-note">Mensalidade sem taxa de implantação. Inclui ajustes contínuos dentro do escopo do cardápio e do painel. Novas integrações complexas são orçadas à parte.</div></div>' +
          '<div class="plan"><h3>Compra do sistema</h3><p class="plan-sub">Para quem quer o sistema como patrimônio.</p><div class="plan-price range"><b style="font-size:30px">' + money(s.buyMin) + ' a ' + money(s.buyMax) + '</b></div>' +
            '<ul><li>Cardápio digital completo + sacola</li><li>Painel admin de produtos, preços e imagens</li><li>Dashboard de pedidos, faturamento, custos e lucro</li><li>Entrega do sistema e do código</li><li>O sistema fica seu</li><li>Domínio e hospedagem por sua conta</li></ul>' +
            '<div class="plan-note">O valor dentro da faixa depende do escopo: número de itens, identidade visual, integrações e prazo. Atualizações depois da entrega ficam por sua conta (outro técnico ou novo orçamento).</div></div>' +
        '</div>' +
        '<h2 style="color:var(--forest);font-size:22px;letter-spacing:-1px;margin:34px 0 12px">O que está incluso nos dois modelos</h2>' +
        '<div class="table-wrap"><table class="compare"><thead><tr><th>Item</th><th>Detalhe</th></tr></thead><tbody>' +
          '<tr><td>Cardápio digital</td><td>Página responsiva com categorias, busca, sacola e checkout via WhatsApp.</td></tr>' +
          '<tr><td>Painel admin</td><td>O dono edita nome, descrição, preço, categoria, foto e disponibilidade.</td></tr>' +
          '<tr><td>Dashboard</td><td>Pedidos, faturamento, custos lançados, lucro/prejuízo, ticket médio e produtos mais vendidos.</td></tr>' +
          '<tr><td>Notificações</td><td>Mensagens com identificação do cliente e do canal de origem (site ou painel).</td></tr>' +
          '<tr><td>Suporte</td><td>WhatsApp em horário comercial, com resposta em até 24h úteis. Urgências combinadas caso a caso.</td></tr>' +
        '</tbody></table></div>' +
        '<h2 style="color:var(--forest);font-size:22px;letter-spacing:-1px;margin:34px 0 12px">O que fica por fora</h2>' +
        '<ul style="color:var(--muted);font-size:13px;line-height:1.9;padding-left:18px"><li><b>Domínio:</b> registro e renovação no nome do cliente (aprox. R$ 40 a R$ 60/ano).</li><li><b>Hospedagem na compra:</b> o cliente contrata e paga o plano de hospedagem que preferir.</li><li><b>Integrações pagas:</b> gateways de pagamento, SMS, e-mail transacional ou APIs de terceiros cobradas por uso.</li><li><b>Manutenção na compra:</b> atualizações e mudanças depois da entrega não estão inclusas.</li><li><b>Conteúdo:</b> fotos, textos e identidade visual fornecidos pelo cliente.</li></ul>' +
        '<h2 style="color:var(--forest);font-size:22px;letter-spacing:-1px;margin:34px 0 12px">Pagamento e prazo</h2>' +
        '<div class="grid-2-even"><div class="card card-pad"><h3 style="margin:0 0 6px;color:var(--forest);font-size:14px">Aluguel</h3><p style="margin:0;color:var(--muted);font-size:12px;line-height:1.8">Mensalidade de ' + money(s.rentPrice) + ', cobrada no início de cada mês. Implantação inclusa. A proposta sugere aviso prévio de 30 dias para cancelamento.</p></div><div class="card card-pad"><h3 style="margin:0 0 6px;color:var(--forest);font-size:14px">Compra</h3><p style="margin:0;color:var(--muted);font-size:12px;line-height:1.8">50% na aprovação e 50% na entrega. Prazo estimado de 7 a 10 dias úteis após o envio dos dados e a aprovação do layout.</p></div></div>' +
        '<div class="card card-pad mt-3" style="background:var(--forest);color:#fff;border:0"><div class="row-between"><div><h3 style="margin:0;color:#fff;font-size:18px">Próximo passo</h3><p style="margin:5px 0 0;color:#b9cbc3;font-size:12px">Me chama no WhatsApp para eu entender o seu cardápio e ajustar a proposta.</p></div><a class="btn btn-lime" href="' + D.waLink(s.supportWhatsApp, 'Olá! Quero fechar a proposta do sistema mesa. para o meu restaurante.') + '" target="_blank" rel="noopener">Chamar no WhatsApp ' + ico('whats', 15) + '</a></div></div>' +
        '<p class="small muted mt-2">Proposta válida por 7 dias. Valores e prazos podem ser ajustados conforme o escopo. Este documento é uma referência comercial e não substitui um contrato.</p>' +
      '</div></main></div>';
  }

  /* ============================ login ============================ */
  function viewLogin() {
    const s = settings();
    const isClient = state.loginRole === 'client';
    const options = db.clients.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
    }).join('');
    return '<div class="login-wrap"><div class="login-card">' +
      '<a class="brand" href="#/"><span class="brand-mark">m<span>.</span></span><span>mesa.<small>painel</small></span></a>' +
      '<h1>Acessar o painel</h1><p>Demonstração com dados fictícios. Escolha o tipo de acesso.</p>' +
      '<div class="role-tabs"><button class="role-tab ' + (isClient ? 'active' : '') + '" type="button" onclick="App.setLoginRole(\'client\')">Dono do restaurante</button><button class="role-tab ' + (!isClient ? 'active' : '') + '" type="button" onclick="App.setLoginRole(\'super\')">Administrador</button></div>' +
      '<form onsubmit="App.doLogin(event)">' +
        (isClient ? '<div class="field mb-2"><label for="loginClient">Restaurante</label><select id="loginClient" name="clientId">' + options + '</select></div>' : '') +
        '<div class="field mb-2"><label for="loginPin">PIN de acesso</label><input id="loginPin" name="pin" type="password" inputmode="numeric" placeholder="Digite o PIN" autocomplete="off" required></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Entrar ' + ico('arrow', 14) + '</button>' +
      '</form>' +
      '<div class="demo-hint"><b>Demo:</b> ' + (isClient ? 'PIN do cliente = <b>' + esc(s.clientPin) + '</b>' : 'PIN do administrador = <b>' + esc(s.superPin) + '</b>') + '. Os dados ficam no seu navegador.</div>' +
      '<a class="login-back" href="#/">← Voltar ao site</a>' +
    '</div></div>';
  }

  /* ============================ cardápio do cliente ============================ */
  function viewCardapio(slug) {
    const client = D.getClient(db, slug);
    if (!client) {
      return '<div class="landing" id="landing-root"><div class="container" style="padding:80px 0;text-align:center"><h1 style="color:var(--forest);letter-spacing:-2px">Restaurante não encontrado</h1><p class="muted">Este link pode estar desatualizado.</p><a class="btn btn-primary" href="#/">Voltar ao site</a></div></div>';
    }
    if (state.cartClient !== client.id) { state.cart = {}; state.activeCategory = 'Todos'; state.cartClient = client.id; }
    const products = D.clientProducts(db, client.id).filter(p => p.active);
    const categories = ['Todos'].concat(Array.from(new Set(products.map(p => p.category))));
    const filtered = state.activeCategory === 'Todos' ? products : products.filter(p => p.category === state.activeCategory);
    const cartCount = Object.values(state.cart).reduce((s, q) => s + q, 0);

    const header = '<header class="shop-header"><div class="container shop-header-inner">' +
      '<a class="shop-brand" href="#/"><span class="shop-logo">' + esc(client.logo) + '</span><span><strong>' + esc(client.name) + '</strong><small>Cardápio digital</small></span></a>' +
      '<div class="row" style="gap:8px;margin-left:auto">' +
        '<button class="btn btn-light btn-sm" type="button" onclick="App.openSupport(\'site\', \'' + esc(client.id) + '\')">Suporte ' + ico('chat', 13) + '</button>' +
        '<a class="btn btn-light btn-sm" href="' + D.waLink(client.whatsapp, 'Olá! Quero fazer um pedido.') + '" target="_blank" rel="noopener">WhatsApp ' + ico('whats', 13) + '</a>' +
        '<button class="cart-fab" type="button" style="position:static;box-shadow:none" onclick="App.openCart()">Sacola <b>' + cartCount + '</b></button>' +
      '</div></div></header>';

    const hero = '<section class="shop-hero"><img src="' + esc(client.cover) + '" alt="' + esc(client.name) + '" fetchpriority="high"><div class="container shop-hero-content">' +
      '<span class="badge">' + (client.status === 'active' ? 'Aberto agora' : 'Cardápio de demonstração') + '</span>' +
      '<h1>' + esc(client.name) + '</h1>' +
      '<p>' + esc(client.description) + '</p>' +
      '<div class="shop-hero-meta"><span>🕐 ' + esc(client.hours) + '</span><span>📍 ' + esc(client.address) + '</span><span>📞 ' + esc(client.phone) + '</span></div>' +
      '</div></section>';

    const chips = categories.map(function (c) {
      return '<button class="chip ' + (state.activeCategory === c ? 'active' : '') + '" type="button" onclick="App.setCategory(\'' + esc(c) + '\')">' + esc(c) + '</button>';
    }).join('');

    const grid = filtered.length ? filtered.map(function (p) {
      return '<article class="shop-card"><div class="shop-card-img"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
        '<div class="shop-card-body"><span class="shop-card-cat">' + esc(p.category) + '</span><h3>' + esc(p.name) + '</h3><p>' + esc(p.description) + '</p>' +
        '<div class="shop-card-bottom"><span class="shop-price">' + money(p.price) + '</span><button class="shop-add" type="button" aria-label="Adicionar ' + esc(p.name) + '" onclick="App.addToCart(\'' + p.id + '\')">+</button></div></div></article>';
    }).join('') : '<div class="shop-empty">Nenhum item nesta categoria.</div>';

    const body = '<main><section class="shop-menu"><div class="container"><div class="shop-menu-head"><h2>Cardápio</h2><p class="muted small">Toque no + para montar sua sacola. O pedido é confirmado via WhatsApp.</p></div>' +
      '<div class="chips" style="margin-bottom:16px">' + chips + '</div>' +
      '<div class="shop-grid">' + grid + '</div></div></section>' +
      '<footer class="shop-footer"><div class="container"><div class="row-between"><span>Cardápio digital por <strong style="color:var(--forest)">mesa.</strong> — ' + esc(client.name) + '</span><a class="btn btn-light btn-sm" href="#/">Conheça o sistema</a></div></div></footer></main>';

    const cartDrawer = state.cartOpen ? renderCartDrawer(client) : '';
    const support = state.supportOpen ? '' : '';

    return '<div class="shop">' + header + hero + body +
      (state.cartOpen ? '<div class="drawer-overlay" onclick="App.closeCart()"></div>' + cartDrawer : '') +
      '</div>';
  }

  function cartItems(client) {
    const items = [];
    Object.keys(state.cart).forEach(function (id) {
      const p = productById(id);
      if (p && p.clientId === client.id) items.push({ product: p, qty: state.cart[id] });
    });
    return items;
  }

  function cartTotals(client) {
    const items = cartItems(client);
    const subtotal = items.reduce(function (s, i) { return s + i.product.price * i.qty; }, 0);
    const delivery = state.checkoutStep === 'checkout' ? (document.getElementById('serviceMethod') && document.getElementById('serviceMethod').value === 'entrega' ? 5.00 : 0) : 0;
    return { items, subtotal, delivery, total: subtotal + delivery };
  }

  function renderCartDrawer(client) {
    const { items, subtotal, delivery, total } = cartTotals(client);
    let content = '';
    if (state.checkoutStep === 'success' && state.lastOrder) {
      const o = state.lastOrder;
      content = '<div class="success-box"><div class="success-icon">✓</div><h2>Pedido simulado</h2><p>Seu pedido <b>' + esc(o.id) + '</b> foi registrado na demonstração. Nada foi cobrado e nada foi enviado.</p><p class="muted small">Total ilustrativo: ' + money(o.total) + '</p><button class="btn btn-primary btn-block" type="button" onclick="App.sendOrderWhats()">Enviar no WhatsApp ' + ico('whats', 14) + '</button><button class="btn btn-light btn-block mt-1" type="button" onclick="App.closeCart()">Fechar</button></div>';
    } else if (state.checkoutStep === 'checkout') {
      content = '<div class="checkout"><h2>Revisão da sacola</h2><p class="muted small">Confira os dados antes de finalizar a simulação.</p>' +
        '<div class="field"><label for="coName">Seu nome</label><input id="coName" type="text" required placeholder="Como te chamam"></div>' +
        '<div class="field"><label for="coPhone">WhatsApp</label><input id="coPhone" type="tel" required placeholder="(21) 99999-9999"></div>' +
        '<div class="field"><label for="serviceMethod">Recebimento</label><select id="serviceMethod" onchange="App.recalcCheckout()"><option value="retirada">Retirada no local</option><option value="entrega">Entrega (+ R$ 5,00)</option></select></div>' +
        '<div class="field" id="addressField"><label for="coAddr">Endereço (se entrega)</label><input id="coAddr" type="text" placeholder="Rua, número, bairro"></div>' +
        '<div class="field"><label for="coPay">Pagamento</label><select id="coPay"><option>Pix</option><option>Cartão</option><option>Dinheiro</option></select></div>' +
        '<div class="field"><label for="coNotes">Observações</label><textarea id="coNotes" placeholder="Sem cebola, troco para R$ 50..."></textarea></div>' +
        '<div class="cart-line total"><span>Total ilustrativo</span><span id="coTotal">' + money(total) + '</span></div>' +
        '<div class="form-actions"><button class="btn btn-light" type="button" onclick="App.backToCart()">Voltar</button><button class="btn btn-primary" type="button" onclick="App.confirmOrder(\'' + esc(client.id) + '\')">Confirmar simulação ' + ico('arrow', 13) + '</button></div>' +
        '<p class="tiny muted" style="text-align:center;margin-top:6px">Simulação: nenhum pedido real é enviado.</p></div>';
    } else {
      if (!items.length) {
        content = '<div class="cart-empty">Sua sacola está vazia.<br>Adicione itens do cardápio.</div>';
      } else {
        content = '<div class="cart-items">' + items.map(function (i) {
          return '<div class="cart-item"><img src="' + esc(i.product.image) + '" alt="' + esc(i.product.name) + '"><div class="cart-item-info"><strong>' + esc(i.product.name) + '</strong><small>' + money(i.product.price) + ' un.</small></div><div class="qty"><button type="button" onclick="App.changeQty(\'' + i.product.id + '\',-1)">−</button><b>' + i.qty + '</b><button type="button" onclick="App.changeQty(\'' + i.product.id + '\',1)">+</button></div></div>';
        }).join('') + '</div>' +
        '<div class="cart-foot"><div class="cart-line"><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
        '<div class="cart-line total"><span>Total</span><span>' + money(subtotal) + '</span></div>' +
        '<button class="btn btn-primary btn-block mt-2" type="button" onclick="App.goCheckout()">Revisar pedido ' + ico('arrow', 13) + '</button></div>';
      }
    }
    return '<aside class="cart-drawer" role="dialog" aria-modal="true"><div class="cart-head"><div><p class="eyebrow" style="margin:0">SUA SELEÇÃO</p><h2>Sacola</h2></div><button class="icon-btn" type="button" aria-label="Fechar sacola" onclick="App.closeCart()">×</button></div>' + content + '</aside>';
  }

  function recalcCheckout() {
    const sel = document.getElementById('serviceMethod');
    const totalEl = document.getElementById('coTotal');
    if (!sel || !totalEl) return;
    const client = D.getClient(db, state.cartClient);
    const { subtotal } = cartTotals(client);
    const delivery = sel.value === 'entrega' ? 5.00 : 0;
    totalEl.textContent = money(subtotal + delivery);
  }

  function setCategory(cat) {
    state.activeCategory = cat;
    state.keepScroll = true;
    router();
  }

  function addToCart(id) {
    state.cart[id] = (state.cart[id] || 0) + 1;
    state.cartOpen = true;
    state.checkoutStep = 'cart';
    state.keepScroll = true;
    router();
    toast('Adicionado à sacola');
  }

  function changeQty(id, delta) {
    state.cart[id] = (state.cart[id] || 0) + delta;
    if (state.cart[id] <= 0) delete state.cart[id];
    state.keepScroll = true;
    router();
  }

  function openCart() {
    state.cartOpen = true;
    state.checkoutStep = 'cart';
    state.keepScroll = true;
    router();
  }

  function closeCart() {
    state.cartOpen = false;
    state.checkoutStep = 'cart';
    state.lastOrder = null;
    state.keepScroll = true;
    router();
  }

  function goCheckout() {
    state.checkoutStep = 'checkout';
    state.keepScroll = true;
    router();
  }

  function backToCart() {
    state.checkoutStep = 'cart';
    state.keepScroll = true;
    router();
  }

  function confirmOrder(clientId) {
    const client = D.getClient(db, clientId);
    const name = (document.getElementById('coName') || {}).value || '';
    const phone = (document.getElementById('coPhone') || {}).value || '';
    const method = (document.getElementById('serviceMethod') || {}).value || 'retirada';
    const payment = (document.getElementById('coPay') || {}).value || 'Pix';
    const addr = (document.getElementById('coAddr') || {}).value || '';
    const notes = (document.getElementById('coNotes') || {}).value || '';
    if (!name.trim() || !phone.trim()) { toast('Preencha nome e WhatsApp.', 'err'); return; }
    if (method === 'entrega' && !addr.trim()) { toast('Informe o endereço de entrega.', 'err'); return; }
    const items = cartItems(client);
    if (!items.length) { toast('Sua sacola está vazia.', 'err'); return; }
    const subtotal = items.reduce(function (s, i) { return s + i.product.price * i.qty; }, 0);
    const delivery = method === 'entrega' ? 5.00 : 0;
    const total = +(subtotal + delivery).toFixed(2);
    const order = {
      id: 'ped_' + Date.now().toString(36).slice(-6).toUpperCase(),
      clientId: client.id,
      items: items.map(function (i) { return { productId: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty }; }),
      total: total,
      cost: +(subtotal * 0.38).toFixed(2),
      status: 'novo',
      customerName: name.trim(),
      customerPhone: phone.trim(),
      method: method,
      payment: payment,
      address: addr.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };
    db.orders.unshift(order);
    save();
    state.lastOrder = order;
    state.cart = {};
    state.checkoutStep = 'success';
    state.keepScroll = true;
    router();
    toast('Pedido registrado na demonstração');
  }

  function sendOrderWhats() {
    const o = state.lastOrder;
    if (!o) return;
    const client = D.getClient(db, o.clientId);
    const lines = o.items.map(function (i) { return i.qty + 'x ' + i.name + ' — ' + money(i.price * i.qty); }).join('\n');
    const text = '*Pedido ' + o.id + ' — ' + client.name + '*\n\n' + lines +
      '\n\nSubtotal: ' + money(o.total - (o.method === 'entrega' ? 5 : 0)) +
      '\nEntrega: ' + (o.method === 'entrega' ? money(5) : 'retirada') +
      '\n*Total: ' + money(o.total) + '*' +
      '\n\nNome: ' + o.customerName +
      '\nWhatsApp: ' + o.customerPhone +
      (o.address ? '\nEndereço: ' + o.address : '') +
      '\nPagamento: ' + o.payment +
      (o.notes ? '\nObs.: ' + o.notes : '');
    window.open(D.waLink(client.whatsapp, text), '_blank', 'noopener');
  }

  function openSupport(source, clientId) {
    const client = clientId ? D.getClient(db, clientId) : null;
    const cid = client ? client.id : (session && session.clientId ? session.clientId : null);
    const c = cid ? D.getClient(db, cid) : null;
    const title = source === 'admin' ? 'Falar com o suporte' : 'Falar com o suporte';
    const nameVal = source === 'admin' && c ? esc(c.name) : '';
    const phoneVal = source === 'admin' && c ? esc(c.whatsapp) : '';
    openModal(
      '<div class="modal-head"><h2>' + title + '</h2><button class="icon-btn" type="button" onclick="App.closeModal()">×</button></div>' +
      '<div class="modal-body"><p class="muted small" style="margin:0 0 12px">Sua mensagem será registrada no painel e enviada no WhatsApp do suporte.</p>' +
      '<form onsubmit="App.submitSupport(event, \'' + esc(cid || '') + '\', \'' + esc(source || 'site') + '\')">' +
        '<div class="form-grid">' +
          '<div class="field"><label for="spName">Seu nome</label><input id="spName" name="name" type="text" required value="' + nameVal + '" placeholder="Como te chamam"></div>' +
          '<div class="field"><label for="spPhone">WhatsApp</label><input id="spPhone" name="phone" type="tel" required value="' + phoneVal + '" placeholder="(21) 99999-9999"></div>' +
          '<div class="field span-2"><label for="spSubject">Assunto</label><input id="spSubject" name="subject" type="text" required placeholder="Ex.: trocar preço, foto da capa, dúvida"></div>' +
          '<div class="field span-2"><label for="spText">Mensagem</label><textarea id="spText" name="text" required placeholder="Descreva o que você precisa..."></textarea></div>' +
        '</div>' +
        '<div class="form-actions"><button class="btn btn-light" type="button" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" type="submit">Enviar e abrir WhatsApp ' + ico('whats', 13) + '</button></div>' +
      '</form></div>'
    );
  }

  function submitSupport(e, clientId, source) {
    e.preventDefault();
    const name = (document.getElementById('spName') || {}).value || '';
    const phone = (document.getElementById('spPhone') || {}).value || '';
    const subject = (document.getElementById('spSubject') || {}).value || '';
    const text = (document.getElementById('spText') || {}).value || '';
    if (!name.trim() || !phone.trim() || !subject.trim() || !text.trim()) { toast('Preencha todos os campos.', 'err'); return; }
    const client = clientId ? D.getClient(db, clientId) : (session && session.clientId ? D.getClient(db, session.clientId) : null);
    const cid = client ? client.id : (clientId || '');
    const msg = {
      id: 'msg_' + Date.now().toString(36).slice(-6),
      clientId: cid,
      source: source || 'site',
      name: name.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      text: text.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
      replies: []
    };
    db.messages.unshift(msg);
    save();
    const tag = client ? client.name : (cid || 'Sistema');
    const waText = '[' + tag + '] ' + (source === 'site' ? 'Visitante' : 'Painel') + '\n' +
      'De: ' + name.trim() + ' (' + phone.trim() + ')\n' +
      'Assunto: ' + subject.trim() + '\n' +
      text.trim();
    window.open(D.waLink(settings().supportWhatsApp, waText), '_blank', 'noopener');
    closeModal();
    toast('Mensagem registrada. Verifique o WhatsApp.');
    if (location.hash.indexOf('#/admin') === 0 || location.hash.indexOf('#/painel') === 0) router();
  }

  function backdrop(e) {
    if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) closeModal();
  }

  /* ============================ dashboard shell ============================ */
  function dashShell(role, tab, title, subtitle, content) {
    const isSuper = role === 'super';
    const client = isSuper ? (state.adminClientId ? clientById(state.adminClientId) : null) : clientById(session.clientId);
    const nav = isSuper
      ? [
          ['visao', 'Visão geral', ico('grid')],
          ['clientes', 'Clientes', ico('users')],
          ['inbox', 'Inbox', ico('inbox'), unreadFor()],
          ['financeiro', 'Financeiro', ico('wallet')],
          ['config', 'Configurações', ico('settings')]
        ]
      : [
          ['visao', 'Visão geral', ico('grid')],
          ['cardapio', 'Cardápio', ico('book')],
          ['pedidos', 'Pedidos', ico('receipt')],
          ['financeiro', 'Financeiro', ico('wallet')],
          ['mensagens', 'Mensagens', ico('chat'), unreadFor(client ? client.id : null)],
          ['config', 'Configurações', ico('settings')]
        ];
    const navHtml = nav.map(function (item) {
      const active = item[0] === tab ? 'active' : '';
      const count = item[3] ? '<span class="count">' + item[3] + '</span>' : '';
      const href = (isSuper ? '#/admin/' : '#/painel/') + item[0];
      return '<a class="side-link ' + active + '" href="' + href + '">' + item[2] + '<span>' + item[1] + '</span>' + count + '</a>';
    }).join('');

    const brandName = isSuper ? 'mesa. admin' : (client ? client.name : 'mesa.');
    const brandSub = isSuper ? 'painel do sistema' : 'painel do cliente';
    const brandMark = isSuper ? 'm' : (client ? esc(client.logo) : 'm');

    const clientInfo = isSuper ? '' :
      '<div class="side-client"><small>Plano</small><strong>' + planBadge(client ? client.plan : '') + ' ' + (client && client.plan === 'rent' ? money(client.monthly) + '/mês' : (client ? money(client.salePrice) : '')) + '</strong></div>';

    const userAvatar = isSuper ? 'A' : (client ? (client.name || 'C').charAt(0) : 'C');
    const userName = isSuper ? 'Administrador' : (client ? client.name : 'Cliente');

    const previewBanner = (!isSuper && session && session.backToSuper)
      ? '<div class="row-between" style="padding:10px 16px;margin:0 0 14px;background:var(--lime-soft);border:1px solid #d7e8b0;border-radius:12px"><span class="small strong" style="color:#45621c">Você está vendo o painel de ' + esc(client ? client.name : '') + ' como admin.</span><button class="btn btn-sm btn-lime" type="button" onclick="App.backToSuper()">Voltar ao admin</button></div>'
      : '';

    const topActions = isSuper
      ? '<button class="btn btn-light btn-sm" type="button" onclick="App.openModal(App.clientModalHtml(null), true)">Novo cliente</button>'
      : '<a class="btn btn-light btn-sm" href="#/cardapio/' + esc(client ? client.slug : '') + '" target="_blank" rel="noopener">Ver cardápio ' + ico('external', 13) + '</a><button class="btn btn-primary btn-sm" type="button" onclick="App.openSupport(\'admin\')">Suporte ' + ico('chat', 13) + '</button>';

    return '<div class="dash">' +
      '<aside class="sidebar" id="sidebar"><div class="side-brand"><span class="brand-mark">' + brandMark + '<span>.</span></span><div><strong>' + esc(brandName) + '</strong><small>' + brandSub + '</small></div></div>' +
        clientInfo +
        '<nav class="side-nav">' + navHtml + '</nav>' +
        '<div class="side-foot"><div class="side-user"><span class="avatar">' + esc(userAvatar) + '</span><div><strong>' + esc(userName) + '</strong><small>' + (isSuper ? 'super admin' : 'dono') + '</small></div></div>' +
        '<button class="side-logout" type="button" onclick="App.logout()">' + ico('logout', 14) + ' Sair</button></div></aside>' +
      '<div class="main"><header class="topbar"><button class="mobile-side-toggle" type="button" onclick="App.toggleSidebar()" aria-label="Menu">☰</button><div><h1>' + esc(title) + '</h1><p class="crumb">' + esc(subtitle || '') + '</p></div><div class="topbar-actions">' + topActions + '</div></header>' +
        '<main class="content">' + previewBanner + content + '</main></div></div>';
  }

  function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.toggle('open');
  }

  /* ============================ views super ============================ */
  function viewSuper(tab) {
    if (!session || session.role !== 'super') { go('#/login'); return ''; }
    state.adminClientId = null;
    const titles = {
      visao: ['Visão geral', 'Todos os clientes e o movimento do sistema'],
      clientes: ['Clientes', 'Cadastros, planos e acesso aos painéis'],
      inbox: ['Inbox', 'Mensagens de todos os clientes'],
      financeiro: ['Financeiro', 'Receita do sistema e resultado dos clientes'],
      config: ['Configurações', 'Ajustes gerais e dados de demonstração']
    };
    const t = titles[tab] || titles.visao;
    let content = '';
    if (tab === 'clientes') content = superClientes();
    else if (tab === 'inbox') content = superInbox();
    else if (tab === 'financeiro') content = superFinanceiro();
    else if (tab === 'config') content = superConfig();
    else content = superVisao();
    return dashShell('super', tab, t[0], t[1], content);
  }

  function superVisao() {
    const s = settings();
    const active = db.clients.filter(c => c.status === 'active');
    const mrr = active.filter(c => c.plan === 'rent').reduce((a, c) => a + c.monthly, 0);
    const sales = db.clients.filter(c => c.plan === 'buy').reduce((a, c) => a + c.salePrice, 0);
    const unread = db.messages.filter(m => m.status === 'new').length;
    const allOrders = db.orders.filter(o => o.status !== 'cancelado');
    const gmv = allOrders.reduce((a, o) => a + o.total, 0);
    const recentMsgs = db.messages.slice(0, 6);

    const bars = last7DaysGmv();

    return '<div class="kpis">' +
      '<div class="kpi"><small>Clientes ativos</small><b>' + active.length + '</b><span>' + db.clients.length + ' cadastrados</span></div>' +
      '<div class="kpi"><small>Receita recorrente</small><b>' + money(mrr) + '</b><span>por mês</span></div>' +
      '<div class="kpi"><small>Vendas de licença</small><b>' + money(sales) + '</b><span>acumulado</span></div>' +
      '<div class="kpi"><small>Mensagens novas</small><b>' + unread + '</b><span>aguardando resposta</span></div>' +
      '</div>' +
      '<div class="grid-2"><div class="card chart-card"><h3>Volume dos clientes (7 dias)</h3><p class="muted tiny" style="margin:3px 0 0">Faturamento dos pedidos em todos os clientes ativos.</p><div class="chart">' + bars + '</div></div>' +
      '<div class="card card-pad"><h3 style="margin:0 0 10px;color:var(--forest);font-size:14px">Clientes</h3><div class="list">' + active.map(function (c) {
        return '<div class="list-row"><span class="avatar">' + esc(c.logo) + '</span><div class="info"><strong>' + esc(c.name) + '</strong><small>' + (c.plan === 'rent' ? 'Aluguel · ' + money(c.monthly) + '/mês' : 'Compra · ' + money(c.salePrice)) + ' · ' + esc(c.domain || '') + '</small></div><div class="right"><b>' + unreadFor(c.id) + '</b><small>novas</small></div></div>';
      }).join('') + '</div><div class="mt-2"><a class="btn btn-light btn-sm" href="#/admin/clientes">Gerenciar clientes ' + ico('arrow', 12) + '</a></div></div></div>' +
      '<div class="grid-2-even mt-2"><div class="card card-pad"><h3 style="margin:0 0 10px;color:var(--forest);font-size:14px">Inbox recente</h3>' + (db.messages.length ? '<div class="list">' + db.messages.slice(0, 5).map(function (m) {
        const c = clientById(m.clientId);
        return '<div class="list-row" onclick="App.openMessage(\'' + m.id + '\', \'admin\')" style="cursor:pointer"><span class="avatar">' + esc(c ? c.logo : '✉') + '</span><div class="info"><strong>' + esc(m.name) + '</strong><small>' + (c ? esc(c.name) : '') + ' · ' + esc(m.subject) + '</small></div><div class="right">' + statusBadge(m.status) + '<small style="display:block;margin-top:3px">' + D.timeAgo(m.createdAt) + '</small></div></div>';
      }).join('') + '</div>' : '<div class="empty"><b>Sem mensagens</b>Nenhuma notificação recebida ainda.</div>') +
      '</div><div class="card card-pad"><h3 style="margin:0 0 10px;color:var(--forest);font-size:14px">Atalhos</h3><div class="list"><div class="list-row" onclick="App.openModal(App.clientModalHtml(null), true)" style="cursor:pointer"><span class="avatar">+</span><div class="info"><strong>Novo cliente</strong><small>Cadastrar restaurante, plano e domínio</small></div><div class="right">' + ico('arrow', 13) + '</div></div><a class="list-row" href="#/admin/inbox"><span class="avatar">' + ico('inbox', 13) + '</span><div class="info"><strong>Inbox</strong><small>Responder mensagens no WhatsApp</small></div><div class="right">' + ico('arrow', 13) + '</div></a><a class="list-row" href="#/admin/financeiro"><span class="avatar">' + ico('wallet', 13) + '</span><div class="info"><strong>Financeiro</strong><small>Receita e resultado dos clientes</small></div><div class="right">' + ico('arrow', 13) + '</a></div></div></div>';
  }

  function last7DaysGmv() {
    const days = [];
    for (let d = 6; d >= 0; d--) {
      const day = new Date(); day.setDate(day.getDate() - d);
      const key = day.toDateString();
      const value = db.orders.filter(o => o.status !== 'cancelado' && new Date(o.createdAt).toDateString() === key)
        .reduce((s, o) => s + o.total, 0);
      days.push({ label: day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), value, today: d === 0 });
    }
    const max = Math.max(1, ...days.map(x => x.value));
    return days.map(function (d) {
      const h = Math.max(4, (d.value / max) * 100);
      return '<div class="col ' + (d.today ? 'today' : '') + '"><span class="val">' + (d.value > 0 ? money(d.value).replace('R$', '').trim() : '') + '</span><div class="bar" style="height:' + h + '%"></div><span class="lbl">' + d.label + '</span></div>';
    }).join('');
  }

  function superClientes() {
    const cards = db.clients.map(function (c) {
      const msg = unreadFor(c.id);
      const prodCount = D.clientProducts(db, c.id).filter(p => p.active).length;
      const ordCount = D.clientOrders(db, c.id).length;
      return '<div class="client-card"><div class="client-card-top"><span class="client-avatar">' + esc(c.logo) + '</span><div><h3>' + esc(c.name) + '</h3><span class="slug">' + esc(c.slug) + '</span></div><div style="margin-left:auto">' + planBadge(c.plan) + '</div></div>' +
        '<div class="meta"><span class="badge badge-muted">' + prodCount + ' itens</span><span class="badge badge-muted">' + ordCount + ' pedidos</span>' + (msg ? '<span class="badge badge-warn">' + msg + ' novas</span>' : '') + '<span class="badge badge-muted">' + (c.status === 'active' ? 'Ativo' : c.status) + '</span></div>' +
        '<div class="foot"><b>' + (c.plan === 'rent' ? money(c.monthly) + '/mês' : money(c.salePrice)) + '</b><div class="row" style="gap:6px"><a class="btn btn-light btn-sm" href="#/cardapio/' + esc(c.slug) + '" target="_blank" rel="noopener">' + ico('eye', 12) + '</a><button class="btn btn-light btn-sm" type="button" onclick="App.openClientModal(\'' + c.id + '\')">' + ico('edit', 12) + '</button><button class="btn btn-primary btn-sm" type="button" onclick="App.impersonate(\'' + c.id + '\')">Painel ' + ico('arrow', 11) + '</button></div></div>' +
        '<div class="tiny muted mt-1">' + esc(c.domain || '') + ' · ' + esc(c.whatsapp) + '</div></div>';
    }).join('');
    return '<div class="page-head"><div><h2>Clientes</h2><p>Cadastre e gerencie os restaurantes atendidos.</p></div><div class="page-actions"><button class="btn btn-primary" type="button" onclick="App.openClientModal(null)">Novo cliente ' + ico('plus', 14) + '</button></div></div>' +
      '<div class="client-grid">' + (cards || '<div class="empty"><b>Nenhum cliente</b>Cadastre o primeiro restaurante.</div>') + '</div>';
  }

  function superInbox() {
    let msgs = db.messages.slice();
    if (state.inboxFilterClient !== 'all') msgs = msgs.filter(m => m.clientId === state.inboxFilterClient);
    if (state.inboxFilterStatus !== 'all') msgs = msgs.filter(m => m.status === state.inboxFilterStatus);
    const selected = msgs.find(m => m.id === state.inboxSelected) || msgs[0] || null;
    if (selected) state.inboxSelected = selected.id;
    const filters = '<div class="page-head"><div><h2>Inbox</h2><p>Mensagens de todos os clientes, com origem identificada.</p></div><div class="page-actions"><select onchange="App.setInboxFilter(\'client\', this.value)" style="min-height:36px;padding:6px 10px;border:1px solid var(--line-strong);border-radius:9px;background:#fff;font-size:11px">' +
      '<option value="all"' + (state.inboxFilterClient === 'all' ? ' selected' : '') + '>Todos os clientes</option>' +
      db.clients.map(c => '<option value="' + esc(c.id) + '"' + (state.inboxFilterClient === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') +
      '</select><select onchange="App.setInboxFilter(\'status\', this.value)" style="min-height:36px;padding:6px 10px;border:1px solid var(--line-strong);border-radius:9px;background:#fff;font-size:11px">' +
      '<option value="all"' + (state.inboxFilterStatus === 'all' ? ' selected' : '') + '>Todos os status</option>' +
      '<option value="new"' + (state.inboxFilterStatus === 'new' ? ' selected' : '') + '>Novas</option>' +
      '<option value="read"' + (state.inboxFilterStatus === 'read' ? ' selected' : '') + '>Lidas</option>' +
      '<option value="replied"' + (state.inboxFilterStatus === 'replied' ? ' selected' : '') + '>Respondidas</option>' +
      '</select></div></div>';
    return filters + inboxHTML(msgs, selected, true);
  }

  function superFinanceiro() {
    const clients = db.clients;
    const totalMrr = clients.filter(c => c.plan === 'rent' && c.status === 'active').reduce((a, c) => a + c.monthly, 0);
    const totalSales = clients.filter(c => c.plan === 'buy').reduce((a, c) => a + c.salePrice, 0);
    const rows = clients.map(function (c) {
      const st = D.computeStats(db, c.id, 30);
      return '<tr><td><div class="row" style="gap:8px"><span style="font-size:18px">' + esc(c.logo) + '</span><div><strong style="color:var(--forest)">' + esc(c.name) + '</strong><div class="tiny muted">' + esc(c.domain || '') + '</div></div></div></td>' +
        '<td>' + planBadge(c.plan) + '</td>' +
        '<td class="right">' + (c.plan === 'rent' ? money(c.monthly) + '/mês' : money(c.salePrice)) + '</td>' +
        '<td class="right">' + money(st.revenue) + '</td>' +
        '<td class="right">' + money(st.costTotal) + '</td>' +
        '<td class="right" style="color:' + (st.profit >= 0 ? 'var(--ok)' : 'var(--danger)') + ';font-weight:800">' + money(st.profit) + '</td>' +
        '<td class="right">' + st.ordersCount + '</td></tr>';
    }).join('');
    return '<div class="page-head"><div><h2>Financeiro</h2><p>Receita do sistema e resultado dos clientes.</p></div></div>' +
      '<div class="kpis"><div class="kpi"><small>Receita recorrente</small><b>' + money(totalMrr) + '</b><span>por mês</span></div>' +
        '<div class="kpi"><small>Vendas de licença</small><b>' + money(totalSales) + '</b><span>acumulado</span></div>' +
        '<div class="kpi"><small>Faturamento dos clientes (30d)</small><b>' + money(clients.reduce((a, c) => a + D.computeStats(db, c.id, 30).revenue, 0)) + '</b><span>GMV</span></div>' +
        '<div class="kpi"><small>Lucro dos clientes (30d)</small><b>' + money(clients.reduce((a, c) => a + D.computeStats(db, c.id, 30).profit, 0)) + '</b><span>resultado</span></div></div>' +
      '<div class="card"><div class="card-head"><h3>Resultado por cliente (30 dias)</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Cliente</th><th>Plano</th><th class="right">Contrato</th><th class="right">Faturamento</th><th class="right">Custos</th><th class="right">Lucro</th><th class="right">Pedidos</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function superConfig() {
    const s = settings();
    return '<div class="page-head"><div><h2>Configurações</h2><p>Ajustes gerais, PINs e dados de demonstração.</p></div></div>' +
      '<div class="grid-2-even"><div class="card card-pad"><h3 style="margin:0 0 12px;color:var(--forest);font-size:14px">Sistema</h3>' +
        '<form onsubmit="App.saveSystemSettings(event)"><div class="form-grid">' +
          '<div class="field"><label>Marca</label><input name="brand" value="' + esc(s.brand) + '"></div>' +
          '<div class="field"><label>WhatsApp de suporte</label><input name="supportWhatsApp" value="' + esc(s.supportWhatsApp) + '" placeholder="5521999999999"></div>' +
          '<div class="field"><label>Nome do suporte</label><input name="supportName" value="' + esc(s.supportName) + '"></div>' +
          '<div class="field"><label>PIN do cliente</label><input name="clientPin" value="' + esc(s.clientPin) + '"></div>' +
          '<div class="field"><label>PIN do admin</label><input name="superPin" value="' + esc(s.superPin) + '"></div>' +
          '<div class="field"><label>Valor do aluguel (R$/mês)</label><input name="rentPrice" type="number" step="0.01" value="' + s.rentPrice + '"></div>' +
          '<div class="field"><label>Preço mínimo de compra</label><input name="buyMin" type="number" step="0.01" value="' + s.buyMin + '"></div>' +
          '<div class="field"><label>Preço máximo de compra</label><input name="buyMax" type="number" step="0.01" value="' + s.buyMax + '"></div>' +
        '</div><div class="form-actions"><button class="btn btn-primary" type="submit">Salvar ' + ico('check', 13) + '</button></div></form></div>' +
        '<div class="card card-pad"><h3 style="margin:0 0 12px;color:var(--forest);font-size:14px">Dados de demonstração</h3><p class="muted small" style="margin:0 0 12px">Restaura todos os dados iniciais (clientes, produtos, pedidos, custos, mensagens). Use apenas para resetar a demo.</p><button class="btn btn-danger btn-sm" type="button" onclick="App.resetDemo()">Resetar dados demo</button><div class="mt-3"><p class="muted small" style="margin:0">Esta é uma demonstração local. Para produção, conecte um backend (Supabase, Firebase ou API própria) e substitua o localStorage. Consulte o README.</p></div></div></div>';
  }

  /* ============================ views cliente ============================ */
  function viewClient(tab) {
    if (!session || session.role !== 'client' || !session.clientId) { go('#/login'); return ''; }
    const client = clientById(session.clientId);
    if (!client) { D.setSession(null); session = null; go('#/login'); return ''; }
    const titles = {
      visao: ['Visão geral', 'O movimento do seu restaurante'],
      cardapio: ['Cardápio', 'Itens, preços e disponibilidade'],
      pedidos: ['Pedidos', 'Acompanhe e atualize os pedidos'],
      financeiro: ['Financeiro', 'Faturamento, custos e lucro'],
      mensagens: ['Mensagens', 'Conversas com o suporte'],
      config: ['Configurações', 'Dados do restaurante e do plano']
    };
    const t = titles[tab] || titles.visao;
    let content = '';
    if (tab === 'cardapio') content = clientCardapio(client);
    else if (tab === 'pedidos') content = clientPedidos(client);
    else if (tab === 'financeiro') content = clientFinanceiro(client);
    else if (tab === 'mensagens') content = clientMensagens(client);
    else if (tab === 'config') content = clientConfig(client);
    else content = clientVisao(client);
    return dashShell('client', tab, t[0], t[1], content);
  }

  function clientVisao(client) {
    const st = D.computeStats(db, client.id, 7);
    const bars = st.daily.map(function (d, i) {
      const max = Math.max(1, ...st.daily.map(x => x.value));
      const h = Math.max(4, (d.value / max) * 100);
      const today = i === st.daily.length - 1;
      return '<div class="col ' + (today ? 'today' : '') + '"><span class="val">' + (d.value > 0 ? money(d.value).replace('R$', '').trim() : '') + '</span><div class="bar" style="height:' + h + '%"></div><span class="lbl">' + d.label + '</span></div>';
    }).join('');
    const top = st.topProducts.length ? st.topProducts.map(function (p, i) {
      return '<div class="list-row"><span class="avatar">' + (i + 1) + '</span><div class="info"><strong>' + esc(p.name) + '</strong><small>' + p.qty + ' un. vendidas</small></div><div class="right"><b>' + money(p.total) + '</b></div></div>';
    }).join('') : '<div class="empty"><b>Sem vendas ainda</b>Os itens mais vendidos aparecem aqui.</div>';
    const recent = st.orders.slice(0, 5).map(function (o) {
      return '<div class="list-row"><span class="avatar">' + esc(o.customerName.charAt(0)) + '</span><div class="info"><strong>' + esc(o.customerName) + '</strong><small>' + o.items.map(i => i.qty + 'x ' + i.name).join(', ').slice(0, 48) + ' · ' + D.timeAgo(o.createdAt) + '</small></div><div class="right">' + statusBadge(o.status) + '<b style="display:block;margin-top:3px">' + money(o.total) + '</b></div></div>';
    }).join('');
    const recentMsgs = D.clientMessages(db, client.id).slice(0, 3).map(function (m) {
      return '<div class="list-row" onclick="App.openMessage(\'' + m.id + '\')" style="cursor:pointer"><span class="avatar">' + (m.source === 'site' ? '🌐' : '📱') + '</span><div class="info"><strong>' + esc(m.name) + '</strong><small>' + esc(m.subject) + ' · ' + D.timeAgo(m.createdAt) + '</small></div><div class="right">' + statusBadge(m.status) + '</div></div>';
    }).join('');
    return '<div class="kpis">' +
      '<div class="kpi"><small>Pedidos hoje</small><b>' + st.todayOrders + '</b><span>' + st.ordersCount + ' nos últimos 7 dias</span></div>' +
      '<div class="kpi"><small>Faturamento 7d</small><b>' + money(st.revenue) + '</b><span>' + money(st.todayRevenue) + ' hoje</span></div>' +
      '<div class="kpi"><small>Custos 7d</small><b>' + money(st.costTotal) + '</b><span>lançados manualmente</span></div>' +
      '<div class="kpi"><small>Lucro 7d</small><b style="color:' + (st.profit >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + money(st.profit) + '</b><span>margem ' + (st.revenue ? Math.round((st.profit / st.revenue) * 100) : 0) + '%</span></div>' +
      '</div>' +
      '<div class="kpis" style="margin-bottom:14px"><div class="kpi"><small>Ticket médio</small><b>' + money(st.ticket) + '</b><span>por pedido</span></div>' +
        '<div class="kpi"><small>Mensagens novas</small><b>' + st.unread + '</b><span>aguardando resposta</span></div>' +
        '<div class="kpi"><small>Itens ativos</small><b>' + D.clientProducts(db, client.id).filter(p => p.active).length + '</b><span>no cardápio</span></div>' +
        '<div class="kpi"><small>Pedidos em aberto</small><b>' + st.orders.filter(o => o.status === 'novo' || o.status === 'preparando').length + '</b><span>novos + preparando</span></div></div>' +
      '<div class="grid-2"><div class="card chart-card"><h3>Faturamento (7 dias)</h3><p class="muted tiny" style="margin:3px 0 0">Pedidos não cancelados.</p><div class="chart">' + bars + '</div></div>' +
        '<div class="card card-pad"><h3 style="margin:0 0 10px;color:var(--forest);font-size:14px">Produtos mais vendidos</h3>' + (top || '') + '</div></div>' +
      '<div class="grid-2-even mt-2"><div class="card card-pad"><h3 style="margin:0 0 10px;color:var(--forest);font-size:14px">Pedidos recentes</h3>' + (recent || '<div class="empty"><b>Sem pedidos</b>Os pedidos aparecem aqui.</div>') + '<div class="mt-2"><a class="btn btn-light btn-sm" href="#/painel/pedidos">Ver todos ' + ico('arrow', 12) + '</a></div></div>' +
        '<div class="card card-pad"><h3 style="margin:0 0 10px;color:var(--forest);font-size:14px">Mensagens recentes</h3>' + (recentMsgs || '<div class="empty"><b>Sem mensagens</b>Nenhuma conversa ainda.</div>') + '<div class="mt-2"><a class="btn btn-light btn-sm" href="#/painel/mensagens">Abrir inbox ' + ico('arrow', 12) + '</a></div></div></div>';
  }

  function clientCardapio(client) {
    const products = D.clientProducts(db, client.id);
    const cats = Array.from(new Set(products.map(p => p.category)));
    const rows = products.map(function (p) {
      return '<div class="prod-card"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        '<div class="prod-card-body"><div class="row-between"><span class="cat">' + esc(p.category) + '</span>' + (p.active ? '<span class="badge badge-ok">ativo</span>' : '<span class="badge badge-muted">oculto</span>') + '</div>' +
        '<h4>' + esc(p.name) + '</h4><p class="tiny muted" style="margin:3px 0 6px;min-height:28px">' + esc(p.description) + '</p>' +
        '<div class="row-between"><span class="price">' + money(p.price) + '</span><div class="actions"><button class="btn btn-light btn-sm" type="button" onclick="App.toggleProduct(\'' + p.id + '\')">' + (p.active ? 'Ocultar' : 'Ativar') + '</button><button class="btn btn-light btn-sm" type="button" onclick="App.openProductModal(\'' + p.id + '\')">' + ico('edit', 12) + '</button><button class="btn btn-danger btn-sm" type="button" onclick="App.deleteProduct(\'' + p.id + '\')">' + ico('trash', 12) + '</button></div></div></div></div>';
    }).join('');
    return '<div class="page-head"><div><h2>Cardápio</h2><p>Adicione, edite e organize os itens do seu menu.</p></div><div class="page-actions"><button class="btn btn-primary" type="button" onclick="App.openProductModal(null)">Novo item ' + ico('plus', 13) + '</button><a class="btn btn-light" href="#/cardapio/' + esc(client.slug) + '" target="_blank" rel="noopener">Ver como cliente ' + ico('external', 13) + '</a></div></div>' +
      '<div class="prod-grid">' + (rows || '<div class="empty" style="grid-column:1/-1"><b>Sem itens</b>Adicione o primeiro item do cardápio.</div>') + '</div>' +
      '<div class="card card-pad mt-2" style="margin-top:16px"><h3 style="margin:0 0 6px;color:var(--forest);font-size:13px">Categorias usadas</h3><p class="muted tiny" style="margin:0">' + (cats.length ? cats.map(esc).join(' · ') : '—') + '</p></div>';
  }

  function clientPedidos(client) {
    const all = D.clientOrders(db, client.id);
    const filtered = state.ordersFilter === 'all' ? all : all.filter(o => o.status === state.ordersFilter);
    const rows = filtered.map(function (o) {
      return '<tr><td><strong>#' + esc(o.id) + '</strong><div class="tiny muted">' + D.dateTime(o.createdAt) + '</div></td>' +
        '<td>' + esc(o.customerName) + '<div class="tiny muted">' + esc(o.customerPhone) + '</div></td>' +
        '<td>' + o.items.map(i => i.qty + 'x ' + esc(i.name)).join(', ').slice(0, 60) + '</td>' +
        '<td class="right"><b>' + money(o.total) + '</b><div class="tiny muted">' + esc(o.payment) + ' · ' + esc(o.method) + '</div></td>' +
        '<td><select onchange="App.updateOrderStatus(\'' + o.id + '\', this.value)" style="min-height:32px;padding:4px 8px;border:1px solid var(--line-strong);border-radius:8px;background:#fff;font-size:11px">' +
          ['novo', 'preparando', 'entregue', 'cancelado'].map(s => '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + ({ novo: 'Novo', preparando: 'Preparando', entregue: 'Entregue', cancelado: 'Cancelado' })[s] + '</option>').join('') +
        '</select></td>' +
        '<td><button class="btn btn-light btn-sm" type="button" onclick="App.viewOrder(\'' + o.id + '\')">Ver</button></td></tr>';
    }).join('');
    return '<div class="page-head"><div><h2>Pedidos</h2><p>' + all.length + ' pedidos no total.</p></div><div class="page-actions">' +
      ['all', 'novo', 'preparando', 'entregue', 'cancelado'].map(function (k) {
        const label = k === 'all' ? 'Todos' : k === 'novo' ? 'Novos' : k === 'preparando' ? 'Preparando' : k === 'entregue' ? 'Entregues' : 'Cancelados';
        return '<button class="chip ' + (state.ordersFilter === k ? 'active' : '') + '" type="button" onclick="App.setOrdersFilter(\'' + k + '\')">' + label + '</button>';
      }).join('') + '</div></div>' +
      '<div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th class="right">Total</th><th>Status</th><th></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6" class="empty"><b>Sem pedidos</b>Nenhum pedido neste filtro.</td></tr>') + '</tbody></table></div></div>';
  }

  function clientFinanceiro(client) {
    const st = D.computeStats(db, client.id, 30);
    const costs = D.clientCosts(db, client.id).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const rows = costs.map(function (c) {
      return '<tr><td>' + esc(c.description) + '<div class="tiny muted">' + esc(c.category) + '</div></td><td class="right">' + money(c.amount) + '</td><td class="tiny muted">' + D.shortDate(c.date) + '</td><td><button class="btn btn-danger btn-sm" type="button" onclick="App.deleteCost(\'' + c.id + '\')">' + ico('trash', 12) + '</button></td></tr>';
    }).join('');
    return '<div class="kpis">' +
      '<div class="kpi"><small>Faturamento (30d)</small><b>' + money(st.revenue) + '</b><span>' + st.ordersCount + ' pedidos</span></div>' +
      '<div class="kpi"><small>Custos (30d)</small><b>' + money(st.costTotal) + '</b><span>' + costs.length + ' lançamentos</span></div>' +
      '<div class="kpi"><small>Lucro (30d)</small><b style="color:' + (st.profit >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + money(st.profit) + '</b><span>margem ' + (st.revenue ? Math.round((st.profit / st.revenue) * 100) : 0) + '%</span></div>' +
      '<div class="kpi"><small>Ticket médio</small><b>' + money(st.ticket) + '</b><span>por pedido</span></div></div>' +
      '<div class="grid-2-even"><div class="card card-pad"><h3 style="margin:0 0 12px;color:var(--forest);font-size:14px">Lançar custo</h3>' +
        '<form onsubmit="App.addCost(event, \'' + esc(client.id) + '\')"><div class="form-grid">' +
          '<div class="field span-2"><label>Descrição</label><input name="description" required placeholder="Ex.: ingredientes da semana"></div>' +
          '<div class="field"><label>Categoria</label><select name="category"><option>Ingredientes</option><option>Embalagens</option><option>Equipe</option><option>Entrega</option><option>Operação</option><option>Marketing</option><option>Outros</option></select></div>' +
          '<div class="field"><label>Valor (R$)</label><input name="amount" type="number" step="0.01" required placeholder="0,00"></div>' +
          '<div class="field span-2"><label>Data</label><input name="date" type="date" required value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
        '</div><div class="form-actions"><button class="btn btn-primary" type="submit">Lançar ' + ico('plus', 13) + '</button></div></form></div>' +
        '<div class="card card-pad"><h3 style="margin:0 0 12px;color:var(--forest);font-size:14px">Observação</h3><p class="muted small" style="margin:0;line-height:1.7">O faturamento vem dos pedidos registrados no painel. Os custos são lançados manualmente. O lucro é a diferença. Isso é um painel gerencial, não uma contabilidade fiscal.</p></div></div>' +
      '<div class="card mt-2" style="margin-top:14px"><div class="card-head"><h3>Custos lançados</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Descrição</th><th class="right">Valor</th><th>Data</th><th></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4" class="empty"><b>Sem custos</b>Lance o primeiro custo ao lado.</td></tr>') + '</tbody></table></div></div>';
  }

  function clientMensagens(client) {
    const msgs = D.clientMessages(db, client.id).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const selected = msgs.find(m => m.id === state.inboxSelected) || msgs[0] || null;
    if (selected) state.inboxSelected = selected.id;
    return '<div class="page-head"><div><h2>Mensagens</h2><p>Conversas do seu restaurante com o suporte.</p></div><div class="page-actions"><button class="btn btn-primary" type="button" onclick="App.openSupport(\'admin\')">Nova mensagem ' + ico('chat', 13) + '</button></div></div>' +
      inboxHTML(msgs, selected, false);
  }

  function clientConfig(client) {
    const s = settings();
    return '<div class="page-head"><div><h2>Configurações</h2><p>Dados do restaurante e do plano.</p></div></div>' +
      '<div class="grid-2-even"><div class="card card-pad"><h3 style="margin:0 0 12px;color:var(--forest);font-size:14px">Dados do restaurante</h3>' +
        '<form onsubmit="App.saveClientSettings(event, \'' + esc(client.id) + '\')"><div class="form-grid">' +
          '<div class="field"><label>Nome</label><input name="name" required value="' + esc(client.name) + '"></div>' +
          '<div class="field"><label>Logo (emoji)</label><input name="logo" value="' + esc(client.logo) + '" maxlength="4"></div>' +
          '<div class="field span-2"><label>Slogan</label><input name="tagline" value="' + esc(client.tagline) + '"></div>' +
          '<div class="field span-2"><label>Descrição</label><textarea name="description">' + esc(client.description) + '</textarea></div>' +
          '<div class="field span-2"><label>Foto de capa (URL)</label><input name="cover" value="' + esc(client.cover) + '"></div>' +
          '<div class="field"><label>WhatsApp</label><input name="whatsapp" required value="' + esc(client.whatsapp) + '"></div>' +
          '<div class="field"><label>Telefone</label><input name="phone" value="' + esc(client.phone) + '"></div>' +
          '<div class="field span-2"><label>Endereço</label><input name="address" value="' + esc(client.address) + '"></div>' +
          '<div class="field span-2"><label>Horário</label><input name="hours" value="' + esc(client.hours) + '"></div>' +
        '</div><div class="form-actions"><button class="btn btn-primary" type="submit">Salvar ' + ico('check', 13) + '</button></div></form></div>' +
        '<div class="card card-pad"><h3 style="margin:0 0 12px;color:var(--forest);font-size:14px">Plano e domínio</h3>' +
        '<div class="list"><div class="list-row"><div class="info"><strong>Plano</strong><small>' + (client.plan === 'rent' ? 'Aluguel' : 'Compra') + '</small></div><div class="right"><b>' + (client.plan === 'rent' ? money(client.monthly) + '/mês' : money(client.salePrice)) + '</b></div></div>' +
        '<div class="list-row"><div class="info"><strong>Domínio</strong><small>Registrado no seu nome</small></div><div class="right"><b style="font-size:11px">' + esc(client.domain || '—') + '</b></div></div>' +
        '<div class="list-row"><div class="info"><strong>Status</strong><small>Cadastro</small></div><div class="right">' + (client.status === 'active' ? '<span class="badge badge-ok">Ativo</span>' : '<span class="badge badge-muted">' + esc(client.status) + '</span>') + '</div></div>' +
        '<div class="list-row"><div class="info"><strong>Desde</strong><small>Cadastro</small></div><div class="right"><b style="font-size:11px">' + D.shortDate(client.createdAt) + '</b></div></div></div>' +
        '<div class="mt-2"><p class="muted small" style="margin:0;line-height:1.7">' + (client.plan === 'rent' ? 'No aluguel, a hospedagem, as atualizações e o suporte estão inclusos. Você paga apenas o domínio.' : 'Na compra, o sistema é seu. A hospedagem e as atualizações futuras são por sua conta.') + '</p></div>' +
        '<div class="row mt-2" style="gap:8px"><a class="btn btn-light btn-sm" href="#/cardapio/' + esc(client.slug) + '" target="_blank" rel="noopener">Ver cardápio ' + ico('external', 12) + '</a><button class="btn btn-primary btn-sm" type="button" onclick="App.openSupport(\'admin\')">Falar com suporte ' + ico('chat', 12) + '</button></div></div></div>';
  }

  /* ============================ inbox compartilhado ============================ */
  function inboxHTML(msgs, selected, showClient) {
    const listHtml = msgs.length ? msgs.map(function (m) {
      const c = clientById(m.clientId);
      return '<button class="inbox-item ' + (selected && selected.id === m.id ? 'active' : '') + '" type="button" onclick="App.openMessage(\'' + m.id + '\')">' +
        '<div class="top"><strong>' + esc(m.name) + '</strong><small>' + D.timeAgo(m.createdAt) + '</small></div>' +
        (showClient && c ? '<div class="tiny muted" style="margin-top:1px">' + esc(c.name) + ' · ' + sourceBadge(m.source) + '</div>' : '<div class="tiny muted" style="margin-top:1px">' + sourceBadge(m.source) + '</div>') +
        '<div class="subject">' + esc(m.subject) + '</div>' +
        '<div class="preview">' + esc(m.text) + '</div></button>';
    }).join('') : '<div class="empty"><b>Sem mensagens</b>Nenhuma notificação recebida ainda.</div>';

    const detailHtml = selected ? (
      '<div class="inbox-detail"><div class="inbox-detail-head"><div class="row-between"><div><h3>' + esc(selected.subject) + '</h3><p>' + esc(selected.name) + ' · ' + esc(selected.phone) + (showClient ? ' · ' + esc((clientById(selected.clientId) || {}).name || '') : '') + ' · ' + sourceBadge(selected.source) + ' · ' + D.dateTime(selected.createdAt) + '</p></div>' + statusBadge(selected.status) + '</div></div>' +
      '<div class="inbox-thread"><div class="bubble in">' + esc(selected.text) + '<small>' + D.dateTime(selected.createdAt) + '</small></div>' +
        (selected.replies || []).map(function (r) { return '<div class="bubble out">' + esc(r.text) + '<small>' + D.dateTime(r.at) + '</small></div>'; }).join('') +
      '</div>' +
      '<div class="inbox-reply"><textarea id="replyText" placeholder="Escreva sua resposta..."></textarea><div class="row"><button class="btn btn-light btn-sm" type="button" onclick="App.markMessage(\'' + selected.id + '\',\'read\')">Marcar como lida</button><button class="btn btn-light btn-sm" type="button" onclick="App.whatsappMessage(\'' + selected.id + '\')">Abrir WhatsApp</button><button class="btn btn-primary btn-sm" type="button" onclick="App.sendReply(event,\'' + selected.id + '\')">Responder ' + ico('whats', 12) + '</button></div></div></div>'
    ) : '<div class="empty" style="align-self:center"><b>Selecione uma mensagem</b>Escolha uma conversa na lista.</div>';

    return '<div class="card" style="padding:0;overflow:hidden"><div class="inbox"><div class="inbox-list">' + listHtml + '</div><div class="inbox-detail">' + detailHtml + '</div></div></div>';
  }

  /* ============================ modais ============================ */
  function openProductModal(id) {
    const client = session && session.role === 'client' ? clientById(session.clientId) : (state.adminClientId ? clientById(state.adminClientId) : null);
    const cid = client ? client.id : null;
    const p = id ? productById(id) : null;
    const cats = client ? Array.from(new Set(D.clientProducts(db, cid).map(x => x.category))) : [];
    const catOptions = cats.concat(['Novos']).map(c => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('');
    const imgOpts = ['assets/img/pizza.webp','assets/img/massa.webp','assets/img/bowl.webp','assets/img/bruschetta.webp','assets/img/prato-casa.webp','assets/img/salada-especial.webp','assets/img/bodo.webp'.replace('bodo','bodo'),'assets/img/bodo.webp'.replace('bodo','bodo'),'assets/img/pudim.webp','assets/img/bolo.webp','assets/img/cafe.webp','assets/img/limonada.webp','assets/img/suco.webp','assets/img/entrada-verde.webp'].filter((v,i,a)=>a.indexOf(v)===i);
    const imgDatalist = imgOpts.map(function (u) { return '<option value="' + esc(u) + '">'; }).join('');
    openModal(
      '<div class="modal-head"><h2>' + (p ? 'Editar item' : 'Novo item') + '</h2><button class="icon-btn" type="button" onclick="App.closeModal()">×</button></div>' +
      '<div class="modal-body"><form onsubmit="App.saveProduct(event,\'' + esc(id || '') + '\',\'' + esc(cid || '') + '\')"><div class="form-grid">' +
        '<div class="field span-2"><label>Nome</label><input name="name" required value="' + esc(p ? p.name : '') + '" placeholder="Ex.: Pizza Margherita"></div>' +
        '<div class="field span-2"><label>Descrição</label><textarea name="description" placeholder="Ingredientes e detalhes">' + esc(p ? p.description : '') + '</textarea></div>' +
        '<div class="field"><label>Preço (R$)</label><input name="price" type="number" step="0.01" required value="' + (p ? p.price : '') + '"></div>' +
        '<div class="field"><label>Categoria</label><input name="category" list="catList" required value="' + esc(p ? p.category : (cats[0] || 'Pratos')) + '" placeholder="Ex.: Pizzas"><datalist id="catList">' + catOptions + '</datalist></div>' +
        '<div class="field span-2"><label>Foto (URL ou arquivo local)</label><input name="image" list="imgList" value="' + esc(p ? p.image : 'assets/img/pizza.webp') + '" placeholder="assets/img/pizza.webp ou https://..."><datalist id="imgList">' + imgDatalist + '</datalist></div>' +
        '<div class="field span-2"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="active" ' + (p ? (p.active ? 'checked' : '') : 'checked') + ' style="width:16px;height:16px"> Item ativo (aparece no cardápio)</label></div>' +
        '<div class="field span-2"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="featured" ' + (p && p.featured ? 'checked' : '') + ' style="width:16px;height:16px"> Destaque</label></div>' +
      '</div><div class="form-actions"><button class="btn btn-light" type="button" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" type="submit">' + (p ? 'Salvar' : 'Adicionar') + ' ' + ico('check', 13) + '</button></div></form></div>'
    );
  }

  function saveProduct(e, id, clientId) {
    e.preventDefault();
    const f = e.target;
    const data = new FormData(f);
    const name = (data.get('name') || '').toString().trim();
    const price = parseFloat(data.get('price'));
    if (!name || isNaN(price)) { toast('Preencha nome e preço.', 'err'); return; }
    const product = {
      id: id || ('prod_' + Date.now().toString(36).slice(-6)),
      clientId: clientId,
      name: name,
      description: (data.get('description') || '').toString().trim(),
      price: price,
      category: (data.get('category') || '').toString().trim() || 'Geral',
      image: (data.get('image') || '').toString().trim() || 'assets/img/pizza.webp',
      active: data.get('active') === 'on',
      featured: data.get('featured') === 'on'
    };
    const idx = db.products.findIndex(p => p.id === product.id);
    if (idx >= 0) db.products[idx] = product; else db.products.push(product);
    save();
    closeModal();
    toast('Item salvo.');
    router();
  }

  function toggleProduct(id) {
    const p = productById(id);
    if (!p) return;
    p.active = !p.active;
    save();
    toast(p.active ? 'Item ativado.' : 'Item ocultado.');
    router();
  }

  function deleteProduct(id) {
    if (!confirm('Excluir este item do cardápio?')) return;
    db.products = db.products.filter(p => p.id !== id);
    save();
    toast('Item excluído.');
    router();
  }

  function openClientModal(id) {
    const c = id ? clientById(id) : null;
    const html = '<div class="modal-head"><h2>' + (c ? 'Editar cliente' : 'Novo cliente') + '</h2><button class="icon-btn" type="button" onclick="App.closeModal()">×</button></div>' +
      '<div class="modal-body"><form onsubmit="App.saveClient(event,\'' + (c ? c.id : '') + '\')"><div class="form-grid">' +
        '<div class="field"><label>Nome do restaurante</label><input name="name" required value="' + esc(c ? c.name : '') + '"></div>' +
        '<div class="field"><label>Logo (emoji)</label><input name="logo" value="' + esc(c ? c.logo : '🍽') + '" maxlength="4"></div>' +
        '<div class="field span-2"><label>Slug (URL)</label><input name="slug" required value="' + esc(c ? c.slug : '') + '" placeholder="pizzaria-do-ze"></div>' +
        '<div class="field span-2"><label>Slogan</label><input name="tagline" value="' + esc(c ? c.tagline : '') + '"></div>' +
        '<div class="field span-2"><label>Descrição</label><textarea name="description">' + esc(c ? c.description : '') + '</textarea></div>' +
        '<div class="field span-2"><label>Foto de capa (URL)</label><input name="cover" value="' + esc(c ? c.cover : 'assets/img/pizza.webp') + '"></div>' +
        '<div class="field"><label>WhatsApp</label><input name="whatsapp" required value="' + esc(c ? c.whatsapp : '') + '" placeholder="5521999999999"></div>' +
        '<div class="field"><label>Telefone</label><input name="phone" value="' + esc(c ? c.phone : '') + '"></div>' +
        '<div class="field span-2"><label>Endereço</label><input name="address" value="' + esc(c ? c.address : '') + '"></div>' +
        '<div class="field span-2"><label>Horário</label><input name="hours" value="' + esc(c ? c.hours : '') + '"></div>' +
        '<div class="field"><label>Plano</label><select name="plan"><option value="rent"' + (c && c.plan === 'rent' ? ' selected' : '') + '>Aluguel</option><option value="buy"' + (c && c.plan === 'buy' ? ' selected' : '') + '>Compra</option></select></div>' +
        '<div class="field"><label>Mensalidade (R$)</label><input name="monthly" type="number" step="0.01" value="' + (c ? c.monthly : settings().rentPrice) + '"></div>' +
        '<div class="field"><label>Preço de compra (R$)</label><input name="salePrice" type="number" step="0.01" value="' + (c ? c.salePrice : 0) + '"></div>' +
        '<div class="field span-2"><label>Domínio</label><input name="domain" value="' + esc(c ? c.domain : '') + '" placeholder="restaurante.com.br"></div>' +
        '<div class="field"><label>Status</label><select name="status"><option value="active"' + (c && c.status === 'active' ? ' selected' : (!c ? ' selected' : '')) + '>Ativo</option><option value="paused"' + (c && c.status === 'paused' ? ' selected' : '') + '>Pausado</option></select></div>' +
      '</div><div class="form-actions"><button class="btn btn-light" type="button" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" type="submit">' + (c ? 'Salvar' : 'Criar') + ' ' + ico('check', 13) + '</button></div></form></div>';
    openModal(html, true);
  }

  function clientModalHtml(id) { return ''; } // placeholder (not used)

  function saveClient(e, id) {
    e.preventDefault();
    const f = e.target;
    const data = new FormData(f);
    const name = (data.get('name') || '').toString().trim();
    const slug = (data.get('slug') || '').toString().trim() || D.slugify(name);
    if (!name || !slug) { toast('Preencha nome e slug.', 'err'); return; }
    if (db.clients.some(c => c.slug === slug && c.id !== id)) { toast('Slug já em uso.', 'err'); return; }
    const existing = id ? clientById(id) : null;
    const client = {
      id: existing ? existing.id : ('cli_' + Date.now().toString(36).slice(-6)),
      slug: slug,
      name: name,
      logo: (data.get('logo') || '🍽').toString().trim() || '🍽',
      tagline: (data.get('tagline') || '').toString().trim(),
      description: (data.get('description') || '').toString().trim(),
      cover: (data.get('cover') || '').toString().trim() || 'assets/img/pizza.webp',
      whatsapp: (data.get('whatsapp') || '').toString().trim(),
      phone: (data.get('phone') || '').toString().trim(),
      address: (data.get('address') || '').toString().trim(),
      hours: (data.get('hours') || '').toString().trim(),
      plan: (data.get('plan') || 'rent').toString(),
      monthly: parseFloat(data.get('monthly')) || 0,
      salePrice: parseFloat(data.get('salePrice')) || 0,
      domain: (data.get('domain') || '').toString().trim(),
      status: (data.get('status') || 'active').toString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };
    if (existing) {
      const idx = db.clients.findIndex(c => c.id === existing.id);
      db.clients[idx] = client;
    } else {
      db.clients.push(client);
    }
    save();
    closeModal();
    toast(existing ? 'Cliente atualizado.' : 'Cliente criado.');
    router();
  }

  function impersonate(id) {
    const c = clientById(id);
    if (!c) return;
    D.setSession({ role: 'client', clientId: id, backToSuper: true });
    session = D.getSession();
    go('#/painel');
  }

  function backToSuper() {
    D.setSession({ role: 'super' });
    session = D.getSession();
    go('#/admin');
  }

  function archiveClient(id) {
    const c = clientById(id);
    if (!c) return;
    if (!confirm('Arquivar "' + c.name + '"? Ele deixará de aparecer como ativo.')) return;
    c.status = 'paused';
    save();
    toast('Cliente arquivado.');
    router();
  }

  function setOrdersFilter(k) { state.ordersFilter = k; state.keepScroll = true; router(); }
  function setInboxFilter(kind, value) {
    if (kind === 'client') state.inboxFilterClient = value;
    else state.inboxFilterStatus = value;
    state.inboxSelected = null;
    state.keepScroll = true;
    router();
  }

  function openMessage(id) {
    state.inboxSelected = id;
    const m = messageById(id);
    if (m && m.status === 'new') { m.status = 'read'; save(); }
    state.keepScroll = true;
    router();
  }

  function markMessage(id, status) {
    const m = messageById(id);
    if (!m) return;
    m.status = status;
    save();
    toast(status === 'read' ? 'Marcada como lida.' : 'Atualizada.');
    router();
  }

  function whatsappMessage(id) {
    const m = messageById(id);
    if (!m) return;
    const text = m.replies && m.replies.length ? m.replies[m.replies.length - 1].text : m.text;
    window.open(D.waLink(m.phone, text), '_blank', 'noopener');
  }

  function sendReply(e, id) {
    e.preventDefault();
    const m = messageById(id);
    if (!m) return;
    const ta = document.getElementById('replyText');
    const text = (ta ? ta.value : '').trim();
    if (!text) { toast('Escreva uma resposta.', 'err'); return; }
    m.replies.push({ text: text, at: new Date().toISOString() });
    m.status = 'replied';
    save();
    window.open(D.waLink(m.phone, text), '_blank', 'noopener');
    toast('Resposta registrada e WhatsApp aberto.');
    router();
  }

  function addCost(e, clientId) {
    e.preventDefault();
    const f = e.target;
    const data = new FormData(f);
    const desc = (data.get('description') || '').toString().trim();
    const amount = parseFloat(data.get('amount'));
    const date = (data.get('date') || '').toString();
    if (!desc || isNaN(amount)) { toast('Preencha descrição e valor.', 'err'); return; }
    db.costs.unshift({
      id: 'c_' + Date.now().toString(36).slice(-6),
      clientId: clientId,
      description: desc,
      category: (data.get('category') || 'Outros').toString(),
      amount: amount,
      date: date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString()
    });
    save();
    toast('Custo lançado.');
    router();
  }

  function deleteCost(id) {
    if (!confirm('Excluir este custo?')) return;
    db.costs = db.costs.filter(c => c.id !== id);
    save();
    toast('Custo excluído.');
    router();
  }

  function updateOrderStatus(id, status) {
    const o = db.orders.find(x => x.id === id);
    if (!o) return;
    o.status = status;
    save();
    toast('Status atualizado.');
    state.keepScroll = true;
    router();
  }

  function viewOrder(id) {
    const o = db.orders.find(x => x.id === id);
    if (!o) return;
    const client = clientById(o.clientId);
    const items = o.items.map(function (i) {
      return '<div class="list-row"><div class="info"><strong>' + esc(i.name) + '</strong><small>' + i.qty + ' x ' + money(i.price) + '</small></div><div class="right"><b>' + money(i.price * i.qty) + '</b></div></div>';
    }).join('');
    openModal(
      '<div class="modal-head"><h2>Pedido ' + esc(o.id) + '</h2><button class="icon-btn" type="button" onclick="App.closeModal()">×</button></div>' +
      '<div class="modal-body"><div class="list">' + items + '</div>' +
        '<div class="cart-line total mt-2"><span>Total</span><span>' + money(o.total) + '</span></div>' +
        '<div class="mt-2"><p class="tiny muted" style="margin:0">Cliente: ' + esc(o.customerName) + ' · ' + esc(o.customerPhone) + '</p>' +
        '<p class="tiny muted" style="margin:0">Recebimento: ' + esc(o.method) + ' · Pagamento: ' + esc(o.payment) + '</p>' +
        (o.address ? '<p class="tiny muted" style="margin:0">Endereço: ' + esc(o.address) + '</p>' : '') +
        (o.notes ? '<p class="tiny muted" style="margin:0">Obs.: ' + esc(o.notes) + '</p>' : '') +
        '<p class="tiny muted" style="margin:0">Data: ' + D.dateTime(o.createdAt) + ' · Status: ' + esc(o.status) + '</p></div>' +
      '</div><div class="modal-foot"><button class="btn btn-light" type="button" onclick="App.closeModal()">Fechar</button></div>'
    );
  }

  function saveClientSettings(e, clientId) {
    e.preventDefault();
    const f = e.target;
    const data = new FormData(f);
    const c = clientById(clientId);
    if (!c) return;
    c.name = (data.get('name') || '').toString().trim() || c.name;
    c.logo = (data.get('logo') || c.logo).toString().trim() || c.logo;
    c.tagline = (data.get('tagline') || '').toString().trim();
    c.description = (data.get('description') || '').toString().trim();
    c.cover = (data.get('cover') || '').toString().trim() || c.cover;
    c.whatsapp = (data.get('whatsapp') || '').toString().trim() || c.whatsapp;
    c.phone = (data.get('phone') || '').toString().trim();
    c.address = (data.get('address') || '').toString().trim();
    c.hours = (data.get('hours') || '').toString().trim();
    save();
    toast('Configurações salvas.');
    router();
  }

  function saveSystemSettings(e) {
    e.preventDefault();
    const f = e.target;
    const data = new FormData(f);
    const s = settings();
    s.brand = (data.get('brand') || s.brand).toString().trim();
    s.supportWhatsApp = (data.get('supportWhatsApp') || s.supportWhatsApp).toString().trim();
    s.supportName = (data.get('supportName') || s.supportName).toString().trim();
    s.clientPin = (data.get('clientPin') || s.clientPin).toString().trim();
    s.superPin = (data.get('superPin') || s.superPin).toString().trim();
    const rp = parseFloat(data.get('rentPrice')); if (!isNaN(rp)) s.rentPrice = rp;
    const bm = parseFloat(data.get('buyMin')); if (!isNaN(bm)) s.buyMin = bm;
    const bx = parseFloat(data.get('buyMax')); if (!isNaN(bx)) s.buyMax = bx;
    save();
    toast('Configurações do sistema salvas.');
    router();
  }

  function resetDemo() {
    if (!confirm('Resetar todos os dados de demonstração? Esta ação não pode ser desfeita.')) return;
    db = D.resetDB();
    save();
    toast('Dados de demonstração restaurados.');
    go('#/admin/config');
  }

  function setLoginRole(role) {
    state.loginRole = role;
    router();
  }

  function doLogin(e) {
    e.preventDefault();
    const f = e.target;
    const data = new FormData(f);
    const s = settings();
    if (state.loginRole === 'super') {
      const pin = (data.get('pin') || '').toString().trim();
      if (pin !== s.superPin) { toast('PIN do administrador incorreto.', 'err'); return; }
      D.setSession({ role: 'super' });
    } else {
      const clientId = (data.get('clientId') || '').toString();
      const pin = (data.get('pin') || '').toString().trim();
      if (pin !== s.clientPin) { toast('PIN do cliente incorreto.', 'err'); return; }
      if (!clientId) { toast('Selecione um restaurante.', 'err'); return; }
      D.setSession({ role: 'client', clientId: clientId });
    }
    session = D.getSession();
    toast('Bem-vindo!');
    go(state.loginRole === 'super' ? '#/admin' : '#/painel');
  }

  function logout() {
    D.setSession(null);
    session = null;
    go('#/login');
  }

  function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.toggle('open');
  }

  function openNav() {
    openModal(
      '<div class="modal-head"><h2>Menu</h2><button class="icon-btn" type="button" onclick="App.closeModal()">×</button></div>' +
      '<div class="modal-body"><div class="list">' +
        '<a class="list-row" href="#recursos" onclick="App.closeModal()"><span class="avatar">' + ico('grid', 13) + '</span><div class="info"><strong>Recursos</strong></div></a>' +
        '<a class="list-row" href="#demonstracao" onclick="App.closeModal()"><span class="avatar">' + ico('store', 13) + '</span><div class="info"><strong>Demonstração</strong></div></a>' +
        '<a class="list-row" href="#planos" onclick="App.closeModal()"><span class="avatar">' + ico('wallet', 13) + '</span><div class="info"><strong>Planos</strong></div></a>' +
        '<a class="list-row" href="#/proposta" onclick="App.closeModal()"><span class="avatar">' + ico('receipt', 13) + '</span><div class="info"><strong>Proposta</strong></div></a>' +
        '<a class="list-row" href="#/login" onclick="App.closeModal()"><span class="avatar">' + ico('users', 13) + '</span><div class="info"><strong>Entrar</strong></div></a>' +
      '</div></div>'
    );
  }

  /* ============================ init ============================ */
  window.App = {
    go, toast, openModal, closeModal, backdrop,
    ico, esc, money, clientById,
    setLoginRole, doLogin, logout, toggleSidebar, openNav,
    addToCart, changeQty, openCart, closeCart, goCheckout, backToCart, confirmOrder, sendOrderWhats,
    setCategory, recalcCheckout, openSupport, submitSupport,
    setOrdersFilter, setInboxFilter, openMessage, markMessage, whatsappMessage, sendReply,
    openProductModal, saveProduct, toggleProduct, deleteProduct,
    openClientModal, saveClient, impersonate, backToSuper, archiveClient,
    addCost, deleteCost, updateOrderStatus, viewOrder,
    saveClientSettings, saveSystemSettings, resetDemo,
    openNav: openNav
  };

  if (!location.hash) location.replace('#/');
  window.addEventListener('hashchange', router);
  router();
})();
